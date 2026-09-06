const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin only
router.post("/", requireAdmin, upload.single("image"), createProduct);
router.put("/:id", requireAdmin, upload.single("image"), updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

module.exports = router;