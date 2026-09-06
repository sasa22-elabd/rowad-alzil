const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToAll(payload) {
  const { PushSubscription } = require("../models");
  const subs = await PushSubscription.findAll();

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const code = result.reason && result.reason.statusCode;
      if (code === 404 || code === 410) {
        subs[i].destroy();
      }
    }
  });
}

module.exports = { sendPushToAll };