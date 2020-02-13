import * as Koa from "koa";
import * as Router from "koa-router";
const axios = require("axios");
const fs = require("fs");
const fsx = require("fs-extra");
const koaBody = require("koa-body");
import FileInterface from "./File.interface";
const path = require("path");
const { promisify } = require("util");

const app = new Koa();
const router = new Router();

const readdir = promisify(fs.readdir);


// global
const _MAIN = "exchange_rates_data";
let currentExchangeRatesFile = _MAIN;
const fileDir = path.join(__dirname, "../files");

const fetchExchangeRatesAPIThenWriteFile = async () => {
    try {
        const response = await axios.get("https://api.exchangeratesapi.io/latest?base=USD");
        await fsx.writeFile(path.join(fileDir, "exchange_rates_data"), JSON.stringify(response.data), "utf8");
        console.log("Saved!");
    } catch (err) {
        console.log(err);
    }
};
const getRate = async (from: string, to: string) => {
    const exchange = JSON.parse(await fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8"));
    const fromInUsd: number = Number(exchange.rates[from]);
    const toInUsd: number = Number(exchange.rates[to]);
    const result: number = toInUsd / fromInUsd;
    return result;
}

// middlewares
const getRateMiddleware = async (ctx: any, next: () => Promise<any>) => {
    try {
        if (ctx.params.amount) {
            // If amount is not number
            if (isNaN(Number(ctx.params.amount))) {
                ctx.body = "invalid amount param";
                ctx.throw(400, "invalid amount param");
            }
        }
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

        const from: string = (ctx.params.fromCur).toUpperCase();
        const to: string = (ctx.params.toCur).toUpperCase();

        // If params are invalid currencies
        if (!Object.keys(exchange.rates).includes(from) || !Object.keys(exchange.rates).includes(to)) {
            ctx.body = "invalid currency param(s)";
            ctx.throw(400, "invalid currency param(s)");
        }

        ctx.body = await getRate(from, to) * (ctx.params.amount ? Number(ctx.params.amount) : 1);
    } catch (err) {
        console.log(err);
        ctx.status = err.status || 400;
    }

    await next();
}

// Fetch API data
fetchExchangeRatesAPIThenWriteFile();
// Daily
setInterval(
    fetchExchangeRatesAPIThenWriteFile
    ,
    // 1 day: 1000 * 60 * 60 * 24
    86400000
)

router
    // Get current file content
    .get(
        "/",
        async (ctx: any, next: () => Promise<any>) => {
            try {
                ctx.body = await fsx.readFile(path.join(fileDir, currentExchangeRatesFile), "utf8");
            } catch (err) {
                console.log(err);
            }

            await next();
        }
    )
    // Get rate: 1 fromCur == ? toCur
    .get(
        "/:fromCur/:toCur",
        getRateMiddleware
    )
    .get(
        "/:amount/:fromCur/:toCur",
        getRateMiddleware
    )
    // Upload file
    .post(
        "/",
        koaBody({ multipart: true }),
        async (ctx: any, next: () => Promise<any>) => {
            try {
                // File must be of type 'application/octet-stream'
                if (ctx.request.files.file.type !== "application/octet-stream") {
                    ctx.body = "file type not allowed";
                    ctx.throw(400, "file type not allowed");
                }
                // If file exist
                if (ctx.request.body.filename && (await readdir(fileDir)).includes(ctx.request.body.filename)) {
                    ctx.body = "file already exists";
                    ctx.throw(400, "file already exists");
                }
                // Must upload only 1 file
                if (Object.keys(ctx.request.files).length !== 1) {
                    ctx.body = "can only upload 1 file at a time";
                    ctx.throw(400, "can only upload 1 file at a time");
                }

                const files: any = Object.values(ctx.request.files)[0];
                const oldPath = files.path;

                const toBeValidatedFile: FileInterface = JSON.parse(await fsx.readFile(oldPath, "utf8"));
                if ((Object.keys(toBeValidatedFile.rates)).length < 2) {
                    ctx.body = "file must contain at least 2 currencies";
                    ctx.throw(400, "file must contain at least 2 currencies");
                } else if (
                    ((Object.keys(toBeValidatedFile.rates)).filter(
                        currency => currency.length !== 3 || currency !== currency.toUpperCase()
                    )).length !== 0) {
                    ctx.body = "currency name must have 3 characters and not lower case";
                    ctx.throw(400, "currency name must have 3 characters and not lower case");
                } else if (
                    ((Object.values(toBeValidatedFile.rates)).filter(
                        rate => typeof rate !== "number"
                    )).length !== 0) {
                    ctx.body = "curency rate must be number";
                    ctx.throw(400, "curency rate must be number");
                } else {
                    // move file to /files
                    const textFileName = ctx.request.body.filename || String(Date.now());
                    await fsx.rename(oldPath, path.join(fileDir, textFileName));
                    ctx.status = 201;
                }
            } catch (err) {
                console.log(err);
                ctx.status = err.status || 400;
            }


            await next();
        }
    )
    // Choose file to read from
    .put(
        "/:filename",
        async (ctx: any, next: () => Promise<any>) => {
            try {
                let filename: string;
                // Params must be string
                if (typeof (ctx.params.filename) !== "string") {
                    ctx.body = "invalid params type";
                    ctx.throw(400, "invalid params type");
                }

                // _MAIN means main file
                if (ctx.params.filename === "_MAIN") {
                    filename = _MAIN
                } else {
                    filename = ctx.params.filename;
                }
                // Set current file if file in dir
                if ((await readdir(fileDir)).includes(filename)) {
                    currentExchangeRatesFile = filename;
                } else {
                    ctx.body = "file dose not exist";
                    ctx.throw(400, "file dose not exist");
                }

                ctx.body = "Main: " + currentExchangeRatesFile;
            } catch (err) {
                console.log(err);
                ctx.status = err.status || 400;
            }

            await next();
        }
    )
    // Delete file
    .delete(
        "/:filename",
        async (ctx: any, next: () => Promise<any>) => {
            try {
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
                // Delete if file in dir
                if ((await readdir(fileDir)).includes(ctx.params.filename)) {
                    const textFileName = ctx.params.filename;
                    await fsx.remove(path.join(fileDir, textFileName));
                    ctx.status = 200;
                    ctx.body = textFileName + " Deleted!";
                } else {
                    ctx.body = "file dose not exist";
                    ctx.throw(400, "file dose not exist");

                }
            } catch (err) {
                console.log(err);
                ctx.status = err.status || 400;
            }

            await next();
        }
    )


app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => console.log("running on port 3000"));

export default app;