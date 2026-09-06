const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "غير مصرح لك بالدخول",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;

    next();
  } catch (err) {
    console.error(err);

    return res.status(401).json({
      message: "التوكن غير صالح أو منتهي",
    });
  }
}

module.exports = {
  requireAdmin,
};