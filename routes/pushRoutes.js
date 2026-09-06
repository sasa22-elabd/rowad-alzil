const express = require("express");
const router = express.Router();

const pushController = require("../controllers/pushController");
const { requireAdmin } = require("../middleware/auth");

router.get("/vapid-public-key", pushController.getPublicKey);
router.post("/subscribe", requireAdmin, pushController.subscribe);
router.post("/unsubscribe", requireAdmin, pushController.unsubscribe);

module.exports = router;