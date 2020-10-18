const jwt = require("../services/jwt");

class PlayerUsecase {
  constructor(playerRepo) {
    this.playerRepo = playerRepo;
  }

  register(player) {
    return new Promise(async (resolve, reject) => {
      try {
        const details = await this.playerRepo.getPlayer(
          player.name,
          player.uuid
        );
        if (details) {
          const token = await jwt.sign(
            {
              id: details._id,
              role: "player",
            },
            "3d"
          );
          resolve({ code: 200, token: token });
          return;
        }

        const resp = await this.playerRepo.create(player);
        if (resp.code === 200) {
          const token = await jwt.sign(
            {
              id: resp._id,
              role: "player",
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
        const players = await this.playerRepo.getAll();
        resolve(players);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = (playerRepo) => {
  return new PlayerUsecase(playerRepo);
};
