// --- Language Client Logic (formerly language-client.js) ---
    // This is now placed inside the main callback to ensure all libraries are loaded first.
    //
    (function () {
        const isSecure = window.location.protocol === 'https:';
        const protocol = isSecure ? 'wss://' : 'ws://';
        const WEBSOCKET_BASE_URL = `${protocol}${window.location.host}/ws`;
        let activeLanguageClient = null;

        function createUrl(language) {
            return `${WEBSOCKET_BASE_URL}/${language}/`;
        }

        function connectLanguageServer(language) {
            if (activeLanguageClient) {
                activeLanguageClient.stop();
                activeLanguageClient = null;
            }
            const supportedLanguages = ['cpp', 'java', 'python'];
            if (!supportedLanguages.includes(language)) {
                console.log(`Language '${language}' does not have a configured language server.`);
                return;
            }

            console.log(`Attempting to connect to language server for: ${language} at ${createUrl(language)}`);
            
            const url = createUrl(language);
            const webSocket = new WebSocket(url);
            
            // CORRECTED: This is the proper way to create the connection for this library version.
            const connectionProvider = {
                get: () => {
                    return Promise.resolve(new monaco.languages.WebSocketMessageReader(webSocket), new monaco.languages.WebSocketMessageWriter(webSocket));
                }
            };
            
            const client = new monaco.languages.MonacoLanguageClient({
                name: `${language.toUpperCase()} Language Client`,
                clientOptions: {
                    documentSelector: [language]
                },
                connectionProvider: connectionProvider
            });

            const disposable = client.start();
            console.log(`${language.toUpperCase()} Language Client starting...`);

            webSocket.onopen = () => console.log("WebSocket connection opened successfully.");
            webSocket.onerror = (err) => console.error("WebSocket Error:", err);
            webSocket.onclose = (event) => {
                console.log(`WebSocket connection closed. Disposing client. Code: ${event.code}`);
                disposable.dispose();
            };

            activeLanguageClient = {
                language: language,
                stop: () => disposable.dispose()
            };
        }

        window.languageClientManager = {
            connect: connectLanguageServer
        };
    })();
