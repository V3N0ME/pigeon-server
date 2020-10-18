const router = require("express").Router();
const Joi = require("@hapi/joi");

class PlayerRoutes {
  constructor(playerUsecase) {
    this.playerUsecase = playerUsecase;
    this.init();
  }

  init() {
    router.post("/register", async (req, res) => {
      try {
        const schema = {
          name: Joi.string().trim().required(),
          uuid: Joi.string().trim().required(),
          server_key: Joi.string().trim().optional(),
        };

        const player = req.body;
        const isValid = Joi.validate(player, schema);

        if (isValid.error !== null) {
          throw isValid.error;
        }

        const resp = await this.playerUsecase.register(player);
        res.json(resp);
      } catch (err) {
        if (err.name === "ValidationError") {
          res.json({ code: 422, msg: err.toString() });
        } else {
          res.json({ code: 500, msg: "An error occurred !" });
        }
      }

      res.end();
    });

    router.get("/", async (_, res) => {
      try {
        const players = await this.playerUsecase.getAll();
        res.json(players);
      } catch (err) {
        res.json({ code: 500, msg: "An error occurred !" });
      }
      res.end();
    });
  }

  getRouter() {
    return router;
  }
}

module.exports = (playerUsecase) => {
  return new PlayerRoutes(playerUsecase);
};
