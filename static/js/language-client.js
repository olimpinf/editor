// static/js/language-client.js
// Monaco ⇄ LSP for browser using monaco-languageclient v8

// Import v8 directly from jsDelivr
import * as MLC from 'https://cdn.jsdelivr.net/npm/monaco-languageclient@8.1.0/lib/index.js';

// Transport helpers from vscode-ws-jsonrpc
import {
  toSocket,
  createWebSocketConnection
} from 'https://cdn.jsdelivr.net/npm/vscode-ws-jsonrpc@3.5.0/lib/index.js';

// Resolve exports defensively (CDN builds sometimes vary)
const MonacoLanguageClient = MLC.MonacoLanguageClient ?? MLC.default ?? MLC;

// Tiny enums (some CDN builds omit named exports)
const CloseAction = MLC.CloseAction ?? { Restart: 1, DoNotRestart: 2 };
const ErrorAction = MLC.ErrorAction ?? { Continue: 1, Shutdown: 2 };

/**
 * Start a Monaco Language Client over WebSocket (v8).
 * Call this only after the VS Code API shim has been initialized.
 *
 * @param {object} opts
 * @param {string} opts.socketUrl  e.g. "wss://olimpiada.ic.unicamp.br/ws/cpp/"
 * @param {string[]} [opts.languages] e.g. ['cpp','python','java']
 * @param {(client:any)=>void} [opts.onReady]
 */
export function startLanguageClient({ socketUrl, languages = ['plaintext'], onReady } = {}) {
  if (!socketUrl) {
    console.error('[LSP] Missing socketUrl');
    return;
  }

  console.log('[LSP] Connecting to', socketUrl);
  const ws = new WebSocket(socketUrl); // add 'lsp' subprotocol if your server requires it

  ws.onopen = () => {
    console.log('[LSP] WebSocket connected');

    // Wrap native WebSocket to the interface expected by json-rpc
    const socket = toSocket(ws);
    const rpc = createWebSocketConnection(socket, console);

    const client = new MonacoLanguageClient({
      name: 'Monaco LSP Client',
      clientOptions: {
        documentSelector: languages,
        errorHandler: {
          error:  () => ({ action: ErrorAction.Continue }),
          closed: () => ({ action: CloseAction.Restart }),
        },
      },
      connectionProvider: { get: () => Promise.resolve(rpc) },
    });

    client.start();
    rpc.onClose(() => {
      console.log('[LSP] RPC closed');
      client.stop();
    });
    rpc.listen();

    onReady && onReady(client);
  };

  ws.onerror = (e) => console.warn('[LSP] WebSocket error', e);
  ws.onclose  = (e) => console.warn('[LSP] WebSocket closed', e.code, e.reason);
}
