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

const server = app.listen(port, function(error) {
    if (error) {
        console.log("Something went wrong: ", error);
    } else {
        console.log(`Server is listening on port: ${port} `);
    }
});

setInterval(() => server.getConnections(
    (err, connections) => console.log(`${connections} connections currently open`)
), 5000);

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

let connections = [];

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

function shutDown() {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);

    connections.forEach(curr => curr.end());
    setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}
