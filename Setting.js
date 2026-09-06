/* =========================================================
   رواد الظل | site-settings.js
   بيجيب الإعدادات العامة (اللوجو، الأرقام، السوشيال) من الـ API
   وبيحدّث كل الصفحة تلقائيًا. حطه بعد dark-mode.js في كل صفحة.
========================================================= */

(function () {
  "use strict";

 function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
}

  async function applySettings() {
    let data;

    try {
      const res = await fetch("/api/settings");
      data = await res.json();
    } catch (err) {
      console.warn("تعذر تحميل الإعدادات العامة:", err);
      return;
    }

    if (!data) return;

    /* ================= اللوجو ================= */
    if (data.logo) {
      const logoUrl = resolveImage(data.logo);
      document
        .querySelectorAll(".brand-logo img, .rz-footer-logo img, .mobile-nav-head img")
        .forEach((img) => {
          img.src = logoUrl;
        });
    }

    /* ================= اسم الشركة ================= */
    if (data.siteName) {
      document.querySelectorAll(".rz-logo-text strong").forEach((el) => {
        el.textContent = data.siteName;
      });

      document
        .querySelectorAll(".brand-logo img, .rz-footer-logo img, .mobile-nav-head img")
        .forEach((img) => {
          img.alt = data.siteName;
        });
    }

    if (data.siteNameEn) {
      document.querySelectorAll(".rz-logo-text small").forEach((el) => {
        el.textContent = data.siteNameEn;
      });
    }

    /* ================= الهاتف ================= */
    if (data.phoneIntl) {
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        a.href = "tel:" + data.phoneIntl;
      });
    }

    if (data.phone) {
      document
        .querySelectorAll('.rz-contact-item[href^="tel:"] .rz-contact-text')
        .forEach((el) => {
          el.textContent = data.phone;
        });

      document.querySelectorAll(".mobile-call").forEach((el) => {
        // بيسيب النص الأساسي ("كلّمنا الآن") ويحدّث الرابط بس
      });
    }

    /* ================= البريد الإلكتروني ================= */
    if (data.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
        a.href = "mailto:" + data.email;

        const textEl = a.querySelector(".rz-contact-text");
        if (textEl) textEl.textContent = data.email;
      });
    }

    /* ================= العنوان ================= */
    if (data.address) {
      document
        .querySelectorAll(".rz-address .rz-contact-text")
        .forEach((el) => {
          el.textContent = data.address;
        });
    }

    /* ================= السوشيال ميديا ================= */
    const socialMap = {
      Facebook: data.facebook,
      Instagram: data.instagram,
      X: data.twitter,
      LinkedIn: data.linkedin,
    };

    Object.keys(socialMap).forEach((label) => {
      const url = socialMap[label];
      if (!url) return;

      document
        .querySelectorAll(`.rz-social a[aria-label="${label}"]`)
        .forEach((a) => {
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        });
    });

    /* ================= جميع الحقوق محفوظة ================= */
    if (data.siteName) {
      document.querySelectorAll(".rz-copyright strong").forEach((el) => {
        el.textContent = data.siteName;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySettings);
  } else {
    applySettings();
  }
})();