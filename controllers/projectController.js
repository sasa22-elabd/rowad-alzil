const { Project } = require("../models");
const fs = require("fs");
const path = require("path");

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في جلب المشاريع" });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في جلب المشروع" });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { title, tag, description, order } = req.body;

    if (!title) {
      return res.status(400).json({ message: "اسم المشروع مطلوب" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "صورة المشروع مطلوبة" });
    }

    const project = await Project.create({
      title,
      tag: tag || null,
      description: description || null,
      order: order ? parseInt(order) : 0,
      image: req.file.filename,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في إضافة المشروع" });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    const { title, tag, description, order } = req.body;
    const oldImage = project.image;

    await project.update({
      title: title ?? project.title,
      tag: tag ?? project.tag,
      description: description ?? project.description,
      order: order !== undefined ? parseInt(order) : project.order,
      image: req.file ? req.file.filename : project.image,
    });

    if (req.file && oldImage) {
      const oldPath = path.join(__dirname, "..", "public", "uploads", oldImage);
      fs.unlink(oldPath, () => {});
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في تعديل المشروع" });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    if (project.image) {
      const imgPath = path.join(__dirname, "..", "public", "uploads", project.image);
      fs.unlink(imgPath, () => {});
    }

    await project.destroy();

    res.json({ message: "تم حذف المشروع" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في حذف المشروع" });
  }
};