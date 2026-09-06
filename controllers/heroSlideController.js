const { HeroSlide } = require("../models");

/* =========================================================
   جلب كل السلايدات (عام - بدون توكن) - مرتبة حسب order
========================================================= */
async function getSlides(req, res) {
  try {
    const slides = await HeroSlide.findAll({
      order: [["order", "ASC"]],
    });

    res.json(slides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر جلب سلايدات الصفحة الرئيسية" });
  }
}

/* =========================================================
   جلب سلايد واحد
========================================================= */
async function getSlide(req, res) {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: "السلايد غير موجود" });
    res.json(slide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر جلب السلايد" });
  }
}

/* =========================================================
   إنشاء سلايد جديد (محمي)
========================================================= */
async function createSlide(req, res) {
  try {
    const payload = buildPayloadFromBody(req.body);

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        payload.image = req.files.image[0].filename;
      }
      if (req.files.videoThumbnail && req.files.videoThumbnail[0]) {
        payload.videoThumbnail = req.files.videoThumbnail[0].filename;
      }
      if (req.files.videoFile && req.files.videoFile[0]) {
        payload.videoUrl = "/uploads/" + req.files.videoFile[0].filename;
      }
    }

    const slide = await HeroSlide.create(payload);
    res.status(201).json(slide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر إضافة السلايد" });
  }
}

/* =========================================================
   تعديل سلايد (محمي)
========================================================= */
async function updateSlide(req, res) {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: "السلايد غير موجود" });

    const payload = buildPayloadFromBody(req.body);
    Object.assign(slide, payload);

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        slide.image = req.files.image[0].filename;
      }
      if (req.files.videoThumbnail && req.files.videoThumbnail[0]) {
        slide.videoThumbnail = req.files.videoThumbnail[0].filename;
      }
      if (req.files.videoFile && req.files.videoFile[0]) {
        slide.videoUrl = "/uploads/" + req.files.videoFile[0].filename;
      }
    }

    await slide.save();
    res.json(slide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر تعديل السلايد" });
  }
}

/* =========================================================
   حذف سلايد (محمي)
========================================================= */
async function deleteSlide(req, res) {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: "السلايد غير موجود" });

    await slide.destroy();
    res.json({ message: "تم حذف السلايد" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر حذف السلايد" });
  }
}

/* =========================================================
   أداة مساعدة: بناء الحقول النصية من body
   (لو فيه رابط فيديو خارجي مكتوب يدوي، بياخده هنا)
========================================================= */
function buildPayloadFromBody(body) {
  const fields = [
    "order",
    "label",
    "title",
    "description",
    "buttonText",
    "buttonLink",
    "videoText",
  ];

  const payload = {};

  fields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (payload.order !== undefined) {
    payload.order = Number(payload.order) || 0;
  }

  // لو المستخدم كتب رابط فيديو خارجي (مش رافع ملف)
  if (body.videoUrl !== undefined && body.videoUrl !== "") {
    payload.videoUrl = body.videoUrl;
  }

  return payload;
}

module.exports = {
  getSlides,
  getSlide,
  createSlide,
  updateSlide,
  deleteSlide,
};