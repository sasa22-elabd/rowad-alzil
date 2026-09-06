const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin only
router.post("/", requireAdmin, upload.single("image"), createCategory);
router.put("/:id", requireAdmin, upload.single("image"), updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

module.exports = router;