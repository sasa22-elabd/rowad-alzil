const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});

function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");

  if (
    (file.fieldname === "image" && isImage) ||
    (file.fieldname === "videoThumbnail" && isImage) ||
    (file.fieldname === "videoFile" && isVideo)
  ) {
    cb(null, true);
  } else {
    cb(new Error("نوع الملف غير مسموح لهذا الحقل"), false);
  }
}

// حد أقصى 200 ميجا للفيديو
const uploadHeroSlide = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

module.exports = uploadHeroSlide;