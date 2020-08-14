const jwt = require("../services/jwt");

const unProtectedRoutes = {
  "/example/login": true,
  "/example": true
};

async function auth(req, res, next) {
  if (unProtectedRoutes[req.path] === true) {
    next();
    return;
  }

  try {
    const token = req.headers["x-access-token"];

    if (token === undefined) {
      res.json({ code: 403, msg: "Access Denied" });
      res.end();
      return;
    } else {
      const decoded = await jwt.verify(token);

      if (decoded.role !== "ADMIN") {
        res.json({ code: 403, msg: "Access Denied" });
        res.end();
        return;
      }
    }
  } catch (err) {
    res.json({ code: 403, msg: "Access Denied" });
    res.end();
    return;
  }

  next();
}

module.exports = auth;
