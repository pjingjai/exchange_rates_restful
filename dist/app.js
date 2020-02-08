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
        if (typeof (ctx.params.fromCur) !== "string" || typeof (ctx.params.toCur) !== "string") {
            ctx.status = 400;
            ctx.body = "invalid params type";
            throw new Error("invalid params type");
        }
        if ((ctx.params.fromCur).length !== 3 || (ctx.params.toCur).length !== 3) {
            ctx.status = 400;
            ctx.body = "invalid params length";
            throw new Error("invalid params length");
        }
        const exchange = JSON.parse(await fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8"));
        const from = (ctx.params.fromCur).toUpperCase();
        const to = (ctx.params.toCur).toUpperCase();
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
        if (ctx.request.files.file.type !== "application/octet-stream") {
            ctx.throw(400, "file type not allowed");
        }
        if (Object.keys(ctx.request.files).length !== 1) {
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
        if (typeof (ctx.params.filename) !== "string") {
            ctx.status = 400;
            ctx.body = "invalid params type";
            throw new Error("invalid params type");
        }
        if (ctx.params.filename === "_MAIN") {
            filename = _MAIN;
        }
        else {
            filename = ctx.params.filename;
        }
        if ((await readdir(fileDir)).includes(filename)) {
            currentExchangeRatesFile = filename;
        }
        else {
            ctx.status = 400;
            ctx.body = "file dose not exist";
            throw new Error("file dose not exist");
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
    if (typeof (ctx.params.filename) !== "string") {
        ctx.status = 400;
        ctx.body = "invalid params type";
        throw new Error("invalid params type");
    }
    // Delete
    if ((await readdir(fileDir)).includes(ctx.params.filename)) {
        const textFileName = ctx.params.filename;
        await fsx.remove(path.join(fileDir, textFileName));
        ctx.status = 200;
        ctx.body = textFileName + " Deleted!";
    }
    else {
        ctx.status = 400;
        ctx.body = "file dose not exist";
        throw new Error("file dose not exist");
    }
    await next();
});
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000, () => console.log("running on port 3000"));
