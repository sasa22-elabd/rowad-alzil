
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  WorkSection,
  WorkSectionImage,
} = require("../models");

// ======================================================
// UPLOAD DIRECTORIES
// ======================================================

const uploadDir = path.join(
  __dirname,
  "..",
  "public",
  "uploads",
  "work-sections"
);

// إنشاء مجلد الصور إذا لم يكن موجودًا
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const name =
      "work-section-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, name);
  },
});

// ======================================================
// MULTER
// ======================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB للصورة
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "نوع الصورة غير مسموح. استخدم JPG أو PNG أو WEBP أو GIF"
        )
      );
    }
  },
});

// ======================================================
// GET ALL WORK SECTIONS
// ======================================================

router.get("/", async (req, res) => {
  try {
    const sections = await WorkSection.findAll({
      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    console.log(
      "📂 WORK SECTIONS:",
      sections.length
    );

    res.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error(
      "❌ GET WORK SECTIONS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الأقسام",
      error: error.message,
    });
  }
});

// ======================================================
// GET WORK SECTION IMAGES
// مهم: قبل /:id
// ======================================================

router.get("/:id/images", async (req, res) => {
  try {
    const section = await WorkSection.findByPk(
      req.params.id
    );

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "القسم غير موجود",
      });
    }

    const images = await WorkSectionImage.findAll({
      where: {
        workSectionId: req.params.id,
      },

      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    console.log(
      "🖼️ WORK SECTION IMAGES:",
      images.length
    );

    res.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error(
      "❌ GET WORK SECTION IMAGES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب صور القسم",
      error: error.message,
    });
  }
});

// ======================================================
// ADD MULTIPLE WORK SECTION IMAGES
// Frontend field name = images
// ======================================================

router.post(
  "/:id/images",
  upload.array("images", 20),
  async (req, res) => {
    try {
      console.log(
        "🔥 POST WORK SECTION IMAGES"
      );

      console.log(
        "📌 Content-Type:",
        req.headers["content-type"]
      );

      console.log(
        "📌 Section ID:",
        req.params.id
      );

      console.log(
        "📸 Files:",
        req.files
          ? req.files.length
          : 0
      );

      const section =
        await WorkSection.findByPk(
          req.params.id
        );

      if (!section) {
        return res.status(404).json({
          success: false,
          message: "القسم غير موجود",
        });
      }

      if (
        !req.files ||
        req.files.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يجب اختيار صورة واحدة على الأقل",
        });
      }

      const body = req.body || {};

      let imageOrder = 0;

      if (
        body.order !== undefined &&
        body.order !== ""
      ) {
        const parsed =
          Number(body.order);

        if (!Number.isNaN(parsed)) {
          imageOrder = parsed;
        }
      }

      const createdImages = [];

      for (const file of req.files) {
        const imagePath =
          "/uploads/work-sections/" +
          file.filename;

        const image =
          await WorkSectionImage.create({
            workSectionId:
              req.params.id,

            image: imagePath,

            title:
              body.title &&
              typeof body.title === "string" &&
              body.title.trim()
                ? body.title.trim()
                : null,

            description:
              body.description &&
              typeof body.description === "string" &&
              body.description.trim()
                ? body.description.trim()
                : null,

            order: imageOrder,
          });

        createdImages.push(image);

        imageOrder++;
      }

      console.log(
        "✅ WORK SECTION IMAGES CREATED:",
        createdImages.length
      );

      res.status(201).json({
        success: true,

        message:
          `تم إضافة ${createdImages.length} صورة بنجاح`,

        data: createdImages,
      });
    } catch (error) {
      console.error(
        "❌ ADD WORK SECTION IMAGES ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إضافة الصور",
        error: error.message,
      });
    }
  }
);

// ======================================================
// DELETE WORK SECTION IMAGE
// ======================================================

router.delete(
  "/:id/images/:imageId",
  async (req, res) => {
    try {
      const image =
        await WorkSectionImage.findOne({
          where: {
            id: req.params.imageId,

            workSectionId:
              req.params.id,
          },
        });

      if (!image) {
        return res.status(404).json({
          success: false,
          message: "الصورة غير موجودة",
        });
      }

      // ------------------------------------------
      // حذف الملف من السيرفر
      // ------------------------------------------

      if (image.image) {
        const imageFile =
          path.join(
            __dirname,
            "..",
            "public",
            image.image.replace(
              /^\/+/,
              ""
            )
          );

        if (
          fs.existsSync(imageFile)
        ) {
          fs.unlinkSync(imageFile);
        }
      }

      // ------------------------------------------
      // حذف من قاعدة البيانات
      // ------------------------------------------

      await image.destroy();

      console.log(
        "🗑️ WORK SECTION IMAGE DELETED:",
        req.params.imageId
      );

      res.json({
        success: true,
        message:
          "تم حذف الصورة بنجاح",
      });
    } catch (error) {
      console.error(
        "❌ DELETE WORK SECTION IMAGE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف الصورة",
        error: error.message,
      });
    }
  }
);

// ======================================================
// GET ONE WORK SECTION
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const section =
      await WorkSection.findByPk(
        req.params.id
      );

    if (!section) {
      return res.status(404).json({
        success: false,
        message:
          "القسم غير موجود",
      });
    }

    res.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error(
      "❌ GET ONE WORK SECTION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "حدث خطأ أثناء جلب القسم",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE WORK SECTION
// الصورة الرئيسية = image
// ======================================================

router.post(
  "/",
  upload.single("image"),
  async (req, res) => {
    try {
      console.log(
        "🔥 POST /api/work-sections وصل"
      );

      console.log(
        "📌 Content-Type:",
        req.headers["content-type"]
      );

      console.log(
        "📦 Body:",
        req.body
      );

      console.log(
        "📸 File:",
        req.file
          ? req.file.filename
          : "No image"
      );

      const body = req.body || {};

      const {
        title,
        slug,
        shortDescription,
        description,
        order,
        isActive,
      } = body;

      // ------------------------------------------
      // TITLE
      // ------------------------------------------

      if (
        !title ||
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "اسم القسم مطلوب",
        });
      }

      // ------------------------------------------
      // SLUG
      // ------------------------------------------

      let finalSlug = slug;

      if (
        !finalSlug ||
        typeof finalSlug !== "string" ||
        !finalSlug.trim()
      ) {
        finalSlug = title
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(
            /[^\w\u0600-\u06FF-]/g,
            ""
          );
      } else {
        finalSlug =
          finalSlug.trim();
      }

      if (!finalSlug) {
        finalSlug =
          "section-" +
          Date.now();
      }

      // ------------------------------------------
      // CHECK SLUG
      // ------------------------------------------

      const existing =
        await WorkSection.findOne({
          where: {
            slug: finalSlug,
          },
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "هذا الـ slug مستخدم بالفعل",
        });
      }

      // ------------------------------------------
      // MAIN IMAGE
      // ------------------------------------------

      let imagePath = null;

      if (req.file) {
        imagePath =
          "/uploads/work-sections/" +
          req.file.filename;
      }

      // ------------------------------------------
      // ORDER
      // ------------------------------------------

      let sectionOrder = 0;

      if (
        order !== undefined &&
        order !== ""
      ) {
        const parsed =
          Number(order);

        if (!Number.isNaN(parsed)) {
          sectionOrder = parsed;
        }
      }

      // ------------------------------------------
      // ACTIVE
      // ------------------------------------------

      let sectionActive = true;

      if (
        isActive !== undefined
      ) {
        if (
          typeof isActive ===
          "string"
        ) {
          sectionActive =
            isActive === "true" ||
            isActive === "1" ||
            isActive === "on";
        } else {
          sectionActive =
            Boolean(isActive);
        }
      }

      // ------------------------------------------
      // CREATE
      // ------------------------------------------

      const section =
        await WorkSection.create({
          title:
            title.trim(),

          slug:
            finalSlug,

          shortDescription:
            shortDescription &&
            typeof shortDescription ===
              "string"
              ? shortDescription.trim()
              : null,

          description:
            description &&
            typeof description ===
              "string"
              ? description.trim()
              : null,

          image:
            imagePath,

          order:
            sectionOrder,

          isActive:
            sectionActive,
        });

      console.log(
        "✅ WORK SECTION CREATED:",
        section.id
      );

      res.status(201).json({
        success: true,
        message:
          "تم إضافة القسم بنجاح",
        data: section,
      });
    } catch (error) {
      console.error(
        "❌ CREATE WORK SECTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إضافة القسم",
        error: error.message,
      });
    }
  }
);

// ======================================================
// UPDATE WORK SECTION
// ======================================================

router.put(
  "/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      const section =
        await WorkSection.findByPk(
          req.params.id
        );

      if (!section) {
        return res.status(404).json({
          success: false,
          message:
            "القسم غير موجود",
        });
      }

      const body = req.body || {};

      const {
        title,
        slug,
        shortDescription,
        description,
        order,
        isActive,
      } = body;

      // ------------------------------------------
      // SLUG CHECK
      // ------------------------------------------

      if (
        slug &&
        slug.trim() !==
          section.slug
      ) {
        const existing =
          await WorkSection.findOne({
            where: {
              slug:
                slug.trim(),
            },
          });

        if (existing) {
          return res.status(409).json({
            success: false,
            message:
              "هذا الـ slug مستخدم بالفعل",
          });
        }
      }

      const updateData = {};

      // ------------------------------------------
      // TITLE
      // ------------------------------------------

      if (
        title !== undefined
      ) {
        if (
          typeof title !==
            "string" ||
          !title.trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "اسم القسم مطلوب",
          });
        }

        updateData.title =
          title.trim();
      }

      // ------------------------------------------
      // SLUG
      // ------------------------------------------

      if (
        slug !== undefined
      ) {
        updateData.slug =
          slug.trim();
      }

      // ------------------------------------------
      // SHORT DESCRIPTION
      // ------------------------------------------

      if (
        shortDescription !==
        undefined
      ) {
        updateData.shortDescription =
          shortDescription &&
          typeof shortDescription ===
            "string"
            ? shortDescription.trim()
            : null;
      }

      // ------------------------------------------
      // DESCRIPTION
      // ------------------------------------------

      if (
        description !== undefined
      ) {
        updateData.description =
          description &&
          typeof description ===
            "string"
            ? description.trim()
            : null;
      }

      // ------------------------------------------
      // MAIN IMAGE
      // ------------------------------------------

      if (req.file) {
        // حذف الصورة القديمة
        if (section.image) {
          const oldImage =
            path.join(
              __dirname,
              "..",
              "public",
              section.image.replace(
                /^\/+/,
                ""
              )
            );

          if (
            fs.existsSync(
              oldImage
            )
          ) {
            fs.unlinkSync(
              oldImage
            );
          }
        }

        updateData.image =
          "/uploads/work-sections/" +
          req.file.filename;
      }

      // ------------------------------------------
      // ORDER
      // ------------------------------------------

      if (
        order !== undefined &&
        order !== ""
      ) {
        const parsed =
          Number(order);

        if (!Number.isNaN(parsed)) {
          updateData.order =
            parsed;
        }
      }

      // ------------------------------------------
      // ACTIVE
      // ------------------------------------------

      if (
        isActive !== undefined
      ) {
        if (
          typeof isActive ===
          "string"
        ) {
          updateData.isActive =
            isActive === "true" ||
            isActive === "1" ||
            isActive === "on";
        } else {
          updateData.isActive =
            Boolean(isActive);
        }
      }

      // ------------------------------------------
      // SAVE
      // ------------------------------------------

      await section.update(
        updateData
      );

      console.log(
        "✅ WORK SECTION UPDATED:",
        section.id
      );

      res.json({
        success: true,
        message:
          "تم تعديل القسم بنجاح",
        data: section,
      });
    } catch (error) {
      console.error(
        "❌ UPDATE WORK SECTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تعديل القسم",
        error: error.message,
      });
    }
  }
);

// ======================================================
// DELETE WORK SECTION
// ======================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const section =
        await WorkSection.findByPk(
          req.params.id
        );

      if (!section) {
        return res.status(404).json({
          success: false,
          message:
            "القسم غير موجود",
        });
      }

      // ------------------------------------------
      // حذف الصورة الرئيسية
      // ------------------------------------------

      if (section.image) {
        const imageFile =
          path.join(
            __dirname,
            "..",
            "public",
            section.image.replace(
              /^\/+/,
              ""
            )
          );

        if (
          fs.existsSync(
            imageFile
          )
        ) {
          fs.unlinkSync(
            imageFile
          );
        }
      }

      // ------------------------------------------
      // حذف صور القسم من الملفات
      // ------------------------------------------

      const sectionImages =
        await WorkSectionImage.findAll({
          where: {
            workSectionId:
              req.params.id,
          },
        });

      for (
        const image of sectionImages
      ) {
        if (image.image) {
          const imageFile =
            path.join(
              __dirname,
              "..",
              "public",
              image.image.replace(
                /^\/+/,
                ""
              )
            );

          if (
            fs.existsSync(
              imageFile
            )
          ) {
            fs.unlinkSync(
              imageFile
            );
          }
        }
      }

      // ------------------------------------------
      // حذف صور القسم من DB
      // ------------------------------------------

      await WorkSectionImage.destroy({
        where: {
          workSectionId:
            req.params.id,
        },
      });

      // ------------------------------------------
      // حذف القسم
      // ------------------------------------------

      await section.destroy();

      console.log(
        "🗑️ WORK SECTION DELETED:",
        req.params.id
      );

      res.json({
        success: true,
        message:
          "تم حذف القسم بنجاح",
      });
    } catch (error) {
      console.error(
        "❌ DELETE WORK SECTION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف القسم",
        error: error.message,
      });
    }
  }
);

// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      console.error(
        "❌ MULTER ERROR:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          "حدث خطأ أثناء رفع الصورة",
        error:
          error.message,
        field:
          error.field || null,
      });
    }

    if (error) {
      console.error(
        "❌ WORK SECTION ERROR:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    next();
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;
