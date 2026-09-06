const { Article } = require("../models");
const fs = require("fs");
const path = require("path");

// GET /api/articles?page=&limit=&search=
exports.getArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { Op } = require("sequelize");

    const where = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { excerpt: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Article.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      articles: rows,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في جلب المقالات" });
  }
};

// GET /api/articles/:slug (بيشتغل برضه لو بعتت id رقم)
exports.getArticleBySlug = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const key = req.params.slug;

    const article = await Article.findOne({
      where: {
        [Op.or]: [{ slug: key }, { id: isNaN(key) ? -1 : key }],
      },
    });

    if (!article) {
      return res.status(404).json({ message: "المقال غير موجود" });
    }

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في جلب المقال" });
  }
};

// POST /api/articles
exports.createArticle = async (req, res) => {
  try {
    const {
      title,
      slug,
      category,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      published,
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: "العنوان والرابط (slug) مطلوبين" });
    }

    const article = await Article.create({
      title,
      slug,
      category: category || null,
      excerpt: excerpt || null,
      content: content || null,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || null,
      metaKeywords: metaKeywords || null,
      published: published === "true" || published === true,
      image: req.file ? req.file.filename : null,
    });

    res.status(201).json(article);
  } catch (err) {
    console.error(err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "رابط المقال (slug) مستخدم بالفعل" });
    }

    res.status(500).json({ message: "خطأ في إضافة المقال" });
  }
};

// PUT /api/articles/:id
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "المقال غير موجود" });
    }

    const {
      title,
      slug,
      category,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      published,
    } = req.body;

    const oldImage = article.image;

    await article.update({
      title: title ?? article.title,
      slug: slug ?? article.slug,
      category: category ?? article.category,
      excerpt: excerpt ?? article.excerpt,
      content: content ?? article.content,
      metaTitle: metaTitle ?? article.metaTitle,
      metaDescription: metaDescription ?? article.metaDescription,
      metaKeywords: metaKeywords ?? article.metaKeywords,
      published:
        published === undefined ? article.published : published === "true" || published === true,
      image: req.file ? req.file.filename : article.image,
    });

    // امسح الصورة القديمة لو اتغيرت
    if (req.file && oldImage) {
      const oldPath = path.join(__dirname, "..", "public", "uploads", oldImage);
      fs.unlink(oldPath, () => {});
    }

    res.json(article);
  } catch (err) {
    console.error(err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "رابط المقال (slug) مستخدم بالفعل" });
    }

    res.status(500).json({ message: "خطأ في تعديل المقال" });
  }
};

// DELETE /api/articles/:id
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "المقال غير موجود" });
    }

    if (article.image) {
      const imgPath = path.join(__dirname, "..", "public", "uploads", article.image);
      fs.unlink(imgPath, () => {});
    }

    await article.destroy();

    res.json({ message: "تم حذف المقال" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في حذف المقال" });
  }
};