// static/js/language-client.js

// Import the necessary components from the esm.sh CDN.
import { MonacoLanguageClient, CloseAction, ErrorAction } from 'https://esm.sh/monaco-languageclient@8.1.0';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'https://esm.sh/vscode-ws-jsonrpc/browser';

// Export the function so editor.js can import it.
export function launchLanguageClient(language) {
    console.log(`Attempting to launch Language Client for ${language}...`);

    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws/${language}/`;
    const webSocket = new WebSocket(url);

    webSocket.onopen = () => {
        console.log(`WebSocket opened for ${language}.`);
        const reader = new WebSocketMessageReader(webSocket);
        const writer = new WebSocketMessageWriter(webSocket);

        const client = new MonacoLanguageClient({
            name: `${language.toUpperCase()} Language Client`,
            clientOptions: {
                documentSelector: [language],
                errorHandler: {
                    error: () => ({ action: ErrorAction.Continue }),
                    closed: () => ({ action: CloseAction.DoNotRestart }),
                },
            },
            connectionProvider: {
                get: () => Promise.resolve({ reader, writer })
            }
        });

        client.start();
        console.log(`${language.toUpperCase()} Language Client started.`);
        reader.onClose(() => client.stop());
    };

    webSocket.onerror = (event) => {
        console.error("WebSocket Error:", event);
    };
}
