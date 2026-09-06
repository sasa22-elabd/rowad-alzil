const express = require("express");
const router = express.Router();

const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public
router.get("/", getProjects);
router.get("/:id", getProjectById);

// Protected
router.post("/", requireAdmin, upload.single("image"), createProject);
router.put("/:id", requireAdmin, upload.single("image"), updateProject);
router.delete("/:id", requireAdmin, deleteProject);

module.exports = router;