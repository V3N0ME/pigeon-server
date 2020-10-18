const jwt = require("../services/jwt");

class UserUsecase {
  constructor(userRepo) {
    this.userRepo = userRepo;
    this.init();
  }

  init() {
    this.userRepo.create({
      username: "root",
      role: "admin",
      password: "default-password",
    });
  }

  register(user) {
    return new Promise(async (resolve, reject) => {
      try {
        user.password = "default-password";
        const resp = await this.userRepo.create(user);
        if (resp.code === 200) {
          const token = await jwt.sign(
            {
              id: resp._id,
              role: resp.role,
            },
            "3d"
          );
          resolve({ code: 200, token: token });
          return;
        }

        resolve({ code: 400 });
      } catch (err) {
        reject(err);
      }
    });
  }

  login(credentials) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = await this.userRepo.login(credentials);
        if (doc) {
          const token = await jwt.sign(
            {
              id: doc._id,
              role: doc.role,
            },
            "3d"
          );
          resolve({ code: 200, token: token });
          return;
        }

        resolve({ code: 400 });
      } catch (err) {
        reject(err);
      }
    });
  }

  getAll() {
    return new Promise(async (resolve, reject) => {
      try {
        const users = await this.userRepo.getAll();
        resolve(users);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = (userRepo) => {
  return new UserUsecase(userRepo);
};
