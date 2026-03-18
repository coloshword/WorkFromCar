"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMAIL_BASE = void 0;
exports.summarizeEmails = summarizeEmails;
exports.GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
function summarizeEmails(token, query, maxResults) {
    return __awaiter(this, void 0, void 0, function () {
        var q, limit, listUrl, listRes, listData, messages, emails;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    q = query !== null && query !== void 0 ? query : 'is:unread';
                    if (maxResults && maxResults > 10) {
                        throw new Error('Max results must be less than or equal to 10');
                    }
                    limit = maxResults !== null && maxResults !== void 0 ? maxResults : 10;
                    listUrl = new URL("".concat(exports.GMAIL_BASE, "/messages"));
                    listUrl.searchParams.set('maxResults', String(limit));
                    if (q)
                        listUrl.searchParams.set('q', q);
                    return [4 /*yield*/, fetch(listUrl.toString(), {
                            headers: { Authorization: "Bearer ".concat(token) },
                        })];
                case 1:
                    listRes = _b.sent();
                    if (!listRes.ok)
                        throw new Error("Gmail list failed: ".concat(listRes.status));
                    return [4 /*yield*/, listRes.json()];
                case 2:
                    listData = _b.sent();
                    messages = (_a = listData.messages) !== null && _a !== void 0 ? _a : [];
                    return [4 /*yield*/, Promise.all(messages.map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var msgRes, msg, headers, get;
                            var _c, _d, _e;
                            var id = _b.id;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0: return [4 /*yield*/, fetch("".concat(exports.GMAIL_BASE, "/messages/").concat(id, "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date"), { headers: { Authorization: "Bearer ".concat(token) } })];
                                    case 1:
                                        msgRes = _f.sent();
                                        if (!msgRes.ok)
                                            throw new Error("Gmail get failed: ".concat(msgRes.status));
                                        return [4 /*yield*/, msgRes.json()];
                                    case 2:
                                        msg = _f.sent();
                                        headers = (_d = (_c = msg.payload) === null || _c === void 0 ? void 0 : _c.headers) !== null && _d !== void 0 ? _d : [];
                                        get = function (name) {
                                            var _a, _b;
                                            return (_b = (_a = headers.find(function (h) { return h.name.toLowerCase() === name.toLowerCase(); })) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
                                        };
                                        return [2 /*return*/, {
                                                id: id,
                                                from: get('From'),
                                                subject: get('Subject'),
                                                snippet: (_e = msg.snippet) !== null && _e !== void 0 ? _e : '',
                                                date: get('Date'),
                                            }];
                                }
                            });
                        }); }))];
                case 3:
                    emails = _b.sent();
                    return [2 /*return*/, emails];
            }
        });
    });
}
