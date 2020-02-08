const Koa = require("koa");
const Router = require("koa-router");
const axios = require("axios");
const fs = require('fs-extra');
const koaBody = require("koa-body");
const path = require("path");

const app = new Koa();
const router = new Router();

let mainExchangeRatesFile = "exchange_rates_data";
const textFileDir = path.join(__dirname, "../uploads");

const fetchExchangeRatesAPIThenWriteFile = async () => {
    try {
        const response = await axios.get("https://api.exchangeratesapi.io/latest?base=USD");
        await fs.writeFile(path.join(textFileDir, "exchange_rates_data"), JSON.stringify(response.data), "utf8");
        console.log("Saved!");
    } catch (err) {
        console.log(err);
    }
};

// Fetch API data
fetchExchangeRatesAPIThenWriteFile();
// Daily
setInterval(
    () => {
        fetchExchangeRatesAPIThenWriteFile();
    },
    // 1 day: 1000 * 60 * 60 * 24
    86400000
)

router
    .get(
        "/",
        async (ctx: any, next: any) => {
            try {
                ctx.body = await fs.readFile(path.join(textFileDir, mainExchangeRatesFile), "utf8");
            } catch (err) {
                console.log(err);
            }

            await next();
        }
    )
    .get(
        "/:fromCur/:toCur",
        async (ctx: any, next: any) => {
            try {
                const exchange = JSON.parse(await fs.readFile(path.join(textFileDir, mainExchangeRatesFile), "utf8"));

                const from: string = ctx.params.fromCur;
                const to: string = ctx.params.toCur;
                const fromInUsd: number = Number(exchange.rates[from]);
                const toInUsd: number = Number(exchange.rates[to]);

                const result: number = (1 / fromInUsd) * toInUsd;
                ctx.body = result;
            } catch (err) {
                console.log(err);
            }

            await next();
        }
    )
    .post(
        "/",
        koaBody({ multipart: true }),
        async (ctx: any, next: any) => {
            try {
                if (ctx.request.files.file.type !== "text/plain") {
                    ctx.status = 400;
                    ctx.body = "file type not allowed";
                    throw new Error("file type not allowed");
                }
                if (Object.keys(ctx.request.files).length !== 1) {
                    ctx.status = 400;
                    ctx.body = "can only upload 1 file at a time";
                    throw new Error("can only upload 1 file at a time");
                }

                const oldPath = Object.values(ctx.request.files)[0].path;
                const textFileName = ctx.request.body.filename  || String(Date.now());
                await fs.rename(oldPath, path.join(textFileDir, textFileName));
                ctx.status = 201;
            } catch (err) {
                console.log(err);
            }


            await next();
        }
    )
    // Choose file to read from
    .put(
        "/:filename",
        async (ctx: any, next: any) => {
            mainExchangeRatesFile = ctx.params.filename;
            ctx.body = "Main: " + mainExchangeRatesFile;

            await next();
        }
    )
    .delete(
        "/:filename",
        async (ctx: any, next: any) => {
            const textFileName = ctx.params.filename;
            await fs.remove(path.join(textFileDir, textFileName));
            ctx.status = 200;
            ctx.body = textFileName + " Deleted!";

            await next();
        }
    )


app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => console.log("running on port 3000"));