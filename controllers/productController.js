const { Product, Category } = require("../models");

// GET /api/products?page=1&limit=10&categoryId=2
async function getProducts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    if (req.query.categoryId) where.categoryId = req.query.categoryId;

    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ["id", "name", "slug"] }],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.json({
      products: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المنتجات" });
  }
}

// GET /api/products/:id
async function getProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ["id", "name", "slug"] }],
    });

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المنتج" });
  }
}

// POST /api/products  (admin only)
async function createProduct(req, res) {
  try {
    const { title, description, price, oldPrice, discount, categoryId } = req.body;

    if (!title || !price) {
      return res.status(400).json({ message: "اسم المنتج والسعر مطلوبان" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "صورة المنتج مطلوبة" });
    }

    const product = await Product.create({
      title,
      description,
      price,
      oldPrice: oldPrice || null,
      discount: discount || null,
      categoryId: categoryId || null,
      image: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء المنتج" });
  }
}

// PUT /api/products/:id  (admin only)
async function updateProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const { title, description, price, oldPrice, discount, categoryId, isActive } = req.body;

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (oldPrice !== undefined) product.oldPrice = oldPrice;
    if (discount !== undefined) product.discount = discount;
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (isActive !== undefined) product.isActive = isActive;
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء تعديل المنتج" });
  }
}

// DELETE /api/products/:id  (admin only)
async function deleteProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    await product.destroy();

    res.json({ message: "تم حذف المنتج بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء حذف المنتج" });
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};