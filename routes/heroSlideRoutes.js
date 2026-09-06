const express = require("express");
const router = express.Router();

const {
  getSlides,
  getSlide,
  createSlide,
  updateSlide,
  deleteSlide,
} = require("../controllers/heroSlideController");

const uploadHeroSlide = require("../middleware/uploadHeroSlide");

// ✅ الاستيراد الصح: auth.js بيعمل export لـ { requireAdmin }
const { requireAdmin } = require("../middleware/auth");

const uploadFields = uploadHeroSlide.fields([
  { name: "image", maxCount: 1 },
  { name: "videoThumbnail", maxCount: 1 },
  { name: "videoFile", maxCount: 1 },
]);

// عام - الموقع بيقرأ منه بدون توكن
router.get("/", getSlides);
router.get("/:id", getSlide);

// محمي - الأدمن بس
router.post("/", requireAdmin, uploadFields, createSlide);
router.put("/:id", requireAdmin, uploadFields, updateSlide);
router.delete("/:id", requireAdmin, deleteSlide);

module.exports = router;