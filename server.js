global.env =
  process.env.NODE_ENV === undefined ? "development" : process.env.NODE_ENV;
const PORT = process.env.PORT === undefined ? 8081 : process.env.PORT;

const express = require("express");
const app = express();
const compression = require("compression");
const bodyParser = require("body-parser");
const HttpServer = require("http").createServer(app);
const io = require("socket.io")(HttpServer, {
  pingTimeout: 30000,
});

const logger = require("./utils/logger");

class Server {
  constructor() {
    this.drivers = [];
    this.init();
  }

  async init() {
    try {
      this.initRepositories();
      this.initUsecases();
      this.initExpress();
      this.initRoutes();
      this.initServer();
    } catch (err) {
      console.log(err);
      process.exit(err);
    }
  }

  initExpress() {
    app.use(require("cors")());

    const colours = {
      GET: "\x1b[32m",
      POST: "\x1b[34m",
      DELETE: "\x1b[31m",
      PUT: "\x1b[33m",
    };
    app.use("*", (req, _, next) => {
      if (global.env === "development") {
        console.log(colours[req.method] + req.method, "\x1b[0m" + req.baseUrl);
      }
      next();
    });

    //Enable request compression
    app.use(compression());
    app.use(bodyParser.json()); // to support JSON-encoded bodies
    app.use(
      bodyParser.urlencoded({
        // to support URL-encoded bodies
        extended: true,
      })
    );
    app.use(
      express.static(__dirname + "/public", {
        //maxAge: "30 days"
      })
    );
  }

  initServer() {
    HttpServer.listen(PORT, () => {
      console.log(`Server Running ${PORT}`);
    });
    require("./services/websocket")(io);
  }

  initDrivers() {
    return new Promise(async (resolve, reject) => {
      try {
        this.mysql = await require("./drivers/mysql")().connect();
        //this.mongo = require('./models/mongo')().connect();

        this.drivers.push(this.mysql);
        //this.models.push(this.mongo);

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  initRepositories() {
    this.playerRepo = require("./repository/player")();
    this.userRepo = require("./repository/user")();
  }

  initUsecases() {
    this.playerUsecase = require("./usecase/player")(this.playerRepo);
    this.userUsecase = require("./usecase/user")(this.userRepo);
  }

  initRoutes() {
    const authMiddleWare = require("./middlewares/auth");
    app.use(authMiddleWare);

    const playerRouter = require("./routes/player")(this.playerUsecase);
    const userRouter = require("./routes/user")(this.userUsecase);

    app.use("/player", playerRouter.getRouter());
    app.use("/user", userRouter.getRouter());
  }

  onClose() {
    //Close all DB Connections
    this.drivers.map((m) => {
      m.close();
    });

    HttpServer.close();
  }
}

const server = new Server();

["SIGINT", "SIGTERM", "SIGQUIT", "exit", "SIGUSR1", "SIGUSR2"].forEach(
  (eventType) => {
    process.on(eventType, (err = "") => {
      process.removeAllListeners();

      let error = err.toString();

      if (err.stack) {
        error = err.stack;
      }

      logger.Log({
        level: logger.LEVEL.ERROR,
        component: "SERVER",
        code: "SERVER.EXIT",
        description: error,
        category: "",
        ref: {},
      });
      server.onClose();
    });
  }
);
