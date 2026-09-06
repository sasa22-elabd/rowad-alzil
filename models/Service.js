/* =========================================================
   رواد الظل | Services Routes
   ⚠️ عدّل الـ requires تحت على حسب أسامي الملفات عندك.
   لو عندك middleware/upload.js و middleware/auth.js
   مستخدمين بالفعل في routes/products.js أو routes/projects.js،
   استخدم نفس الملفين هنا بدل النسخة الاحتياطية تحت.
========================================================= */

const express = require("express");
const router = express.Router();

const servicesController = require("../controllers/servicesController");

/* ---------------------------------------------------------
   1) لو عندك middleware جاهز لل auth، استبدل السطر ده:
--------------------------------------------------------- */
let authMiddleware;
try {
  authMiddleware = require("../middleware/auth"); // أو middlewares/authMiddleware حسب تسميتك
} catch (e) {
  // Fallback بسيط جداً لو الملف مش موجود بنفس الاسم ده — لازم تستبدله
  // بنفس الـ middleware اللي بيتشك فيه على التوكن في routes/products.js
  authMiddleware = (req, res, next) => {
    console.warn(
      "⚠️ لم يتم العثور على middleware/auth.js — استبدل هذا بملف التوكن الحقيقي عندك"
    );
    next();
  };
}

/* ---------------------------------------------------------
   2) لو عندك middleware جاهز لرفع الصور بـ multer، استبدل ده:
--------------------------------------------------------- */
let upload;
try {
  upload = require("../middleware/upload"); // أو middlewares/uploadMiddleware حسب تسميتك
} catch (e) {
  // Fallback: نسخة Multer بسيطة بتحفظ في مجلد /uploads
  const multer = require("multer");
  const path = require("path");

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../uploads"));
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  upload = multer({ storage });
}

/* =========================================================
   ROUTES
========================================================= */

// عام — بيستخدمه الموقع (index.html) من غير توكن
router.get("/", servicesController.getAllServices);
router.get("/:id", servicesController.getServiceById);

// محمي — لوحة التحكم بس
router.post("/", authMiddleware, upload.single("image"), servicesController.createService);
router.put("/:id", authMiddleware, upload.single("image"), servicesController.updateService);
router.delete("/:id", authMiddleware, servicesController.deleteService);

module.exports = router;

/* =========================================================
   وأخيراً: في ملف app.js / server.js الرئيسي بتاعك،
   ضيف السطر ده جنب باقي الـ routes (products, projects...):

     const servicesRoutes = require("./routes/services");
     app.use("/api/services", servicesRoutes);

   لو routes/projects.js موجود، افتحه وشوف بالظبط:
     - اسم ملف الـ auth middleware
     - اسم ملف الـ upload middleware
     - وطريقة تعريف الموديل (models/index.js ولا ملف منفصل)
   وابعتهملي لو عايز أظبط الكود فوق بالظبط زيه 100%.
========================================================= */