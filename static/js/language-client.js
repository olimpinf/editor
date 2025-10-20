/**
 * Language Server Protocol Client for EditorOBI
 * Connects Monaco Editor to clangd via WebSocket
 */

function initLanguageClient(monaco, editorInstance, options = {}) {
  const {
    socketUrl = 'wss://olimpiada.ic.unicamp.br/ws/clangd/',
    languages = ['cpp', 'c'],
    debounceDelay = 300,
    maxConcurrentRequests = 2
  } = options;

  let messageId = 1;
  let initialized = false;
  const webSocket = new WebSocket(socketUrl);

  // Request debouncing and limiting system
  const requestDebounce = {};
  const concurrentRequests = new Map();

  console.log('[LSP] Connecting to', socketUrl);

  webSocket.onopen = () => {
    console.log('[LSP] WebSocket connected');
    
    // Get vscode-ws-jsonrpc from global (loaded via CDN)
    if (!window.toSocket || !window.WebSocketMessageReader || !window.WebSocketMessageWriter) {
      console.error('[LSP] vscode-ws-jsonrpc libraries not loaded');
      return;
    }

    const socket = window.toSocket(webSocket);
    const reader = new window.WebSocketMessageReader(socket);
    const writer = new window.WebSocketMessageWriter(socket);

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        processId: null,
        rootPath: null,
        rootUri: 'file:///workspace',
        capabilities: {
          textDocument: {
            synchronization: { didChange: { syncKind: 1 } },
            completion: { completionItem: { snippetSupport: true } }
          }
        }
      }
    };

    writer.write(initRequest);

    // Send initialized notification
    setTimeout(() => {
      writer.write({
        jsonrpc: '2.0',
        method: 'initialized',
        params: {}
      });
      initialized = true;
      console.log('[LSP] Initialized');

      // Register languages
      languages.forEach(lang => {
        monaco.languages.register({ id: lang, extensions: ['.cpp', '.h', '.cc', '.c'] });
      });

      const model = editorInstance.getModel();
      if (model) {
        writer.write({
          jsonrpc: '2.0',
          method: 'textDocument/didOpen',
          params: {
            textDocument: {
              uri: 'file:///workspace/main.cpp',
              languageId: 'cpp',
              version: 1,
              text: model.getValue()
            }
          }
        });
      }

      // Track document changes
      editorInstance.onDidChangeModelContent(() => {
        const model = editorInstance.getModel();
        if (model) {
          writer.write({
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
              textDocument: {
                uri: 'file:///workspace/main.cpp',
                version: 1
              },
              contentChanges: [{ text: model.getValue() }]
            }
          });
        }
      });

      // Helper function to send LSP requests
      const sendLspRequest = (method, params) => {
        return new Promise((resolve) => {
          const requestId = messageId++;
          
          writer.write({
            jsonrpc: '2.0',
            id: requestId,
            method: method,
            params: params
          });

          const timeout = setTimeout(() => {
            console.log(`[LSP] ${method} request timed out`);
            webSocket.removeEventListener('message', listener);
            resolve(null);
          }, 2000);

          const listener = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.id === requestId) {
                clearTimeout(timeout);
                webSocket.removeEventListener('message', listener);
                resolve(data.result || null);
              }
            } catch {
              // ignore parse errors
            }
          };

          webSocket.addEventListener('message', listener);
        });
      };

      // Debounce and limit requests
      const debounceAndLimitRequest = async (method, params) => {
        if (requestDebounce[method]) {
          clearTimeout(requestDebounce[method]);
        }

        return new Promise((resolve) => {
          requestDebounce[method] = setTimeout(async () => {
            const currentRequests = concurrentRequests.get(method) || 0;
            if (currentRequests >= maxConcurrentRequests) {
              console.log(`[LSP] Skipping ${method} - max concurrent requests reached`);
              resolve(null);
              return;
            }

            concurrentRequests.set(method, currentRequests + 1);
            
            try {
              const result = await sendLspRequest(method, params);
              resolve(result);
            } finally {
              concurrentRequests.set(method, Math.max(0, (concurrentRequests.get(method) || 1) - 1));
            }
          }, debounceDelay);
        });
      };

      // Register completion provider
      monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: async (model, position) => {
          const result = await debounceAndLimitRequest('textDocument/completion', {
            textDocument: { uri: 'file:///workspace/main.cpp' },
            position: {
              line: position.lineNumber - 1,
              character: position.column - 1
            }
          });

          if (!result) {
            return { suggestions: [] };
          }

          const items = Array.isArray(result) ? result : result?.items || [];
          const suggestions = items.map((item) => {
            let startColumn = position.column;
            
            const lineContent = model.getLineContent(position.lineNumber);
            for (let i = position.column - 2; i >= 0; i--) {
              const char = lineContent[i];
              if (!/[a-zA-Z0-9_]/.test(char)) {
                startColumn = i + 2;
                break;
              }
              if (i === 0) {
                startColumn = 1;
              }
            }

            return {
              label: item.label,
              kind: 9,
              detail: item.detail || '',
              documentation: item.documentation,
              insertText: item.insertText || item.label,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: startColumn,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            };
          });
          
          return { suggestions };
        },
        triggerCharacters: ['.', ':', '>', ' ', '(']
      });

      // Register definition provider
      monaco.languages.registerDefinitionProvider('cpp', {
        provideDefinition: async (model, position) => {
          const result = await debounceAndLimitRequest('textDocument/definition', {
            textDocument: { uri: 'file:///workspace/main.cpp' },
            position: {
              line: position.lineNumber - 1,
              character: position.column - 1
            }
          });

          if (!result) {
            return null;
          }

          const locations = Array.isArray(result) ? result : [result];
          
          return locations.map((loc) => ({
            uri: monaco.Uri.parse(loc.uri),
            range: {
              startLineNumber: loc.range.start.line + 1,
              startColumn: loc.range.start.character + 1,
              endLineNumber: loc.range.end.line + 1,
              endColumn: loc.range.end.character + 1
            }
          }));
        }
      });

      console.log('[LSP] Providers registered');
    }, 100);
  };

  webSocket.onerror = (error) => {
    console.error('[LSP] WebSocket error:', error);
  };

  webSocket.onclose = () => {
    console.log('[LSP] WebSocket closed. Attempting to reconnect in 3 seconds...');
    setTimeout(() => initLanguageClient(monaco, editorInstance, options), 3000);
  };

  return webSocket;
}
