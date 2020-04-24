const express = require("express");
const app = express();
const port = 3000;

app.use(express.static("client"));

app.get("/", function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "text/html");
    res.sendFile(path.join(__dirname+'/client/index.html'));
    res.status(200);
    res.end();
});

app.listen(port, function(error) {
    if (error) {
        console.log("Something went wrong: ", error);
    } else {
        console.log(`Server is listening on port: ${port} `);
    }
});
