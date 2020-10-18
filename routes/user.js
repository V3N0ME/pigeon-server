const router = require("express").Router();
const Joi = require("@hapi/joi");

class UserRoutes {
  constructor(userUsecase) {
    this.userUsecase = userUsecase;
    this.init();
  }

  init() {
    router.post("/register", async (req, res) => {
      if (req.decoded.role !== "admin") {
        res.json({ code: 403, msg: "Access Denied" });
        res.end();
        return;
      }

      try {
        const schema = {
          name: Joi.string().trim().required(),
          username: Joi.string().trim().required(),
          role: Joi.string().valid("user", "admin").required(),
          specialization: Joi.string().trim().required(),
        };

        const user = req.body;
        const isValid = Joi.validate(user, schema);

        if (isValid.error !== null) {
          throw isValid.error;
        }

        const resp = await this.userUsecase.register(user);
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

    router.post("/login", async (req, res) => {
      try {
        const schema = {
          username: Joi.string().trim().required(),
          password: Joi.string().trim().required(),
        };

        const credentials = req.body;
        const isValid = Joi.validate(credentials, schema);

        if (isValid.error !== null) {
          throw isValid.error;
        }

        const resp = await this.userUsecase.login(credentials);
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
        const users = await this.userUsecase.getAll();
        res.json(users);
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

module.exports = (userUsecase) => {
  return new UserRoutes(userUsecase);
};
