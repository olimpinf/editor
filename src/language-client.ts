/**
 * Language Server Protocol Client for EditorOBI
 * Connects Monaco Editor to clangd via WebSocket
 */

import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

export function initLanguageClient(monaco: any, editorInstance: any, options: any = {}) {
  const {
    socketUrl, // Dynamic (e.g., /ws/lsp/cpp/ or /ws/lsp/python/)
    languages = ['cpp', 'c'], // This will be overriden for Python
    workspaceRoot, // Dynamic (e.g., /.../clangd_workspaces/ or /.../python_workspaces/)
    documentUri, 
    debounceDelay = 300,
    maxConcurrentRequests = 2,
  } = options;

  let messageId = 1;
  let initialized = false;
  let changeListener: any = null;
  const webSocket = new WebSocket(socketUrl);

  // Request debouncing and limiting system
  const requestDebounce: { [key: string]: NodeJS.Timeout } = {};
  const concurrentRequests = new Map<string, number>();

/**
   * Maps LSP CompletionItemKind to Monaco's enum
   */
  function toMonacoCompletionItemKind(lspKind: number) {
    const m = monaco.languages.CompletionItemKind; // Now 'monaco' is defined
    switch (lspKind) {
      case 1: return m.Text;
      case 2: return m.Method;
      case 3: return m.Function;
      case 4: return m.Constructor;
      case 5: return m.Field;
      case 6: return m.Variable;
      case 7: return m.Class;
      case 8: return m.Interface;
      case 9: return m.Module;
      case 10: return m.Property;
      case 11: return m.Unit;
      case 12: return m.Value;
      case 13: return m.Enum;
      case 14: return m.Keyword;
      case 15: return m.Snippet;
      case 16: return m.Color;
      case 17: return m.File;
      case 18: return m.Reference;
      case 19: return m.Folder;
      case 20: return m.EnumMember;
      case 21: return m.Constant;
      case 22: return m.Struct;
      case 23: return m.Event;
      case 24: return m.Operator;
      case 25: return m.TypeParameter;
      default: return m.Property;
    }
  }

  console.log('[LSP] Connecting to', socketUrl);
  (webSocket as any).isExplicitlyClosed = false;

  webSocket.onopen = () => {
    console.log('[LSP] WebSocket connected');
    
    const socket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        processId: null,
        rootPath: null,
        rootUri: workspaceRoot,
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
        monaco.languages.register({ id: lang, extensions: ['.cpp', '.h', '.cc', '.c', '.py'] });
      });

      const model = editorInstance.getModel();

      // ================================================================
      // 1. ADD THESE LOGS
      // ================================================================
      console.log('[LSP] textDocument/didOpen Check');
      console.log('  > Model URI:', model.uri.toString());
      console.log('  > Client URI:', documentUri);
      // ================================================================
      
      if (model && model.uri.toString() === documentUri) { // Check URI here too
        writer.write({
          jsonrpc: '2.0',
          method: 'textDocument/didOpen',
          params: {
            textDocument: {
              uri: documentUri,
              languageId: languages[0],
              version: model.getVersionId(),
              text: model.getValue()
            }
          }
        });
      }

      // Track document changes
      // changeListener = editorInstance.onDidChangeModelContent(() => { 
      //   const model = editorInstance.getModel();

      // // ================================================================
      // console.log('[LSP] textDocument/didChange Check');
      // console.log('  > Model URI:', model.uri.toString());
      // console.log('  > Client URI:', documentUri);
      // // ================================================================

      //   // Only send change if it's for the file this client cares about
      //   if (model && model.uri.toString() === documentUri) {
      //     console.log('[LSP] ✅ URIs match! Sending didChange.'); // Also add this
      //     console.log(model.getValue());
      //     writer.write({
      //       jsonrpc: '2.0',
      //       method: 'textDocument/didChange',
      //       params: {
      //         textDocument: {
      //           uri: documentUri,
      //           version: model.getVersionId() 
      //         },
      //         contentChanges: [{ text: model.getValue() }]
      //       }
      //     });
      //   }
      // });

      // Track document changes
      changeListener = editorInstance.onDidChangeModelContent((e) => { // <-- Get the event 'e'
        const model = editorInstance.getModel();

        // Your debug logs (they are still correct)
        console.log('[LSP] textDocument/didChange Check');
        console.log('  > Model URI:', model.uri.toString());
        console.log('  > Client URI:', documentUri);

        if (model && model.uri.toString() === documentUri) {
          console.log('[LSP] ✅ URIs match! Sending didChange.');

          // Convert Monaco's changes to LSP changes
          const contentChanges = e.changes.map(change => {
            return {
              range: {
                start: { line: change.range.startLineNumber - 1, character: change.range.startColumn - 1 },
                end: { line: change.range.endLineNumber - 1, character: change.range.endColumn - 1 }
              },
              rangeLength: change.rangeLength,
              text: change.text
            };
          });
          console.log("Change:", contentChanges)
          writer.write({
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
              textDocument: {
                uri: documentUri,
                version: model.getVersionId()
              },
              contentChanges: contentChanges // <-- Send the mapped deltas
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
      languages.forEach(lang => {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: async (model, position) => {
            const result = await debounceAndLimitRequest('textDocument/completion', {
              textDocument: { uri: documentUri },
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
                kind: toMonacoCompletionItemKind(item.kind),
                detail: item.detail || '',
                documentation: item.documentation,
                insertText: item.insertText || item.label,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: startColumn,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column
                },
                insertTextRules: item.insertTextFormat === 2
                  ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                  : undefined
              };
            });

            return { suggestions };
          },
          triggerCharacters: ['.', ':', '>', ' ', '(']
        });
      });

      // Register definition provider
      languages.forEach(lang => {
        monaco.languages.registerDefinitionProvider(lang, {
          provideDefinition: async (model, position) => {
            const result = await debounceAndLimitRequest('textDocument/definition', {
              textDocument: { uri: documentUri },
              position: {
                line: position.lineNumber - 1,
                character: position.column - 1
              }
            });

            console.log('[LSP] Definition Result:', result);

            if (!result) {
              return null;
            }

            try {
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
            } catch (e) {
              console.error('[LSP] Error parsing definition:', e);
              return null;
            }
          }
        });
      });

      console.log('[LSP] Providers registered');
    }, 100);
  };

  webSocket.onerror = (error) => {
    console.error('[LSP] WebSocket error:', error);
  };

  webSocket.onclose = () => {
    if ((webSocket as any).isExplicitlyClosed) {
        console.log('[LSP] WebSocket closed explicitly by client.');
        return; // Do not reconnect
    }
    
    console.log('[LSP] WebSocket closed. Attempting to reconnect in 3 seconds...');
    setTimeout(() => initLanguageClient(monaco, editorInstance, options), 3000);
  };

  return {
    socket: webSocket,
    close: () => {
      (webSocket as any).isExplicitlyClosed = true;
      if (changeListener) {
        changeListener.dispose();
        changeListener = null;
      }
      webSocket.close(1000, "Client switching language");
    }
  };
}

export default initLanguageClient;

// Also expose globally
(window as any).initLanguageClient = initLanguageClient;

/**
 * Maps LSP CompletionItemKind to Monaco's enum
 */
// function toMonacoCompletionItemKind(lspKind: number) {
//   const m = monaco.languages.CompletionItemKind;
//   switch (lspKind) {
//     case 1: return m.Text;
//     case 2: return m.Method;
//     case 3: return m.Function;
//     case 4: return m.Constructor;
//     case 5: return m.Field;
//     case 6: return m.Variable;
//     case 7: return m.Class;
//     case 8: return m.Interface;
//     case 9: return m.Module;
//     case 10: return m.Property;
//     case 11: return m.Unit;
//     case 12: return m.Value;
//     case 13: return m.Enum;
//     case 14: return m.Keyword;
//     case 15: return m.Snippet;
//     case 16: return m.Color;
//     case 17: return m.File;
//     case 18: return m.Reference;
//     case 19: return m.Folder;
//     case 20: return m.EnumMember;
//     case 21: return m.Constant;
//     case 22: return m.Struct;
//     case 23: return m.Event;
//     case 24: return m.Operator;
//     case 25: return m.TypeParameter;
//     default: return m.Property;
//   }
// }
