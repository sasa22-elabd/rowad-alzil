const express = require("express");
const router = express.Router();

const {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../controllers/articleController");

const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public
router.get("/", getArticles);
router.get("/:slug", getArticleBySlug);

// Protected
router.post("/", requireAdmin, upload.single("image"), createArticle);
router.put("/:id", requireAdmin, upload.single("image"), updateArticle);
router.delete("/:id", requireAdmin, deleteArticle);

module.exports = router;