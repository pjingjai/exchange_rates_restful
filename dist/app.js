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
};
Object.defineProperty(exports, "__esModule", { value: true });
// const Koa = require("koa");
// const Router = require("koa-router");
var Koa = require("koa");
var Router = require("koa-router");
var axios = require("axios");
var fs = require("fs");
var fsx = require("fs-extra");
var koaBody = require("koa-body");
var path = require("path");
var promisify = require("util").promisify;
var app = new Koa();
var router = new Router();
var readdir = promisify(fs.readdir);
// Props
var _MAIN = "exchange_rates_data";
var currentExchangeRatesFile = _MAIN;
var fileDir = path.join(__dirname, "../files");
var fetchExchangeRatesAPIThenWriteFile = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, axios.get("https://api.exchangeratesapi.io/latest?base=USD")];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, fsx.writeFile(path.join(fileDir, "exchange_rates_data"), JSON.stringify(response.data), "utf8")];
            case 2:
                _a.sent();
                console.log("Saved!");
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.log(err_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Fetch API data
fetchExchangeRatesAPIThenWriteFile();
// Daily
setInterval(fetchExchangeRatesAPIThenWriteFile, 
// 1 day: 1000 * 60 * 60 * 24
86400000);
router
    // Get current file content
    .get("/", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = ctx;
                return [4 /*yield*/, fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8")];
            case 1:
                _a.body = _b.sent();
                return [3 /*break*/, 3];
            case 2:
                err_2 = _b.sent();
                console.log(err_2);
                return [3 /*break*/, 3];
            case 3: return [4 /*yield*/, next()];
            case 4:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); })
    // Get rate: 1 fromCur == ? toCur
    .get("/:fromCur/:toCur", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var exchange, _a, _b, from, to, fromInUsd, toInUsd, result, err_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                // Params must be string
                if (typeof (ctx.params.fromCur) !== "string" || typeof (ctx.params.toCur) !== "string") {
                    ctx.body = "invalid params type";
                    ctx.throw(400, "invalid params type");
                }
                // Params must be of length 3
                if ((ctx.params.fromCur).length !== 3 || (ctx.params.toCur).length !== 3) {
                    ctx.body = "invalid params length";
                    ctx.throw(400, "invalid params length");
                }
                _b = (_a = JSON).parse;
                return [4 /*yield*/, fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8")];
            case 1:
                exchange = _b.apply(_a, [_c.sent()]);
                from = (ctx.params.fromCur).toUpperCase();
                to = (ctx.params.toCur).toUpperCase();
                // If params are invalid currencies
                if (!Object.keys(exchange.rates).includes(from) || !Object.keys(exchange.rates).includes(to)) {
                    ctx.body = "invalid currency param(s)";
                    ctx.throw(400, "invalid currency param(s)");
                }
                fromInUsd = Number(exchange.rates[from]);
                toInUsd = Number(exchange.rates[to]);
                result = toInUsd / fromInUsd;
                ctx.body = result;
                return [3 /*break*/, 3];
            case 2:
                err_3 = _c.sent();
                console.log(err_3);
                ctx.status = err_3.status || 400;
                return [3 /*break*/, 3];
            case 3: return [4 /*yield*/, next()];
            case 4:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); })
    // Upload file
    .post("/", koaBody({ multipart: true }), function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, files, oldPath, textFileName, err_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                // File must be of type 'application/octet-stream'
                if (ctx.request.files.file.type !== "application/octet-stream") {
                    ctx.body = "file type not allowed";
                    ctx.throw(400, "file type not allowed");
                }
                _a = ctx.request.body.filename;
                if (!_a) return [3 /*break*/, 2];
                return [4 /*yield*/, readdir(fileDir)];
            case 1:
                _a = (_b.sent()).includes(ctx.request.body.filename);
                _b.label = 2;
            case 2:
                // If file exist
                if (_a) {
                    ctx.body = "file already exist";
                    ctx.throw(400, "file already exist");
                }
                // Must upload only 1 file
                if (Object.keys(ctx.request.files).length !== 1) {
                    ctx.body = "can only upload 1 file at a time";
                    ctx.throw(400, "can only upload 1 file at a time");
                }
                files = Object.values(ctx.request.files)[0];
                oldPath = files.path;
                textFileName = ctx.request.body.filename || String(Date.now());
                return [4 /*yield*/, fsx.rename(oldPath, path.join(fileDir, textFileName))];
            case 3:
                _b.sent();
                ctx.status = 201;
                return [3 /*break*/, 5];
            case 4:
                err_4 = _b.sent();
                console.log(err_4);
                ctx.status = err_4.status || 400;
                return [3 /*break*/, 5];
            case 5: return [4 /*yield*/, next()];
            case 6:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); })
    // Choose file to read from
    .put("/:filename", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var filename, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                filename = void 0;
                // Params must be string
                if (typeof (ctx.params.filename) !== "string") {
                    ctx.body = "invalid params type";
                    ctx.throw(400, "invalid params type");
                }
                // _MAIN means main file
                if (ctx.params.filename === "_MAIN") {
                    filename = _MAIN;
                }
                else {
                    filename = ctx.params.filename;
                }
                return [4 /*yield*/, readdir(fileDir)];
            case 1:
                // Set current file if file in dir
                if ((_a.sent()).includes(filename)) {
                    currentExchangeRatesFile = filename;
                }
                else {
                    ctx.body = "file dose not exist";
                    ctx.throw(400, "file dose not exist");
                }
                ctx.body = "Main: " + currentExchangeRatesFile;
                return [3 /*break*/, 3];
            case 2:
                err_5 = _a.sent();
                console.log(err_5);
                ctx.status = err_5.status || 400;
                return [3 /*break*/, 3];
            case 3: return [4 /*yield*/, next()];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    // Delete file
    .delete("/:filename", function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var textFileName, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                // Params must be string
                if (typeof (ctx.params.filename) !== "string") {
                    ctx.body = "invalid params type";
                    ctx.throw(400, "invalid params type");
                }
                // If _MAIN, do not delete
                if (_MAIN === ctx.params.filename) {
                    ctx.body = "cannot delete main file";
                    ctx.throw(400, "cannot delete main file");
                }
                // If currentExchangeRatesFile, do not delete
                if (currentExchangeRatesFile === ctx.params.filename) {
                    ctx.body = "cannot delete due to currently reading from the file requested for deletion";
                    ctx.throw(400, "cannot delete due to currently reading from the file requested for deletion");
                }
                return [4 /*yield*/, readdir(fileDir)];
            case 1:
                if (!(_a.sent()).includes(ctx.params.filename)) return [3 /*break*/, 3];
                textFileName = ctx.params.filename;
                return [4 /*yield*/, fsx.remove(path.join(fileDir, textFileName))];
            case 2:
                _a.sent();
                ctx.status = 200;
                ctx.body = textFileName + " Deleted!";
                return [3 /*break*/, 4];
            case 3:
                ctx.body = "file dose not exist";
                ctx.throw(400, "file dose not exist");
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                err_6 = _a.sent();
                console.log(err_6);
                ctx.status = err_6.status || 400;
                return [3 /*break*/, 6];
            case 6: return [4 /*yield*/, next()];
            case 7:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000, function () { return console.log("running on port 3000"); });
