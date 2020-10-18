const nedb = require("nedb");
const logger = require("../utils/logger");

class PlayerRepository {
  constructor() {
    this.db = new nedb({
      filename: process.execPath + "_files/db/player.nedb",
      autoload: true,
      timestampData: true,
    });
    this.db.persistence.compactDatafile();
    this.db.ensureIndex({ fieldName: "name", unique: true });
    this.db.ensureIndex({ fieldName: "uuid", unique: true });
  }

  getPlayer(name, uuid) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ name: name, uuid: uuid }, (err, doc) => {
        if (err) {
          logger.Log({
            level: logger.LEVEL.ERROR,
            component: "REPOSITORY.PLAYER",
            code: "REPOSITORY.PLAYER.GET",
            description: err.toString(),
            category: "",
            ref: {},
          });
          reject(err);
          return;
        }
        resolve(doc);
      });
    });
  }

  create(player) {
    return new Promise((resolve, reject) => {
      this.db.insert(player, (err, newDoc) => {
        if (err) {
          if (err.errorType === "uniqueViolated") {
            resolve({ code: 400 });
            return;
          }
          logger.Log({
            level: logger.LEVEL.ERROR,
            component: "REPOSITORY.PLAYER",
            code: "REPOSITORY.PLAYER.CREATE",
            description: err.toString(),
            category: "",
            ref: {},
          });
          reject(err);
          return;
        }
        resolve({ code: 200, _id: newDoc["_id"] });
      });
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      this.db
        .find({})
        .projection({ name: 1 })
        .exec((err, docs) => {
          if (err) {
            logger.Log({
              level: logger.LEVEL.ERROR,
              component: "REPOSITORY.PLAYER",
              code: "REPOSITORY.PLAYER.GETALL",
              description: err.toString(),
              category: "",
              ref: {},
            });
            reject(err);
            return;
          }
          resolve(docs);
        });
    });
  }
}

module.exports = () => {
  return new PlayerRepository();
};
