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

  register(player) {
    return new Promise(async (resolve, reject) => {
      try {
        const resp = await this.userRepo.create(player);
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
        const resp = await this.userRepo.login(credentials);
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
