const fs = require("fs");
const path = require("path");

/* =========================================================
   ⚠️ لازم تتأكد إن WorkSection متسجل في models/index.js
   زي باقي الموديلات (Category, Product, Project...)
   لو مش متسجل، ضيفله سطر زي بتوعهم في نفس الملف.
========================================================= */
const { WorkSection } = require("../models");

/* =========================================================
   GET /api/work-sections   (Public)
========================================================= */
exports.getAllWorkSections = async (req, res) => {
  try {
    const sections = await WorkSection.findAll({
      order: [["order", "ASC"]],
    });

    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حصل خطأ أثناء جلب أقسام الأعمال" });
  }
};

/* =========================================================
   GET /api/work-sections/:slug   (Public - لصفحة القسم)
========================================================= */
exports.getWorkSectionBySlug = async (req, res) => {
  try {
    const section = await WorkSection.findOne({
      where: { slug: req.params.slug, isActive: true },
    });

    if (!section) {
      return res.status(404).json({ message: "القسم غير موجود" });
    }

    res.json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حصل خطأ أثناء جلب القسم" });
  }
};

/* =========================================================
   POST /api/work-sections   (Protected)
========================================================= */
exports.createWorkSection = async (req, res) => {
  try {
    const { title, slug, shortDescription, description, order, isActive } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: "العنوان والرابط (slug) مطلوبين" });
    }

    const existing = await WorkSection.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ message: "الرابط (slug) ده مستخدم قبل كده" });
    }

    const section = await WorkSection.create({
      title,
      slug,
      shortDescription: shortDescription || null,
      description: description || null,
      order: order ? Number(order) : 0,
      isActive:
        isActive === undefined ? true : isActive === "true" || isActive === true,
      image: req.file ? req.file.filename : null,
    });

    res.status(201).json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حصل خطأ أثناء إضافة القسم" });
  }
};

/* =========================================================
   PUT /api/work-sections/:id   (Protected)
========================================================= */
exports.updateWorkSection = async (req, res) => {
  try {
    const section = await WorkSection.findByPk(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "القسم غير موجود" });
    }

    const { title, slug, shortDescription, description, order, isActive } = req.body;

    if (slug && slug !== section.slug) {
      const existing = await WorkSection.findOne({ where: { slug } });
      if (existing) {
        return res.status(400).json({ message: "الرابط (slug) ده مستخدم قبل كده" });
      }
    }

    // لو اترفعت صورة جديدة، امسح القديمة من على السيرفر
    if (req.file) {
      if (section.image) {
        const oldPath = path.join(__dirname, "..", "public", "uploads", section.image);
        fs.unlink(oldPath, () => {});
      }
      section.image = req.file.filename;
    }

    section.title = title ?? section.title;
    section.slug = slug ?? section.slug;
    section.shortDescription = shortDescription ?? section.shortDescription;
    section.description = description ?? section.description;
    section.order = order !== undefined ? Number(order) : section.order;

    if (isActive !== undefined) {
      section.isActive = isActive === "true" || isActive === true;
    }

    await section.save();

    res.json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حصل خطأ أثناء تعديل القسم" });
  }
};

/* =========================================================
   DELETE /api/work-sections/:id   (Protected)
========================================================= */
exports.deleteWorkSection = async (req, res) => {
  try {
    const section = await WorkSection.findByPk(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "القسم غير موجود" });
    }

    if (section.image) {
      const imgPath = path.join(__dirname, "..", "public", "uploads", section.image);
      fs.unlink(imgPath, () => {});
    }

    await section.destroy();

    res.json({ message: "تم حذف القسم بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حصل خطأ أثناء حذف القسم" });
  }
};