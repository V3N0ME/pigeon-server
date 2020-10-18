const nedb = require("nedb");
const logger = require("../utils/logger");

class UserRepository {
  constructor() {
    this.db = new nedb({
      filename: process.execPath + "_files/db/user.nedb",
      autoload: true,
      timestampData: true,
    });
    this.db.persistence.compactDatafile();
    this.db.ensureIndex({ fieldName: "username", unique: true });
  }

  create(user) {
    return new Promise((resolve, reject) => {
      this.db.insert(user, (err, newDoc) => {
        if (err) {
          if (err.errorType === "uniqueViolated") {
            resolve({ code: 400 });
            return;
          }
          logger.Log({
            level: logger.LEVEL.ERROR,
            component: "REPOSITORY.USER",
            code: "REPOSITORY.USER.CREATE",
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

  login(credentials) {
    return new Promise((resolve, reject) => {
      this.db.findOne(
        { username: credentials.username, password: credentials.password },
        (err, doc) => {
          if (err) {
            logger.Log({
              level: logger.LEVEL.ERROR,
              component: "REPOSITORY.USER",
              code: "REPOSITORY.USER.CREATE",
              description: err.toString(),
              category: "",
              ref: {},
            });
            reject(err);
            return;
          }
          resolve(doc);
        }
      );
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      this.db
        .find({ role: "user" })
        //.projection({ name: 1, username: 1 })
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
  return new UserRepository();
};
