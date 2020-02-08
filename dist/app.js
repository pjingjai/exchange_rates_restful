"use strict";
const Koa = require("koa");
const Router = require("koa-router");
const axios = require("axios");
const fs = require("fs");
const fsx = require("fs-extra");
const koaBody = require("koa-body");
const path = require("path");
const { promisify } = require("util");
const app = new Koa();
const router = new Router();
const readdir = promisify(fs.readdir);
// Props
const _MAIN = "exchange_rates_data";
let currentExchangeRatesFile = _MAIN;
const fileDir = path.join(__dirname, "../files");
const fetchExchangeRatesAPIThenWriteFile = async () => {
    try {
        const response = await axios.get("https://api.exchangeratesapi.io/latest?base=USD");
        await fsx.writeFile(path.join(fileDir, "exchange_rates_data"), JSON.stringify(response.data), "utf8");
        console.log("Saved!");
    }
    catch (err) {
        console.log(err);
    }
};
// Fetch API data
fetchExchangeRatesAPIThenWriteFile();
// Daily
setInterval(() => {
    fetchExchangeRatesAPIThenWriteFile();
}, 
// 1 day: 1000 * 60 * 60 * 24
86400000);
router
    // Get current file content
    .get("/", async (ctx, next) => {
    try {
        console.log(currentExchangeRatesFile);
        ctx.body = await fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8");
    }
    catch (err) {
        console.log(err);
    }
    await next();
})
    .get("/:fromCur/:toCur", async (ctx, next) => {
    try {
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
        const exchange = JSON.parse(await fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8"));
        const from = (ctx.params.fromCur).toUpperCase();
        const to = (ctx.params.toCur).toUpperCase();
        // If params are invalid currencies
        if (!Object.keys(exchange.rates).includes(from) || !Object.keys(exchange.rates).includes(to)) {
            ctx.body = "invalid currency param(s)";
            ctx.throw(400, "invalid currency param(s)");
        }
        const fromInUsd = Number(exchange.rates[from]);
        const toInUsd = Number(exchange.rates[to]);
        const result = (1 / fromInUsd) * toInUsd;
        ctx.body = result;
    }
    catch (err) {
        console.log(err);
        ctx.status = err.status || 400;
    }
    await next();
})
    .post("/", koaBody({ multipart: true }), async (ctx, next) => {
    try {
        // File must be of type 'application/octet-stream'
        if (ctx.request.files.file.type !== "application/octet-stream") {
            ctx.body = "file type not allowed";
            ctx.throw(400, "file type not allowed");
        }
        // If file exist
        if (ctx.request.body.filename && (await readdir(fileDir)).includes(ctx.request.body.filename)) {
            ctx.body = "file already exist";
            ctx.throw(400, "file already exist");
        }
        // Must upload only 1 file
        if (Object.keys(ctx.request.files).length !== 1) {
            ctx.body = "can only upload 1 file at a time";
            ctx.throw(400, "can only upload 1 file at a time");
        }
        const oldPath = Object.values(ctx.request.files)[0].path;
        const textFileName = ctx.request.body.filename || String(Date.now());
        await fsx.rename(oldPath, path.join(fileDir, textFileName));
        ctx.status = 201;
    }
    catch (err) {
        console.log(err);
        ctx.status = err.status || 400;
    }
    await next();
})
    // Choose file to read from
    .put("/:filename", async (ctx, next) => {
    try {
        let filename;
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
        // Set current file if file in dir
        if ((await readdir(fileDir)).includes(filename)) {
            currentExchangeRatesFile = filename;
        }
        else {
            ctx.body = "file dose not exist";
            ctx.throw(400, "file dose not exist");
        }
        ctx.body = "Main: " + currentExchangeRatesFile;
    }
    catch (err) {
        console.log(err);
        ctx.status = err.status || 400;
    }
    await next();
})
    .delete("/:filename", async (ctx, next) => {
    try {
        // Params must be string
        if (typeof (ctx.params.filename) !== "string") {
            ctx.body = "invalid params type";
            ctx.throw(400, "invalid params type");
        }
        // Delete if file in dir
        if ((await readdir(fileDir)).includes(ctx.params.filename)) {
            const textFileName = ctx.params.filename;
            await fsx.remove(path.join(fileDir, textFileName));
            ctx.status = 200;
            ctx.body = textFileName + " Deleted!";
        }
        else {
            ctx.body = "file dose not exist";
            ctx.throw(400, "file dose not exist");
        }
    }
    catch (err) {
        console.log(err);
        ctx.status = err.status || 400;
    }
    await next();
});
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000, () => console.log("running on port 3000"));
