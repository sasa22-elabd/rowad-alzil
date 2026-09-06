const { Setting } = require("../models");

async function getSettings(req, res) {
  try {
    let settings = await Setting.findByPk(1);

    if (!settings) {
      settings = await Setting.create({ id: 1 });
    }

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر جلب الإعدادات" });
  }
}

async function updateSettings(req, res) {
  try {
    let settings = await Setting.findByPk(1);

    if (!settings) {
      settings = await Setting.create({ id: 1 });
    }

    const fields = [
      "siteName",
      "siteNameEn",
      "phone",
      "phoneIntl",
      "whatsapp",
      "email",
      "address",
      "facebook",
      "instagram",
      "twitter",
      "linkedin",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    // اللوجو العادي (الداخلي)
    if (req.files && req.files.logo && req.files.logo[0]) {
      settings.logo = req.files.logo[0].filename;
    }

    // اللوجو الخارجي (Favicon + صورة المشاركة)
    if (req.files && req.files.logoExternal && req.files.logoExternal[0]) {
      settings.logoExternal = req.files.logoExternal[0].filename;
    }

    await settings.save();

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر تعديل الإعدادات" });
  }
}

module.exports = { getSettings, updateSettings };