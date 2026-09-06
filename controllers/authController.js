const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Admin } = require("../models");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "من فضلك ادخل البريد وكلمة المرور" });
    }

    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
}

module.exports = { login };