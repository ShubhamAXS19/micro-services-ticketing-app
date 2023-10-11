const express  = require("express");
const json = require( "body-parser");

const app = express();
app.use(json());

app.listen(3000, () => {
    console.log("Listening on port 3000");
});
