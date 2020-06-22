"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = express_1.default();
const port = 3000;
const dirName = __dirname.split("/").slice(0, -1).join("/") + '/client';
app.use(express_1.default.static(dirName));
app.get("/", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "text/html");
    console.log(path_1.default.join(dirName, "/index.html"));
    res.sendFile(path_1.default.join(dirName, "/index.html"));
    res.status(200);
    res.end();
});
const server = app.listen(port, function (error) {
    if (error) {
        console.log("Something went wrong: ", error);
    }
    else {
        console.log(`Server is listening on port: ${port} `);
    }
});
setInterval(() => server.getConnections((err, connections) => console.log(`${connections} connections currently open`)), 5000);
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
let connections = [];
server.on('connection', (connection) => {
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
