require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, Admin } = require("./models");

async function seed() {
  await sequelize.sync();

  const email = process.env.ADMIN_EMAIL || "admin@rowadalthil.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await Admin.findOne({ where: { email } });

  if (existing) {
    console.log("⚠️  يوجد أدمن بالفعل بهذا البريد:", email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);

  await Admin.create({ email, password: hashed });

  console.log("✅ تم إنشاء حساب الأدمن بنجاح");
  console.log("   البريد:", email);
  console.log("   كلمة المرور:", password);

  process.exit(0);
}

seed();