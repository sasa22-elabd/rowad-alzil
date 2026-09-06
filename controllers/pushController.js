const { PushSubscription } = require("../models");

exports.getPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: "بيانات الاشتراك غير مكتملة" });
    }

    await PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: { p256dh: keys.p256dh, auth: keys.auth },
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "فشل حفظ الاشتراك" });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.destroy({ where: { endpoint } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "فشل إلغاء الاشتراك" });
  }
};