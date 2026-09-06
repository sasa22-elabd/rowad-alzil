const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const { requireAdmin } = require("../middleware/auth");

// Public - العميل بيعمل الطلب من صفحة checkout
router.post("/", createOrder);

// Admin only
router.get("/", requireAdmin, getOrders);
router.get("/:id", requireAdmin, getOrder);
router.put("/:id/status", requireAdmin, updateOrderStatus);
router.delete("/:id", requireAdmin, deleteOrder);

module.exports = router;