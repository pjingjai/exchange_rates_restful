const axios = require("axios");

axios.get("https://api.exchangeratesapi.io/latest?base=USD")
    .then(res => {
        console.log(res.data);
    })