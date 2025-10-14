(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vscode-jsonrpc')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vscode-jsonrpc'], factory) :
    (factory((global.vscode_ws_jsonrpc = {}),global.vscode_jsonrpc));
}(this, (function (exports,vscode_jsonrpc) { 'use strict';

    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    function toSocket(webSocket) {
        return {
            send: function (content) { return webSocket.send(content); },
            onMessage: function (cb) { return webSocket.onmessage = function (event) { return cb(event.data); }; },
            onError: function (cb) { return webSocket.onerror = function (event) {
                if ('message' in event) {
                    cb(event.message);
                }
            }; },
            onClose: function (cb) { return webSocket.onclose = function (event) { return cb(event.code, event.reason); }; },
            dispose: function () { return webSocket.close(); }
        };
    }
    function toWebSocket(socket) {
        return socket;
    }
    function isWebSocket(socket) {
        return 'send' in socket && 'onmessage' in socket;
    }

    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    var WebSocketMessageReader = /** @class */ (function (_super) {
        __extends(WebSocketMessageReader, _super);
        function WebSocketMessageReader(socket) {
            var _this = _super.call(this) || this;
            _this.socket = socket;
            _this.socket.onMessage(function (message) { return _this.onData(message); });
            return _this;
        }
        WebSocketMessageReader.prototype.onData = function (message) {
            try {
                var data = JSON.parse(message);
                this.fire(data);
            }
            catch (e) {
                this.fireError(e);
            }
        };
        return WebSocketMessageReader;
    }(vscode_jsonrpc.ReadableStream));

    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    var WebSocketMessageWriter = /** @class */ (function () {
        function WebSocketMessageWriter(socket) {
            this.socket = socket;
        }
        WebSocketMessageWriter.prototype.write = function (msg) {
            var content = JSON.stringify(msg);
            this.socket.send(content);
        };
        return WebSocketMessageWriter;
    }());

    exports.toSocket = toSocket;
    exports.toWebSocket = toWebSocket;
    exports.isWebSocket = isWebSocket;
    exports.WebSocketMessageReader = WebSocketMessageReader;
    exports.WebSocketMessageWriter = WebSocketMessageWriter;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=bundle.js.map

