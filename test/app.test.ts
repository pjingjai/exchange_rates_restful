import * as request from "supertest";
import app from "../src/app";
const fsx = require("fs-extra");
import * as path from "path";

test("GET /", async () => {
    try {
        const response = await request(app.callback()).get("/");
        const responseObject = JSON.parse(response.text);

        expect(typeof responseObject).toBe("object");
        expect(typeof responseObject.rates).toBe("object");
        expect(response.status).toBe(200);
        expect(response.text).toMatchSnapshot();
    } catch (e) {
        expect(e).toMatch("error");
    }
});

test("POST /: ok", async () => {
    try {
        const response = await request(app.callback())
            .post("/")
            .attach("file", "./files/exchange_rates_data");

        expect(response.status).toBe(201);
    } catch (e) {
        expect(e).toMatch("error");
    }
});
test("POST /: file already exists", async () => {
    try {
        const _201Response = await request(app.callback())
            .post("/")
            .field("filename", "__fileExist__")
            .attach("file", "./files/exchange_rates_data");
        const _400Response = await request(app.callback())
            .post("/")
            .field("filename", "__fileExist__")
            .attach("file", "./files/exchange_rates_data");

        expect(_201Response.status).toBe(201);
        expect(_400Response.status).toBe(400);

        const deleteResponse = await request(app.callback())
            .delete("/__fileExist__");
        expect(deleteResponse.status).toBe(200);
    } catch (e) {
        expect(e).toMatch("error");
    }
});
test("POST /: file text must be valid JSON", async () => {
    try {
        const _201response = await request(app.callback())
            .post("/")
            .field("filename", "__testJSON__")
            .attach("file", "./files/exchange_rates_data");

        const fileDir = path.join(__dirname, "../files");
        const file = await fsx.readFile(path.join(fileDir, "__testJSON__"), "utf8");

        const fileObj = JSON.parse(file);
        console.log(fileObj);
        expect(_201response.status).toBe(201);
        expect(typeof fileObj).toBe("object");
        expect(typeof fileObj.rates).toBe("object");
        expect((Object.keys(fileObj.rates)).length).toBeGreaterThan(1);
        expect(((Object.keys(fileObj.rates)).filter(
            currency => currency.length !== 3 || currency !== currency.toUpperCase()
        )).length).toBe(0);
        expect(((Object.values(fileObj.rates)).filter(
            rate => typeof rate !== "number"
        )).length).toBe(0);

        const deleteResponse = await request(app.callback())
            .delete("/__testJSON__");
        expect(deleteResponse.status).toBe(200);
    } catch (e) {
        expect(e).toMatch("error");
    }
});