const fs = require("fs");

const serialNumber = require("serial-number");
const macaddress = require("macaddress");

const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const key = "x6vb7r5t867ny9uf6bg7n8hum9";
const iv = crypto.randomBytes(16);

class License {
  constructor() {}

  isLicenseValid() {
    return new Promise(async (resolve, reject) => {
      try {
        const config = await getConfig();
        await this.verifyMacAddress(config.mac_address);
        await this.verifyHDDSerialNumber(config.hdd_sl);
        resolve(config);
      } catch (err) {
        reject(err);
      }
    });
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      try {
        const rawJsonStr = fs.readFileSync(
          path.resolve(process.execPath, "../key.json"),
          "utf-8"
        );
        const jsonStr = decrypt(rawJsonStr);
        const config = JSON.parse(jsonStr);
        resolve(config);
      } catch (err) {
        reject(err);
      }
    });
  }

  verifyMacAddress() {
    return new Promise((resolve, reject) => {
      macaddress.one(function (err, macAddress) {
        if (err) {
          console.log("[ERROR]", "[MAC-ADDRESS]", err);
          reject(err);
          return;
        }

        if (data !== macAddress) {
          reject(new Error("Incorrect Mac Address"));
        }
        resolve();
      });
    });
  }

  verifyHDDSerialNumber() {
    return new Promise((resolve, reject) => {
      serialNumber(function (err, value) {
        if (err) {
          console.log("[ERROR]", "[HDD_SERIAL_NUMBER]", err);
          reject(err);
          return;
        }

        if (data !== value) {
          reject(new Error("Incorrect HDD Serial Number"));
        }
        resolve();
      });
    });
  }

  startTimeChecker() {}
}

module.exports = new License();

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
}

function decrypt(text) {
  let iv = Buffer.from(text.iv, "hex");
  let encryptedText = Buffer.from(text.encryptedData, "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
