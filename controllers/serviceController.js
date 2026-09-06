/* =========================================================
   رواد الظل | Services Controller
   ⚠️ عدّل السطر ده على حسب مكان تعريف موديلاتك:
========================================================= */

const { Service } = require("../models"); // لو عندك models/index.js بيجمعهم
// أو لو كل موديل بيتعمل له require منفصل:
// const Service = require("../models/Service");

/* =========================================================
   GET /api/services
   عام (من غير توكن) — يظهر في الموقع
========================================================= */
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [["order", "ASC"]],
    });

    return res.json(services);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حصل خطأ في جلب الخدمات" });
  }
};

/* =========================================================
   GET /api/services/:id
========================================================= */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "الخدمة غير موجودة" });
    }

    return res.json(service);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حصل خطأ في جلب الخدمة" });
  }
};

/* =========================================================
   POST /api/services
   محمي بالتوكن (Admin) — بيستقبل FormData
========================================================= */
exports.createService = async (req, res) => {
  try {
    const { title, description, tag, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "اسم الخدمة مطلوب" });
    }

    // req.file جاي من الـ multer middleware (شوف routes/services.js)
    const imagePath = req.file ? req.file.filename : null;

    const service = await Service.create({
      title: title.trim(),
      description: description || "",
      tag: tag || "",
      order: order ? parseInt(order, 10) : 0,
      image: imagePath,
    });

    return res.status(201).json(service);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حصل خطأ في إضافة الخدمة" });
  }
};

/* =========================================================
   PUT /api/services/:id
========================================================= */
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "الخدمة غير موجودة" });
    }

    const { title, description, tag, order } = req.body;

    if (title !== undefined) service.title = title.trim();
    if (description !== undefined) service.description = description;
    if (tag !== undefined) service.tag = tag;
    if (order !== undefined) service.order = parseInt(order, 10) || 0;

    if (req.file) {
      service.image = req.file.filename;
    }

    await service.save();

    return res.json(service);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حصل خطأ في تعديل الخدمة" });
  }
};

/* =========================================================
   DELETE /api/services/:id
========================================================= */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "الخدمة غير موجودة" });
    }

    await service.destroy();

    return res.json({ message: "تم حذف الخدمة" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حصل خطأ في حذف الخدمة" });
  }
};