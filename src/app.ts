const Koa = require("koa");
const Router = require("koa-router");
const fs = require("fs");
const axios = require("axios");
const fsx = require('fs-extra');
const util = require('util');

const app = new Koa();
const router = new Router();

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
   

const fetchExchangeRatesAPIThenWriteFile = async () => {
    try {
        const response = await axios.get("https://api.exchangeratesapi.io/latest?base=USD");
        await writeFile('exchange_rates_data.txt', JSON.stringify(response.data), "utf8");
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

let mainExchangeRatesFile = "exchange_rates_data.txt"

router
    .get(
        "/",
        async (ctx: any, next: any) => {
            try {
                ctx.body = await readFile(mainExchangeRatesFile, "utf8");
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
                const exchange = JSON.parse(await readFile(mainExchangeRatesFile, "utf8"));

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
        "/:filename",
        async (ctx: any, next: any) => {
            try {
                
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
            ctx.body = mainExchangeRatesFile;

            await next();
        }
    )
    .delete(
        "/:filename",
        async (ctx: any, next: any) => {


            await next();
        }
    )


app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => console.log("running on port 3000"));