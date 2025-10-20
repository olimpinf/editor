/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vscode-ws-jsonrpc'), require('vscode-jsonrpc'), require('vscode-languageserver-protocol')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vscode-ws-jsonrpc', 'vscode-jsonrpc', 'vscode-languageserver-protocol'], factory) :
    (factory((global.monaco = global.monaco || {}, global.monaco.languages = global.monaco.languages || {}),global.vscode_ws_jsonrpc,global.vscode_jsonrpc,global.vscode_languageserver_protocol));
}(this, (function (exports,vscode_ws_jsonrpc,vscode_jsonrpc,vscode_languageserver_protocol) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
                t[p[i]] = s[p[i]];
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __exportStar(m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    function __importStar(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result.default = mod;
        return result;
    }

    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }

    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    var MonacoToProtocolConverter = /** @class */ (function () {
        function MonacoToProtocolConverter(monaco) {
            this.monaco = monaco;
        }
        MonacoToProtocolConverter.prototype.asPosition = function (lineNumber, column) {
            return {
                line: lineNumber - 1,
                character: column - 1
            };
        };
        MonacoToProtocolConverter.prototype.asRange = function (range) {
            if (range === undefined) {
                return undefined;
            }
            if (range === null) {
                return null;
            }
            var start = this.asPosition(range.startLineNumber, range.startColumn);
            var end = this.asPosition(range.endLineNumber, range.endColumn);
            return {
                start: start,
                end: end
            };
        };
        MonacoToProtocolConverter.prototype.asTextDocumentIdentifier = function (model) {
            return {
                uri: model.uri.toString()
            };
        };
        MonacoToProtocolConverter.prototype.asTextDocumentPositionParams = function (model, position) {
            return {
                textDocument: this.asTextDocumentIdentifier(model),
                position: this.asPosition(position.lineNumber, position.column)
            };
        };
        MonacoToProtocolConverter.prototype.asCompletionParams = function (model, position, context) {
            return __assign({}, this.asTextDocumentPositionParams(model, position), { context: this.asCompletionContext(context) });
        };
        MonacoToProtocolConverter.prototype.asCompletionContext = function (context) {
            return {
                triggerKind: this.asCompletionTriggerKind(context.triggerKind),
                triggerCharacter: context.triggerCharacter
            };
        };
        MonacoToProtocolConverter.prototype.asCompletionTriggerKind = function (triggerKind) {
            switch (triggerKind) {
                case this.monaco.languages.CompletionTriggerKind.TriggerCharacter:
                    return vscode_languageserver_protocol.CompletionTriggerKind.TriggerCharacter;
                case this.monaco.languages.CompletionTriggerKind.TriggerForIncompleteCompletions:
                    return vscode_languageserver_protocol.CompletionTriggerKind.TriggerForIncompleteCompletions;
                default:
                    return vscode_languageserver_protocol.CompletionTriggerKind.Invoked;
            }
        };
        MonacoToProtocolConverter.prototype.asSignatureHelpParams = function (model, position) {
            return this.asTextDocumentPositionParams(model, position);
        };
        MonacoToProtocolConverter.prototype.asReferenceParams = function (model, position, options) {
            return {
                textDocument: this.asTextDocumentIdentifier(model),
                position: this.asPosition(position.lineNumber, position.column),
                context: { includeDeclaration: options.includeDeclaration }
            };
        };
        MonacoToProtocolConverter.prototype.asDocumentSymbolParams = function (model) {
            return {
                textDocument: this.asTextDocumentIdentifier(model)
            };
        };
        MonacoToProtocolConverter.prototype.asCodeActionContext = function (context) {
            if (context === undefined || context === null) {
                return undefined;
            }
            var diagnostics = [];
            if (context.markers) {
                for (var _i = 0, _a = context.markers; _i < _a.length; _i++) {
                    var marker = _a[_i];
                    diagnostics.push(this.asDiagnostic(marker));
                }
            }
            return {
                diagnostics: diagnostics,
                only: context.only ? [context.only] : undefined
            };
        };
        MonacoToProtocolConverter.prototype.asDiagnostic = function (marker) {
            var range = this.asRange(new this.monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn));
            var severity = this.asDiagnosticSeverity(marker.severity);
            return vscode_languageserver_protocol.Diagnostic.create(range, marker.message, severity, marker.code, marker.source);
        };
        MonacoToProtocolConverter.prototype.asDiagnosticSeverity = function (severity) {
            switch (severity) {
                case this.monaco.MarkerSeverity.Error:
                    return vscode_languageserver_protocol.DiagnosticSeverity.Error;
                case this.monaco.MarkerSeverity.Warning:
                    return vscode_languageserver_protocol.DiagnosticSeverity.Warning;
                case this.monaco.MarkerSeverity.Info:
                    return vscode_languageserver_protocol.DiagnosticSeverity.Information;
                case this.monaco.MarkerSeverity.Hint:
                    return vscode_languageserver_protocol.DiagnosticSeverity.Hint;
            }
            return undefined;
        };
        MonacoToProtocolConverter.prototype.asDocumentHighlightParams = function (model, position) {
            return this.asTextDocumentPositionParams(model, position);
        };
        MonacoToProtocolConverter.prototype.asDocumentLinkParams = function (model) {
            return {
                textDocument: this.asTextDocumentIdentifier(model)
            };
        };
        MonacoToProtocolConverter.prototype.asFormattingOptions = function (options) {
            return {
                tabSize: options.tabSize,
                insertSpaces: options.insertSpaces
            };
        };
        MonacoToProtocolConverter.prototype.asDocumentRangeFormattingParams = function (model, range, options) {
            return {
                textDocument: this.asTextDocumentIdentifier(model),
                range: this.asRange(range),
                options: this.asFormattingOptions(options)
            };
        };
        MonacoToProtocolConverter.prototype.asDocumentOnTypeFormattingParams = function (model, position, ch, options) {
            return {
                textDocument: this.asTextDocumentIdentifier(model),
                position: this.asPosition(position.lineNumber, position.column),
                ch: ch,
                options: this.asFormattingOptions(options)
            };
        };
        MonacoToProtocolConverter.prototype.asRenameParams = function (model, position, newName) {
            return {
                textDocument: this.asTextDocumentIdentifier(model),
                position: this.asPosition(position.lineNumber, position.column),
                newName: newName
            };
        };
        MonacoToProtocolConverter.prototype.asHoverParams = function (model, position) {
            return this.asTextDocumentPositionParams(model, position);
        };
        MonacoToProtocolConverter.prototype.asCodeLensParams = function (model) {
            return {
                textDocument: this.asTextDocumentIdentifier(model)
            };
        };
        MonacoToProtocolConverter.prototype.asCodeLens = function (item) {
            var result = vscode_languageserver_protocol.CodeLens.create(this.asRange(item.range));
            if (item.command) {
                result.command = this.asCommand(item.command);
            }
            return result;
        };
        MonacoToProtocolConverter.prototype.asCommand = function (command) {
            var result = vscode_languageserver_protocol.Command.create(command.title, command.id);
            if (command.arguments) {
                result.arguments = command.arguments;
            }
            return result;
        };
        return MonacoToProtocolConverter;
    }());
    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    var ProtocolToMonacoConverter = /** @class */ (function () {
        function ProtocolToMonacoConverter(monaco) {
            this.monaco = monaco;
        }
        ProtocolToMonacoConverter.prototype.asSeverity = function (severity) {
            switch (severity) {
                case vscode_languageserver_protocol.DiagnosticSeverity.Error:
                    return this.monaco.MarkerSeverity.Error;
                case vscode_languageserver_protocol.DiagnosticSeverity.Warning:
                    return this.monaco.MarkerSeverity.Warning;
                case vscode_languageserver_protocol.DiagnosticSeverity.Information:
                    return this.monaco.MarkerSeverity.Info;
                case vscode_languageserver_protocol.DiagnosticSeverity.Hint:
                    return this.monaco.MarkerSeverity.Hint;
            }
            return this.monaco.MarkerSeverity.Info;
        };
        ProtocolToMonacoConverter.prototype.asMarker = function (diagnostic) {
            var range = this.asRange(diagnostic.range);
            return {
                code: typeof diagnostic.code === 'number' ? String(diagnostic.code) : diagnostic.code,
                severity: this.asSeverity(diagnostic.severity),
                message: diagnostic.message,
                source: diagnostic.source,
                startLineNumber: range.startLineNumber,
                startColumn: range.startColumn,
                endLineNumber: range.endLineNumber,
                endColumn: range.endColumn,
                relatedInformation: this.asRelatedInformation(diagnostic.relatedInformation)
            };
        };
        ProtocolToMonacoConverter.prototype.asRelatedInformation = function (relatedInformation) {
            if (!relatedInformation) {
                return undefined;
            }
            return relatedInformation.map(function (item) { return ({
                resource: monaco.Uri.parse(item.location.uri),
                message: item.message,
                startLineNumber: item.location.range.start.line + 1,
                startColumn: item.location.range.start.character + 1,
                endLineNumber: item.location.range.end.line + 1,
                endColumn: item.location.range.end.character + 1,
            }); });
        };
        ProtocolToMonacoConverter.prototype.asRange = function (range) {
            if (range === undefined) {
                return undefined;
            }
            if (range === null) {
                return null;
            }
            var start = this.asPosition(range.start);
            var end = this.asPosition(range.end);
            return new this.monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        };
        ProtocolToMonacoConverter.prototype.asPosition = function (position) {
            if (position === undefined) {
                return undefined;
            }
            if (position === null) {
                return null;
            }
            return new this.monaco.Position(position.line + 1, position.character + 1);
        };
        ProtocolToMonacoConverter.prototype.asCompletionResult = function (result, defaultRange) {
            var items = Array.isArray(result) ? result : result.items;
            return {
                incomplete: Array.isArray(result) ? false : result.isIncomplete,
                suggestions: this.asCompletionItems(items, defaultRange)
            };
        };
        ProtocolToMonacoConverter.prototype.asCompletionItems = function (items, defaultRange) {
            var _this = this;
            return items.map(function (item) { return _this.asCompletionItem(item, defaultRange); });
        };
        ProtocolToMonacoConverter.prototype.asCompletionItem = function (item, defaultRange) {
            var result = {
                label: item.label,
                kind: this.asCompletionItemKind(item.kind),
                detail: item.detail,
                documentation: this.asDocumentation(item.documentation),
                filterText: item.filterText,
                insertText: this.asInsertText(item),
                range: this.asCompletionItemRange(item, defaultRange),
                sortText: item.sortText,
                preselect: item.preselect
            };
            // @ts-ignore
            result.insertTextRules = this.asInsertTextRules(item);
            return result;
        };
        ProtocolToMonacoConverter.prototype.asCompletionItemRange = function (item, defaultRange) {
            if (item.textEdit) {
                if (item.textEdit.insert && item.textEdit.replace) {
                    return {
                        insert: this.asRange(item.textEdit.insert),
                        replace: this.asRange(item.textEdit.replace)
                    };
                }
                else {
                    return this.asRange(item.textEdit.range);
                }
            }
            return defaultRange;
        };
        ProtocolToMonacoConverter.prototype.asInsertText = function (item) {
            if (item.textEdit) {
                return item.textEdit.newText;
            }
            return item.insertText || item.label;
        };
        ProtocolToMonacoConverter.prototype.asInsertTextRules = function (item) {
            var insertText = this.asInsertText(item);
            if (item.insertTextFormat === vscode_languageserver_protocol.InsertTextFormat.Snippet) {
                return this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }
            return undefined;
        };
        ProtocolToMonacoConverter.prototype.asDocumentation = function (documentation) {
            if (vscode_languageserver_protocol.MarkupContent.is(documentation)) {
                return {
                    value: documentation.value
                };
            }
            return documentation;
        };
        ProtocolToMonacoConverter.prototype.asCompletionItemKind = function (kind) {
            if (kind) {
                if (kind >= vscode_languageserver_protocol.CompletionItemKind.Text && kind <= vscode_languageserver_protocol.CompletionItemKind.TypeParameter) {
                    return kind - 1;
                }
            }
            return this.monaco.languages.CompletionItemKind.Text;
        };
        ProtocolToMonacoConverter.prototype.asSignatureHelp = function (item) {
            if (!item) {
                return undefined;
            }
            var result = {
                signatures: [],
                activeSignature: item.activeSignature || 0,
                activeParameter: item.activeParameter || 0
            };
            if (item.signatures) {
                for (var _i = 0, _a = item.signatures; _i < _a.length; _i++) {
                    var signature = _a[_i];
                    result.signatures.push(this.asSignatureInformation(signature));
                }
            }
            return result;
        };
        ProtocolToMonacoConverter.prototype.asSignatureInformation = function (item) {
            var result = {
                label: item.label,
                documentation: this.asDocumentation(item.documentation),
                parameters: []
            };
            if (item.parameters) {
                for (var _i = 0, _a = item.parameters; _i < _a.length; _i++) {
                    var parameter = _a[_i];
                    result.parameters.push(this.asParameterInformation(parameter));
                }
            }
            return result;
        };
        ProtocolToMonacoConverter.prototype.asParameterInformation = function (item) {
            var result = {
                label: item.label,
                documentation: this.asDocumentation(item.documentation)
            };
            return result;
        };
        ProtocolToMonacoConverter.prototype.asLocation = function (item) {
            if (!item) {
                return undefined;
            }
            return {
                uri: this.monaco.Uri.parse(item.uri),
                range: this.asRange(item.range)
            };
        };
        ProtocolToMonacoConverter.prototype.asReferences = function (items) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asLocation(item); });
        };
        ProtocolToMonacoConverter.prototype.asDocumentHighlights = function (items) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asDocumentHighlight(item); });
        };
        ProtocolToMonacoConverter.prototype.asDocumentHighlight = function (item) {
            var result = {
                range: this.asRange(item.range),
                kind: this.asDocumentHighlightKind(item.kind)
            };
            return result;
        };
        ProtocolToMonacoConverter.prototype.asDocumentHighlightKind = function (kind) {
            if (!kind) {
                return this.monaco.languages.DocumentHighlightKind.Text;
            }
            switch (kind) {
                case vscode_languageserver_protocol.DocumentHighlightKind.Text:
                    return this.monaco.languages.DocumentHighlightKind.Text;
                case vscode_languageserver_protocol.DocumentHighlightKind.Read:
                    return this.monaco.languages.DocumentHighlightKind.Read;
                case vscode_languageserver_protocol.DocumentHighlightKind.Write:
                    return this.monaco.languages.DocumentHighlightKind.Write;
            }
            return this.monaco.languages.DocumentHighlightKind.Text;
        };
        ProtocolToMonacoConverter.prototype.asSymbolInformations = function (items, uri) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asSymbolInformation(item, uri); });
        };
        ProtocolToMonacoConverter.prototype.asSymbolInformation = function (item, uri) {
            // Log a warning if the symbol location is in a different file
            // We need to do this because we don't have support for that yet
            // See https://github.com/Microsoft/monaco-editor/issues/3 символы в разных файлах
            if (item.location.uri !== uri) {
                console.warn('Cannot display symbol in different file. Every symbol needs to be in the same file.');
            }
            return {
                name: item.name,
                containerName: item.containerName,
                kind: this.asSymbolKind(item.kind),
                location: this.asLocation(item.location)
            };
        };
        ProtocolToMonacoConverter.prototype.asSymbolKind = function (kind) {
            if (kind <= vscode_languageserver_protocol.SymbolKind.TypeParameter) {
                // Monaco SymbolKind is off by one because it starts at 0, and LSP SymbolKind starts at 1
                // except for that, they match
                return kind - 1;
            }
            return this.monaco.languages.SymbolKind.Property;
        };
        ProtocolToMonacoConverter.prototype.asDocumentSymbols = function (items) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asDocumentSymbol(item); });
        };
        ProtocolToMonacoConverter.prototype.asDocumentSymbol = function (symbol) {
            var result = {
                name: symbol.name,
                detail: symbol.detail || '',
                kind: this.asSymbolKind(symbol.kind),
                range: this.asRange(symbol.range),
                selectionRange: this.asRange(symbol.selectionRange),
                children: (symbol.children || []).map(function (child) { return this.asDocumentSymbol(child); }.bind(this))
            };
            return result;
        };
        ProtocolToMonacoConverter.prototype.asAction = function (item) {
            var _this = this;
            var result = {
                title: item.title,
                command: item.command ? this.asCommand(item.command) : undefined,
                diagnostics: item.diagnostics ? item.diagnostics.map(function (diag) { return _this.asMarker(diag); }) : undefined,
                edit: item.edit ? this.asWorkspaceEdit(item.edit) : undefined,
                kind: item.kind,
            };
            return result;
        };
        ProtocolToMonacoConverter.prototype.asCodeAction = function (item) {
            return this.asAction(item);
        };
        ProtocolToMonacoConverter.prototype.asCodeActions = function (items) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asCodeAction(item); });
        };
        ProtocolToMonacoConverter.prototype.asCommand = function (command) {
            if (!command) {
                return undefined;
            }
            return {
                id: command.command,
                title: command.title,
                arguments: command.arguments
            };
        };
        ProtocolToMonacoConverter.prototype.asCodeLens = function (item) {
            if (!item) {
                return undefined;
            }
            var result = {
                range: this.asRange(item.range),
                id: item.data ? JSON.stringify(item.data) : undefined,
                command: this.asCommand(item.command)
            };
            return result;
        };
        ProtocolToMonacoConverter.prototype.asCodeLenses = function (items) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asCodeLens(item); });
        };
        ProtocolToMonacoConverter.prototype.asWorkspaceEdit = function (item) {
            var _this = this;
            if (!item) {
                return undefined;
            }
            var result = {
                edits: []
            };
            if (item.changes) {
                var _loop_1 = function (uri) {
                    var edits = item.changes[uri];
                    if (edits) {
                        result.edits.push.apply(result.edits, __spread(edits.map(function (edit) { return ({
                            resource: _this.monaco.Uri.parse(uri),
                            edit: {
                                range: _this.asRange(edit.range),
                                text: edit.newText
                            }
                        }); })));
                    }
                };
                for (var uri in item.changes) {
                    _loop_1(uri);
                }
            }
            if (item.documentChanges) {
                var _loop_2 = function (change) {
                    if (vscode_languageserver_protocol.TextDocumentEdit.is(change)) {
                        result.edits.push.apply(result.edits, __spread(change.edits.map(function (edit) { return ({
                            resource: _this.monaco.Uri.parse(change.textDocument.uri),
                            edit: {
                                range: _this.asRange(edit.range),
                                text: edit.newText
                            }
                        }); })));
                    }
                };
                for (var _i = 0, _a = item.documentChanges; _i < _a.length; _i++) {
                    var change = _a[_i];
                    _loop_2(change);
                }
            }
            return result;
        };
        ProtocolToMonacoConverter.prototype.asDocumentLinks = function (items) {
            var _this = this;
            if (!items) {
                return [];
            }
            return items.map(function (item) { return _this.asDocumentLink(item); });
        };
        ProtocolToMonacoConverter.prototype.asDocumentLink = function (item) {
            return {
                range: this.asRange(item.range),
                url: item.target
            };
        };
        ProtocolToMonacoConverter.prototype.asTextEdits = function (items) {
            var _this = this;
            if (!items) {
                return undefined;
            }
            return items.map(function (item) { return _this.asTextEdit(item); });
        };
        ProtocolToMonacoConverter.prototype.asTextEdit = function (item) {
            return {
                range: this.asRange(item.range),
                text: item.newText
            };
        };
        ProtocolToMonacoConverter.prototype.asHover = function (hover) {
            return {
                contents: this.asMarkedStrings(hover.contents),
                range: this.asRange(hover.range)
            };
        };
        ProtocolToMonacoConverter.prototype.asMarkedStrings = function (contents) {
            var result = [];
            if (Array.isArray(contents)) {
                for (var _i = 0, contents_1 = contents; _i < contents_1.length; _i++) {
                    var content = contents_1[_i];
                    result.push(this.asMarkedString(content));
                }
            }
            else {
                result.push(this.asMarkedString(contents));
            }
            return result;
        };
        ProtocolToMonacoConverter.prototype.asMarkedString = function (content) {
            if (typeof content === 'string') {
                return {
                    value: content
                };
            }
            return {
                language: content.language,
                value: content.value
            };
        };
        return ProtocolToMonacoConverter;
    }());
    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    var __extends$1 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var ConsoleLogger = /** @class */ (function () {
        function ConsoleLogger() {
        }
        ConsoleLogger.prototype.error = function (message) {
            console.error(message);
        };
        ConsoleLogger.prototype.warn = function (message) {
            console.warn(message);
        };
        ConsoleLogger.prototype.info = function (message) {
            console.info(message);
        };
        ConsoleLogger.prototype.log = function (message) {
            console.log(message);
        };
        return ConsoleLogger;
    }());
    var LspClient = /** @class */ (function () {
        function LspClient(connection) {
            this.connection = connection;
        }
        LspClient.prototype.initialize = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.InitializeRequest.type, params);
        };
        LspClient.prototype.shutdown = function () {
            return this.connection.sendRequest(vscode_languageserver_protocol.ShutdownRequest.type, undefined);
        };
        LspClient.prototype.exit = function () {
            return this.connection.sendNotification(vscode_languageserver_protocol.ExitNotification.type);
        };
        LspClient.prototype.onCodeLens = function (handler) {
            this.connection.onNotification(vscode_languageserver_protocol.CodeLensRefreshNotification.type, handler);
        };
        LspClient.prototype.onDiagnostics = function (handler) {
            this.connection.onNotification(vscode_languageserver_protocol.PublishDiagnosticsNotification.type, handler);
        };
        LspClient.prototype.onShowMessage = function (handler) {
            this.connection.onNotification(vscode_languageserver_protocol.ShowMessageNotification.type, handler);
        };
        LspClient.prototype.onLogMessage = function (handler) {
            this.connection.onNotification(vscode_languageserver_protocol.LogMessageNotification.type, handler);
        };
        LspClient.prototype.onApplyWorkspaceEdit = function (handler) {
            this.connection.onRequest(vscode_languageserver_protocol.ApplyWorkspaceEditRequest.type, handler);
        };
        LspClient.prototype.didChangeConfiguration = function (params) {
            this.connection.sendNotification(vscode_languageserver_protocol.DidChangeConfigurationNotification.type, params);
        };
        LspClient.prototype.didOpenTextDocument = function (params) {
            this.connection.sendNotification(vscode_languageserver_protocol.DidOpenTextDocumentNotification.type, params);
        };
        LspClient.prototype.didChangeTextDocument = function (params) {
            this.connection.sendNotification(vscode_languageserver_protocol.DidChangeTextDocumentNotification.type, params);
        };
        LspClient.prototype.didCloseTextDocument = function (params) {
            this.connection.sendNotification(vscode_languageserver_protocol.DidCloseTextDocumentNotification.type, params);
        };
        LspClient.prototype.didSaveTextDocument = function (params) {
            this.connection.sendNotification(vscode_languageserver_protocol.DidSaveTextDocumentNotification.type, params);
        };
        LspClient.prototype.didChangeWatchedFiles = function (params) {
            this.connection.sendNotification(vscode_languageserver_protocol.DidChangeWatchedFilesNotification.type, params);
        };
        LspClient.prototype.completion = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.CompletionRequest.type, params);
        };
        LspClient.prototype.completionResolve = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.CompletionResolveRequest.type, params);
        };
        LspClient.prototype.hover = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.HoverRequest.type, params);
        };
        LspClient.prototype.signatureHelp = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.SignatureHelpRequest.type, params);
        };
        LspClient.prototype.definition = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DefinitionRequest.type, params);
        };
        LspClient.prototype.references = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.ReferencesRequest.type, params);
        };
        LspClient.prototype.documentHighlight = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentHighlightRequest.type, params);
        };
        LspClient.prototype.documentSymbol = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentSymbolRequest.type, params);
        };
        LspClient.prototype.workspaceSymbol = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.WorkspaceSymbolRequest.type, params);
        };
        LspClient.prototype.codeAction = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.CodeActionRequest.type, params);
        };
        LspClient.prototype.codeLens = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.CodeLensRequest.type, params);
        };
        LspClient.prototype.codeLensResolve = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.CodeLensResolveRequest.type, params);
        };
        LspClient.prototype.documentFormatting = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentFormattingRequest.type, params);
        };
        LspClient.prototype.documentRangeFormatting = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentRangeFormattingRequest.type, params);
        };
        LspClient.prototype.documentOnTypeFormatting = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentOnTypeFormattingRequest.type, params);
        };
        LspClient.prototype.rename = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.RenameRequest.type, params);
        };
        LspClient.prototype.documentLink = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentLinkRequest.type, params);
        };
        LspClient.prototype.documentLinkResolve = function (params) {
            return this.connection.sendRequest(vscode_languageserver_protocol.DocumentLinkResolveRequest.type, params);
        };
        return LspClient;
    }());
    var BaseLanguageClient = /** @class */ (function (_super) {
        __extends$1(BaseLanguageClient, _super);
        function BaseLanguageClient(connectionProvider) {
            var _this = _super.call(this, connectionProvider.createConnection()) || this;
            _this.connectionProvider = connectionProvider;
            _this.services = [];
            _this.connection.onError(function (e) { return _this.handleConnectionError(e); });
            _this.connection.onClose(function () { return _this.handleConnectionClosed(); });
            return _this;
        }
        Object.defineProperty(BaseLanguageClient.prototype, "isConnectionActive", {
            get: function () {
                return this.connection.state === vscode_jsonrpc.State.Running;
            },
            enumerable: true,
            configurable: true
        });
        BaseLanguageClient.prototype.start = function () {
            this.connectionProvider.listen(this.connection);
        };
        BaseLanguageClient.prototype.handleConnectionError = function (error) {
            this.connection.dispose();
        };
        BaseLanguageClient.prototype.handleConnectionClosed = function () {
            this.connection.dispose();
        };
        BaseLanguageClient.prototype.stop = function () {
            this.connection.dispose();
        };
        BaseLanguageClient.prototype.attach = function (service) {
            this.services.push(service);
        };
        return BaseLanguageClient;
    }(LspClient));
    /* --------------------------------------------------------------------------------------------
     * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     * ------------------------------------------------------------------------------------------ */
    var __extends$2 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function createMonacoServices(monaco, options) {
        if (options === void 0) { options = {}; }
        var services = [];
        var _a = options.rootUri, rootUri = _a === void 0 ? null : _a;
        var code = new MonacoToProtocolConverter(monaco);
        var protocol = new ProtocolToMonacoConverter(monaco);
        services.push(new MonacoModelResolver(monaco, rootUri, 'file'));
        services.push(new MonacoLanguages(monaco, protocol, code));
        services.push(new MonacoWorkspace(monaco, protocol, code, rootUri));
        services.push(new MonacoCommands(monaco));
        return services;
    }
    var MonacoLanguageClient = /** @class */ (function (_super) {
        __extends$2(MonacoLanguageClient, _super);
        function MonacoLanguageClient(options) {
            var _this = _super.call(this, createConnectionProvider(options)) || this;
            _this.monaco = options.monaco || monaco;
            _this.services = createMonacoServices(_this.monaco, options);
            _this.services.forEach(function (service) {
                _this.attach(service);
            });
            return _this;
        }
        MonacoLanguageClient.prototype.start = function () {
            var _this = this;
            _super.prototype.start.call(this);
            this.initialize(this.services.map(function (service) { return service.initialize(_this); }));
        };
        MonacoLanguageClient.prototype.initialize = function (contributions) {
            var _this = this;
            var _a, _b;
            var clientCapabilities = {
                textDocument: {
                    codeAction: {
                        dynamicRegistration: true
                    },
                    codeLens: {
                        dynamicRegistration: true
                    },
                    colorProvider: {
                        dynamicRegistration: true
                    },
                    completion: {
                        completionItem: {
                            commitCharactersSupport: true,
                            documentationFormat: [vscode_languageserver_protocol.MarkupKind.Markdown, vscode_languageserver_protocol.MarkupKind.PlainText],
                            snippetSupport: true,
                        },
                        completionItemKind: {
                            valueSet: [
                                vscode_languageserver_protocol.CompletionItemKind.Text,
                                vscode_languageserver_protocol.CompletionItemKind.Method,
                                vscode_languageserver_protocol.CompletionItemKind.Function,
                                vscode_languageserver_protocol.CompletionItemKind.Constructor,
                                vscode_languageserver_protocol.CompletionItemKind.Field,
                                vscode_languageserver_protocol.CompletionItemKind.Variable,
                                vscode_languageserver_protocol.CompletionItemKind.Class,
                                vscode_languageserver_protocol.CompletionItemKind.Interface,
                                vscode_languageserver_protocol.CompletionItemKind.Module,
                                vscode_languageserver_protocol.CompletionItemKind.Property,
                                vscode_languageserver_protocol.CompletionItemKind.Unit,
                                vscode_languageserver_protocol.CompletionItemKind.Value,
                                vscode_languageserver_protocol.CompletionItemKind.Enum,
                                vscode_languageserver_protocol.CompletionItemKind.Keyword,
                                vscode_languageserver_protocol.CompletionItemKind.Snippet,
                                vscode_languageserver_protocol.CompletionItemKind.Color,
                                vscode_languageserver_protocol.CompletionItemKind.File,
                                vscode_languageserver_protocol.CompletionItemKind.Reference,
                                vscode_languageserver_protocol.CompletionItemKind.Folder,
                                vscode_languageserver_protocol.CompletionItemKind.EnumMember,
                                vscode_languageserver_protocol.CompletionItemKind.Constant,
                                vscode_languageserver_protocol.CompletionItemKind.Struct,
                                vscode_languageserver_protocol.CompletionItemKind.Event,
                                vscode_languageserver_protocol.CompletionItemKind.Operator,
                                vscode_languageserver_protocol.CompletionItemKind.TypeParameter
                            ]
                        },
                        contextSupport: true,
                        dynamicRegistration: true
                    },
                    definition: {
                        dynamicRegistration: true
                    },
                    documentHighlight: {
                        dynamicRegistration: true
                    },
                    documentLink: {
                        dynamicRegistration: true
                    },
                    documentSymbol: {
                        dynamicRegistration: true,
                        symbolKind: {
                            valueSet: [
                                vscode_languageserver_protocol.SymbolKind.File,
                                vscode_languageserver_protocol.SymbolKind.Module,
                                vscode_languageserver_protocol.SymbolKind.Namespace,
                                vscode_languageserver_protocol.SymbolKind.Package,
                                vscode_languageserver_protocol.SymbolKind.Class,
                                vscode_languageserver_protocol.SymbolKind.Method,
                                vscode_languageserver_protocol.SymbolKind.Property,
                                vscode_languageserver_protocol.SymbolKind.Field,
                                vscode_languageserver_protocol.SymbolKind.Constructor,
                                vscode_languageserver_protocol.SymbolKind.Enum,
                                vscode_languageserver_protocol.SymbolKind.Interface,
                                vscode_languageserver_protocol.SymbolKind.Function,
                                vscode_languageserver_protocol.SymbolKind.Variable,
                                vscode_languageserver_protocol.SymbolKind.Constant,
                                vscode_languageserver_protocol.SymbolKind.String,
                                vscode_languageserver_protocol.SymbolKind.Number,
                                vscode_languageserver_protocol.SymbolKind.Boolean,
                                vscode_languageserver_protocol.SymbolKind.Array,
                                vscode_languageserver_protocol.SymbolKind.Object,
                                vscode_languageserver_protocol.SymbolKind.Key,
                                vscode_languageserver_protocol.SymbolKind.Null,
                                vscode_languageserver_protocol.SymbolKind.EnumMember,
                                vscode_languageserver_protocol.SymbolKind.Struct,
                                vscode_languageserver_protocol.SymbolKind.Event,
                                vscode_languageserver_protocol.SymbolKind.Operator,
                                vscode_languageserver_protocol.SymbolKind.TypeParameter,
                            ]
                        }
                    },
                    formatting: {
                        dynamicRegistration: true
                    },
                    hover: {
                        dynamicRegistration: true,
                        contentFormat: [vscode_languageserver_protocol.MarkupKind.Markdown, vscode_languageserver_protocol.MarkupKind.PlainText]
                    },
                    implementation: {
                        dynamicRegistration: true
                    },
                    onTypeFormatting: {
                        dynamicRegistration: true
                    },
                    publishing: {
                        tagSupport: {
                            valueSet: [vscode_languageserver_protocol.DiagnosticTag.Unnecessary]
                        }
                    },
                    rangeFormatting: {
                        dynamicRegistration: true
                    },
                    references: {
                        dynamicRegistration: true
                    },
                    rename: {
                        dynamicRegistration: true
                    },
                    signatureHelp: {
                        dynamicRegistration: true,
                        signatureInformation: {
                            documentationFormat: [vscode_languageserver_protocol.MarkupKind.Markdown, vscode_languageserver_protocol.MarkupKind.PlainText]
                        }
                    },
                    synchronization: {
                        didSave: true,
                        dynamicRegistration: true,
                        willSave: true,
                        willSaveWaitUntil: true
                    },
                    typeDefinition: {
                        dynamicRegistration: true
                    }
                },
                workspace: {
                    applyEdit: true,
                    configuration: true,
                    didChangeConfiguration: {
                        dynamicRegistration: true
                    },
                    didChangeWatchedFiles: {
                        dynamicRegistration: true
                    },
                    executeCommand: {
                        dynamicRegistration: true
                    },
                    symbol: {
                        dynamicRegistration: true,
                        symbolKind: {
                            valueSet: [
                                vscode_languageserver_protocol.SymbolKind.File,
                                vscode_languageserver_protocol.SymbolKind.Module,
                                vscode_languageserver_protocol.SymbolKind.Namespace,
                                vscode_languageserver_protocol.SymbolKind.Package,
                                vscode_languageserver_protocol.SymbolKind.Class,
                                vscode_languageserver_protocol.SymbolKind.Method,
                                vscode_languageserver_protocol.SymbolKind.Property,
                                vscode_languageserver_protocol.SymbolKind.Field,
                                vscode_languageserver_protocol.SymbolKind.Constructor,
                                vscode_languageserver_protocol.SymbolKind.Enum,
                                vscode_languageserver_protocol.SymbolKind.Interface,
                                vscode_languageserver_protocol.SymbolKind.Function,
                                vscode_languageserver_protocol.SymbolKind.Variable,
                                vscode_languageserver_protocol.SymbolKind.Constant,
                                vscode_languageserver_protocol.SymbolKind.String,
                                vscode_languageserver_protocol.SymbolKind.Number,
                                vscode_languageserver_protocol.SymbolKind.Boolean,
                                vscode_languageserver_protocol.SymbolKind.Array,
                                vscode_languageserver_protocol.SymbolKind.Object,
                                vscode_languageserver_protocol.SymbolKind.Key,
                                vscode_languageserver_protocol.SymbolKind.Null,
                                vscode_languageserver_protocol.SymbolKind.EnumMember,
                                vscode_languageserver_protocol.SymbolKind.Struct,
                                vscode_languageserver_protocol.SymbolKind.Event,
                                vscode_languageserver_protocol.SymbolKind.Operator,
                                vscode_languageserver_protocol.SymbolKind.TypeParameter,
                            ]
                        }
                    },
                    workspaceEdit: {
                        documentChanges: true
                    },
                    workspaceFolders: true
                }
            };
            for (var _i = 0, contributions_1 = contributions; _i < contributions_1.length; _i++) {
                var contribution = contributions_1[_i];
                if (contribution.fillClientCapabilities) {
                    contribution.fillClientCapabilities(clientCapabilities);
                }
            }
            var rootUri = (_a = this.services.find(function (service) { return service instanceof MonacoWorkspace; })) === null || _a === void 0 ? void 0 : _a.rootUri;
            var workspaceFolders = rootUri ? [{
                    uri: rootUri.toString(),
                    name: 'root'
                }] : null;
            var init = {
                processId: null,
                rootUri: rootUri ? rootUri.toString() : null,
                rootPath: rootUri ? rootUri.fsPath : null,
                initializationOptions: (_b = this.services.find(function (service) { return service instanceof MonacoModelResolver; })) === null || _b === void 0 ? void 0 : _b.getInitOptions(),
                capabilities: clientCapabilities,
                trace: 'off',
                workspaceFolders: workspaceFolders
            };
            return _super.prototype.initialize.call(this, init).then(function (result) {
                _this.serverCapabilities = result.capabilities;
                for (var _i = 0, contributions_2 = contributions; _i < contributions_2.length; _i++) {
                    var contribution = contributions_2[_i];
                    if (contribution.initialized) {
                        contribution.initialized(result.capabilities);
                    }
                }
            });
        };
        return MonacoLanguageClient;
    }(BaseLanguageClient));
    function createConnectionProvider(options) {
        if (vscode_ws_jsonrpc.isWebSocket(options.webSocket)) {
            return createWebSocketConnectionProvider(options.webSocket);
        }
        return options.connectionProvider;
    }
    function createWebSocketConnectionProvider(socket) {
        var reader = new vscode_ws_jsonrpc.WebSocketMessageReader(socket);
        var writer = new vscode_ws_jsonrpc.WebSocketMessageWriter(socket);
        return {
            createConnection: function () {
                return vscode_jsonrpc.createMessageConnection(reader, writer, new ConsoleLogger());
            },
            listen: function (connection) {
                reader.listen(function (message) { return connection.dispatch(message); });
            }
        };
    }
    var MonacoModelResolver = /** @class */ (function () {
        function MonacoModelResolver(monaco, rootUri, scheme) {
            this.monaco = monaco;
            this.rootUri = rootUri;
            this.scheme = scheme;
            this.models = new Map();
        }
        MonacoModelResolver.prototype.getInitOptions = function () {
            return {};
        };
        MonacoModelResolver.prototype.initialize = function (client) {
            var _this = this;
            this.client = client;
            this.monaco.editor.onDidCreateModel(function (model) {
                _this.onDidCreateModel(model);
            });
            this.monaco.editor.getModels().forEach(function (model) { return _this.onDidCreateModel(model); });
        };
        MonacoModelResolver.prototype.onDidCreateModel = function (model) {
            var _this = this;
            var uri = model.uri;
            this.models.set(uri.toString(), model);
            var l = model.onWillDispose(function () {
                _this.models.delete(uri.toString());
                l.dispose();
            });
            this.client.didOpenTextDocument({
                textDocument: {
                    uri: uri.toString(),
                    languageId: model.getModeId(),
                    version: model.getVersionId(),
                    text: model.getValue()
                }
            });
            model.onDidChangeContent(function (event) {
                _this.client.didChangeTextDocument({
                    textDocument: {
                        uri: uri.toString(),
                        version: event.versionId
                    },
                    contentChanges: event.changes.map(function (change) { return ({
                        range: {
                            start: {
                                line: change.range.startLineNumber - 1,
                                character: change.range.startColumn - 1
                            },
                            end: {
                                line: change.range.endLineNumber - 1,
                                character: change.range.endColumn - 1
                            }
                        },
                        rangeLength: change.rangeLength,
                        text: change.text
                    }); })
                });
            });
        };
        MonacoModelResolver.prototype.fillClientCapabilities = function (capabilities) {
        };
        return MonacoModelResolver;
    }());
    var MonacoCommands = /** @class */ (function () {
        function MonacoCommands(monaco) {
            this.monaco = monaco;
            this.commands = new Map();
        }
        MonacoCommands.prototype.initialize = function (client) {
        };
        MonacoCommands.prototype.fillClientCapabilities = function (capabilities) {
            if (capabilities.workspace && capabilities.workspace.executeCommand) {
                capabilities.workspace.executeCommand.dynamicRegistration = true;
            }
        };
        MonacoCommands.prototype.initialized = function (capabilities) {
            var _this = this;
            if (capabilities.executeCommandProvider) {
                var _loop_3 = function (command) {
                    this_1.monaco.languages.registerCommand(command, function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return _this.executeCommand.apply(_this, __spread([command], args));
                    });
                };
                var this_1 = this;
                for (var _i = 0, _a = capabilities.executeCommandProvider.commands; _i < _a.length; _i++) {
                    var command = _a[_i];
                    _loop_3(command);
                }
            }
        };
        MonacoCommands.prototype.executeCommand = function (command) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            // TODO
            return Promise.resolve(undefined);
        };
        return MonacoCommands;
    }());
    var MonacoWorkspace = /** @class */ (function () {
        function MonacoWorkspace(monaco, protocol, code, rootUri) {
            if (rootUri === void 0) { rootUri = null; }
            this.monaco = monaco;
            this.protocol = protocol;
            this.code = code;
            this.rootUri = rootUri;
        }
        MonacoWorkspace.prototype.initialize = function (client) {
            var _this = this;
            client.onApplyWorkspaceEdit(function (params) { return _this.applyWorkspaceEdit(params); });
        };
        MonacoWorkspace.prototype.fillClientCapabilities = function (capabilities) {
            if (capabilities.workspace) {
                if (capabilities.workspace.workspaceEdit) {
                    capabilities.workspace.workspaceEdit.documentChanges = true;
                }
                capabilities.workspace.workspaceFolders = true;
            }
        };
        MonacoWorkspace.prototype.applyWorkspaceEdit = function (params) {
            var edit = this.protocol.asWorkspaceEdit(params.edit);
            return this.monaco.editor.getModels().some(function (model) { return model.isAttachedToEditor(); })
                ? this.monaco.editor.getEditors()[0].applyEdits(edit.edits)
                : Promise.reject(new Error("There are no open editors to apply workspace edits."));
        };
        return MonacoWorkspace;
    }());
    var MonacoLanguages = /** @class */ (function () {
        function MonacoLanguages(monaco, protocol, code) {
            this.monaco = monaco;
            this.protocol = protocol;
            this.code = code;
            this.completionItems = new Map();
            this.codeLenses = new Map();
        }
        MonacoLanguages.prototype.initialize = function (client) {
            var _this = this;
            this.client = client;
            this.client.onDiagnostics(function (p) { return _this.readDiagnostics(p); });
        };
        MonacoLanguages.prototype.fillClientCapabilities = function (capabilities) {
            if (capabilities.textDocument) {
                this.fillCompletionCapabilities(capabilities.textDocument.completion);
                this.fillSignatureHelpCapabilities(capabilities.textDocument.signatureHelp);
                this.fillHoverCapabilities(capabilities.textDocument.hover);
            }
        };
        MonacoLanguages.prototype.fillCompletionCapabilities = function (capabilities) {
            if (capabilities && capabilities.completionItem) {
                capabilities.completionItem.snippetSupport = true;
            }
        };
        MonacoLanguages.prototype.fillSignatureHelpCapabilities = function (capabilities) {
            if (capabilities && capabilities.signatureInformation) {
                capabilities.signatureInformation.documentationFormat = [vscode_languageserver_protocol.MarkupKind.Markdown, vscode_languageserver_protocol.MarkupKind.PlainText];
            }
        };
        MonacoLanguages.prototype.fillHoverCapabilities = function (capabilities) {
            if (capabilities) {
                capabilities.contentFormat = [vscode_languageserver_protocol.MarkupKind.Markdown, vscode_languageserver_protocol.MarkupKind.PlainText];
            }
        };
        MonacoLanguages.prototype.initialized = function (capabilities) {
            this.register(capabilities);
        };
        MonacoLanguages.prototype.register = function (capabilities) {
            var documentSelector = this.matchLanguage(capabilities);
            if (capabilities.completionProvider) {
                this.monaco.languages.registerCompletionItemProvider(documentSelector, this.createCompletionProvider(capabilities.completionProvider));
            }
            if (capabilities.signatureHelpProvider) {
                this.monaco.languages.registerSignatureHelpProvider(documentSelector, this.createSignatureHelpProvider(capabilities.signatureHelpProvider));
            }
            if (capabilities.hoverProvider) {
                this.monaco.languages.registerHoverProvider(documentSelector, this.createHoverProvider());
            }
            if (capabilities.definitionProvider) {
                this.monaco.languages.registerDefinitionProvider(documentSelector, this.createDefinitionProvider());
            }
            if (capabilities.referencesProvider) {
                this.monaco.languages.registerReferenceProvider(documentSelector, this.createReferenceProvider());
            }
            if (capabilities.documentHighlightProvider) {
                this.monaco.languages.registerDocumentHighlightProvider(documentSelector, this.createDocumentHighlightProvider());
            }
            if (capabilities.documentSymbolProvider) {
                this.monaco.languages.registerDocumentSymbolProvider(documentSelector, this.createDocumentSymbolProvider());
            }
            if (capabilities.renameProvider) {
                this.monaco.languages.registerRenameProvider(documentSelector, this.createRenameProvider());
            }
            if (capabilities.documentFormattingEditProvider) {
                this.monaco.languages.registerDocumentFormattingEditProvider(documentSelector, this.createDocumentFormattingEditProvider());
            }
            if (capabilities.documentRangeFormattingEditProvider) {
                this.monaco.languages.registerDocumentRangeFormattingEditProvider(documentSelector, this.createDocumentRangeFormattingEditProvider());
            }
            if (capabilities.onTypeFormattingEditProvider) {
                this.monaco.languages.registerOnTypeFormattingEditProvider(documentSelector, this.createOnTypeFormattingEditProvider(capabilities.onTypeFormattingEditProvider));
            }
            if (capabilities.codeActionProvider) {
                this.monaco.languages.registerCodeActionProvider(documentSelector, this.createCodeActionProvider());
            }
            if (capabilities.codeLensProvider) {
                this.monaco.languages.registerCodeLensProvider(documentSelector, this.createCodeLensProvider());
            }
            if (capabilities.documentLinkProvider) {
                this.monaco.languages.registerLinkProvider(documentSelector, this.createDocumentLinkProvider(capabilities.documentLinkProvider));
            }
        };
        MonacoLanguages.prototype.matchLanguage = function (capabilities) {
            var documentSelector = capabilities.documentSelector;
            if (Array.isArray(documentSelector)) {
                return documentSelector[0];
            }
            return documentSelector;
        };
        MonacoLanguages.prototype.createCompletionProvider = function (options) {
            var _this = this;
            return {
                triggerCharacters: options.triggerCharacters,
                provideCompletionItems: function (model, position, context, token) {
                    var wordUntil = model.getWordUntilPosition(position);
                    var defaultRange = new _this.monaco.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
                    return _this.client.completion(_this.code.asCompletionParams(model, position, context)).then(function (result) {
                        if (result) {
                            var items_1 = Array.isArray(result) ? result : result.items;
                            _this.completionItems.clear();
                            for (var _i = 0, items_2 = items_1; _i < items_2.length; _i++) {
                                var item = items_2[_i];
                                _this.completionItems.set(_this.getCompletionItemKey(item), item);
                            }
                        }
                        return _this.protocol.asCompletionResult(result, defaultRange);
                    });
                },
                resolveCompletionItem: function (item, token) {
                    var key = _this.getCompletionItemKey(item);
                    var originalItem = _this.completionItems.get(key);
                    return _this.client.completionResolve(originalItem).then(function (result) {
                        if (result) {
                            var resolvedItem = _this.protocol.asCompletionItem(result, item.range);
                            for (var prop in resolvedItem) {
                                if (resolvedItem.hasOwnProperty(prop)) {
                                    item[prop] = resolvedItem[prop];
                                }
                            }
                        }
                        return item;
                    });
                }
            };
        };
        MonacoLanguages.prototype.getCompletionItemKey = function (item) {
            return JSON.stringify(item.data) || item.label;
        };
        MonacoLanguages.prototype.createSignatureHelpProvider = function (options) {
            var _this = this;
            return {
                signatureHelpTriggerCharacters: options.triggerCharacters,
                provideSignatureHelp: function (model, position, token) {
                    return _this.client.signatureHelp(_this.code.asSignatureHelpParams(model, position))
                        .then(function (result) { return _this.protocol.asSignatureHelp(result); });
                }
            };
        };
        MonacoLanguages.prototype.createHoverProvider = function () {
            var _this = this;
            return {
                provideHover: function (model, position, token) {
                    return _this.client.hover(_this.code.asHoverParams(model, position)).then(function (result) {
                        return _this.protocol.asHover(result);
                    });
                }
            };
        };
        MonacoLanguages.prototype.createDefinitionProvider = function () {
            var _this = this;
            return {
                provideDefinition: function (model, position, token) {
                    return _this.client.definition(_this.code.asTextDocumentPositionParams(model, position))
                        .then(function (result) { return _this.protocol.asReferences(result); });
                }
            };
        };
        MonacoLanguages.prototype.createReferenceProvider = function () {
            var _this = this;
            return {
                provideReferences: function (model, position, context, token) {
                    return _this.client.references(_this.code.asReferenceParams(model, position, context))
                        .then(function (result) { return _this.protocol.asReferences(result); });
                }
            };
        };
        MonacoLanguages.prototype.createDocumentHighlightProvider = function () {
            var _this = this;
            return {
                provideDocumentHighlights: function (model, position, token) {
                    return _this.client.documentHighlight(_this.code.asDocumentHighlightParams(model, position))
                        .then(function (result) { return _this.protocol.asDocumentHighlights(result); });
                }
            };
        };
        MonacoLanguages.prototype.createDocumentSymbolProvider = function () {
            var _this = this;
            return {
                provideDocumentSymbols: function (model, token) {
                    return _this.client.documentSymbol(_this.code.asDocumentSymbolParams(model))
                        .then(function (result) {
                        if (vscode_languageserver_protocol.DocumentSymbol.is(result[0])) {
                            return _this.protocol.asDocumentSymbols(result);
                        }
                        else {
                            return _this.protocol.asSymbolInformations(result, model.uri.toString());
                        }
                    });
                }
            };
        };
        MonacoLanguages.prototype.createRenameProvider = function () {
            var _this = this;
            return {
                provideRenameEdits: function (model, position, newName, token) {
                    return _this.client.rename(_this.code.asRenameParams(model, position, newName))
                        .then(function (result) { return _this.protocol.asWorkspaceEdit(result); });
                }
            };
        };
        MonacoLanguages.prototype.createDocumentFormattingEditProvider = function () {
            var _this = this;
            return {
                provideDocumentFormattingEdits: function (model, options, token) {
                    return _this.client.documentFormatting({
                        textDocument: _this.code.asTextDocumentIdentifier(model),
                        options: _this.code.asFormattingOptions(options)
                    }).then(function (result) { return _this.protocol.asTextEdits(result); });
                }
            };
        };
        MonacoLanguages.prototype.createDocumentRangeFormattingEditProvider = function () {
            var _this = this;
            return {
                provideDocumentRangeFormattingEdits: function (model, range, options, token) {
                    return _this.client.documentRangeFormatting(_this.code.asDocumentRangeFormattingParams(model, range, options))
                        .then(function (result) { return _this.protocol.asTextEdits(result); });
                }
            };
        };
        MonacoLanguages.prototype.createOnTypeFormattingEditProvider = function (options) {
            var _this = this;
            return {
                autoFormatTriggerCharacters: options.moreTriggerCharacter.concat(options.firstTriggerCharacter),
                provideOnTypeFormattingEdits: function (model, position, ch, options, token) {
                    return _this.client.documentOnTypeFormatting(_this.code.asDocumentOnTypeFormattingParams(model, position, ch, options))
                        .then(function (result) { return _this.protocol.asTextEdits(result); });
                }
            };
        };
        MonacoLanguages.prototype.createCodeActionProvider = function () {
            var _this = this;
            return {
                provideCodeActions: function (model, range, context, token) {
                    return _this.client.codeAction({
                        textDocument: _this.code.asTextDocumentIdentifier(model),
                        range: _this.code.asRange(range),
                        context: _this.code.asCodeActionContext(context)
                    }).then(function (result) { return _this.protocol.asCodeActions(result); });
                }
            };
        };
        MonacoLanguages.prototype.createCodeLensProvider = function () {
            var _this = this;
            return {
                provideCodeLenses: function (model, token) {
                    return _this.client.codeLens(_this.code.asCodeLensParams(model)).then(function (result) {
                        if (result) {
                            _this.codeLenses.clear();
                            for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                                var codeLens = result_1[_i];
                                var key = JSON.stringify(codeLenses.range);
                                _this.codeLenses.set(key, codeLens);
                            }
                        }
                        return _this.protocol.asCodeLenses(result);
                    });
                },
                resolveCodeLens: function (model, codeLens, token) {
                    var key = JSON.stringify(codeLens.range);
                    var originalCodeLens = _this.codeLenses.get(key);
                    return _this.client.codeLensResolve(originalCodeLens).then(function (result) {
                        if (result) {
                            var resolvedCodeLens = _this.protocol.asCodeLens(result);
                            for (var prop in resolvedCodeLens) {
                                if (resolvedCodeLens.hasOwnProperty(prop)) {
                                    codeLens[prop] = resolvedCodeLens[prop];
                                }
                            }
                        }
                        return codeLens;
                    });
                }
            };
        };
        MonacoLanguages.prototype.createDocumentLinkProvider = function (options) {
            var _this = this;
            return {
                provideLinks: function (model, token) {
                    return _this.client.documentLink(_this.code.asDocumentLinkParams(model)).then(function (result) {
                        return _this.protocol.asDocumentLinks(result);
                    });
                },
                resolveLink: function (link, token) {
                    // TODO
                    return Promise.resolve(link);
                }
            };
        };
        MonacoLanguages.prototype.readDiagnostics = function (params) {
            var uri = params.uri, diagnostics = params.diagnostics;
            var model = this.monaco.editor.getModels().find(function (model) { return model.uri.toString() === uri; });
            if (model) {
                var markers = this.protocol.asMarkers(diagnostics);
                this.monaco.editor.setModelMarkers(model, this.client.id, markers);
            }
        };
        return MonacoLanguages;
    }());

    exports.MonacoToProtocolConverter = MonacoToProtocolConverter;
    exports.ProtocolToMonacoConverter = ProtocolToMonacoConverter;
    exports.ConsoleLogger = ConsoleLogger;
    exports.LspClient = LspClient;
    exports.BaseLanguageClient = BaseLanguageClient;
    exports.createMonacoServices = createMonacoServices;
    exports.MonacoLanguageClient = MonacoLanguageClient;
    exports.createConnectionProvider = createConnectionProvider;
    exports.createWebSocketConnectionProvider = createWebSocketConnectionProvider;
    exports.MonacoModelResolver = MonacoModelResolver;
    exports.MonacoCommands = MonacoCommands;
    exports.MonacoWorkspace = MonacoWorkspace;
    exports.MonacoLanguages = MonacoLanguages;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=monaco-language-client.js.map

