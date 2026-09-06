const { Category, Product } = require("../models");

function slugify(text) {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "");
}

// GET /api/categories
async function getCategories(req, res) {
  try {
    const categories = await Category.findAll({ order: [["id", "DESC"]] });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب التصنيفات" });
  }
}

// GET /api/categories/:id
async function getCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Product }],
    });

    if (!category) {
      return res.status(404).json({ message: "التصنيف غير موجود" });
    }

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب التصنيف" });
  }
}

// POST /api/categories  (admin only)
async function createCategory(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "اسم التصنيف مطلوب" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const category = await Category.create({
      name,
      slug: slugify(name) + "-" + Date.now(),
      image,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء التصنيف" });
  }
}

// PUT /api/categories/:id  (admin only)
async function updateCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "التصنيف غير موجود" });
    }

    const { name } = req.body;

    if (name) category.name = name;
    if (req.file) category.image = `/uploads/${req.file.filename}`;

    await category.save();

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء تعديل التصنيف" });
  }
}

// DELETE /api/categories/:id  (admin only)
async function deleteCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "التصنيف غير موجود" });
    }

    await category.destroy();

    res.json({ message: "تم حذف التصنيف بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء حذف التصنيف" });
  }
}

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};