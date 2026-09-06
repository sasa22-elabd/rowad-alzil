const express = require("express");
const router = express.Router();

const servicesController = require("../controllers/serviceController");
const { requireAdmin: authMiddleware } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public
router.get("/", servicesController.getAllServices);
router.get("/:id", servicesController.getServiceById);

// Protected
router.post(
    "/",
    authMiddleware,
    upload.single("image"),
    servicesController.createService
);

router.put(
    "/:id",
    authMiddleware,
    upload.single("image"),
    servicesController.updateService
);

router.delete(
    "/:id",
    authMiddleware,
    servicesController.deleteService
);

module.exports = router;