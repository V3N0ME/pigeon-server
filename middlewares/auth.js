const jwt = require("../services/jwt");

const unProtectedRoutes = {
  "/player/register": true,
  "/user/login": true,
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
      req.decoded = {
        id: decoded.id,
        role: decoded.role,
      };
    }
  } catch (err) {
    res.json({ code: 403, msg: "Access Denied" });
    res.end();
    return;
  }

  next();
}

module.exports = auth;
