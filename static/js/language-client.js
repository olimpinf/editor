// This file requires monaco-editor to be loaded first.
// It sets up the connection between the Monaco editor and a backend language server.

(function () {
    // Ensure this script runs only once
    if (window.languageClientManager) {
        return;
    }

    // --- Configuration ---
    // IMPORTANT: Replace this with the actual URL of your backend server.
    const BACKEND_WEBSOCKET_URL = 'ws://localhost:3000'; 

    let activeConnection = null;

    /**
     * Creates a URL for a specific language server.
     * @param {string} language - The language ID (e.g., 'cpp', 'java', 'python').
     * @returns {string} The WebSocket URL.
     */
    function createUrl(language) {
        // Example: ws://localhost:3000/java
        return `${BACKEND_WEBSOCKET_URL}/${language}`;
    }

    /**
     * Creates the WebSocket connection.
     * We are using a modern library-less approach.
     * For older browser support or more complex needs, you might use a library.
     * @param {string} url - The WebSocket URL to connect to.
     * @returns {WebSocket}
     */
    function createWebSocket(url) {
        return new WebSocket(url);
    }

    /**
     * Connects the editor to a language server for the given language.
     * Disconnects any previously active connection.
     * @param {string} language - The language ID ('cpp', 'java', 'python').
     */
    function connectLanguageServer(language) {
        console.log(`Attempting to connect to language server for: ${language}`);

        // 1. Disconnect the previous server if it exists
        if (activeConnection) {
            console.log(`Closing previous connection for: ${activeConnection.language}`);
            activeConnection.close();
            activeConnection = null;
        }

        // We only support these languages with a language server
        const supportedLanguages = ['cpp', 'java', 'python'];
        if (!supportedLanguages.includes(language)) {
            console.log(`Language '${language}' does not have a configured language server. Intellisense will be basic.`);
            return;
        }

        // 2. Define the language client services
        const url = createUrl(language);
        const webSocket = createWebSocket(url);

        webSocket.onopen = () => {
            console.log(`WebSocket connection opened for ${language}`);
            const socket = {
                send: content => webSocket.send(content),
                onMessage: cb => webSocket.onmessage = event => cb(event.data),
                onError: cb => webSocket.onerror = event => cb(event),
                onClose: cb => webSocket.onclose = event => cb(event),
                dispose: () => webSocket.close()
            };

            if (monaco.languages.json) { // A good check to see if monaco is ready
                // The main language client connection logic
                const connection = monaco.languages.createLanguageClient({
                    name: `${language.toUpperCase()} Language Client`,
                    clientOptions: {
                        documentSelector: [language],
                    },
                    connectionProvider: {
                        get: () => {
                            return Promise.resolve({
                                reader: {
                                    onClose: socket.onClose,
                                    onError: socket.onError,
                                    onData: socket.onMessage,
                                },
                                writer: {
                                    send: socket.send,
                                    onClose: socket.onClose,
                                    onError: socket.onError,
                                }
                            });
                        }
                    }
                });
                
                connection.start();
                console.log(`${language.toUpperCase()} Language Client started.`);
                
                // Keep track of the current connection to close it later
                activeConnection = {
                    language: language,
                    close: () => connection.stop()
                };
            }
        };

        webSocket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            // You could show a visual indicator to the user here
        };
        
        webSocket.onclose = () => {
            console.log(`WebSocket connection closed for ${language}.`);
        };
    }

    // Expose the manager to the global scope to be used by editor.js
    window.languageClientManager = {
        connect: connectLanguageServer
    };

})();
