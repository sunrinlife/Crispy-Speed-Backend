import * as express from "express";
import * as compression from "compression";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as cors from "cors";
import { socket, setting } from "./Module/socket";
setting();
const app: express.Application = express();
const PORT = process.env.PORT || 4000;
const http = require("http");
const server = http.createServer(app);
require("dotenv").config();
app.use(morgan("dev"));
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "30mb" }));
app.use(express.static("public"));
app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello World!!!!");
});
server.listen(4043, () => {
  console.log(`http://localhost:${4043} OnOn`);
});
const socketio = require("socket.io");
const io = socketio.listen(51236, { "destroy buffer size": Infinity });
socket(io);
