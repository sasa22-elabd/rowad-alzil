const express = require("express");
const router = express.Router();
const multer = require("multer");
const settingsController = require("../controllers/settingController");

const upload = multer({ dest: "public/uploads/" });

router.get("/", settingsController.getSettings);

router.put(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "logoExternal", maxCount: 1 },
  ]),
  settingsController.updateSettings
);

module.exports = router;