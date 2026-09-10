/* =========================================================
   رواد الظل | settings-loader.js
   بيجيب إعدادات الموقع (اللوجو، الاسم، بيانات التواصل، السوشيال)
   من /api/settings ويحدّثها تلقائيًا في أي صفحة فيها العناصر دي:

   - <img data-settings-logo>                  → اللوجو الداخلي
   - <link data-settings-favicon>               → اللوجو الخارجي/الأيقونة
   - <meta property="og:image" data-settings-og-image> → صورة المشاركة
   - <* data-settings="siteName">                → أي نص (siteName, siteNameEn, phone, email, address...)
   - <a data-settings-href="tel:phoneIntl">       → روابط تتغيّر (tel:, mailto:, link:facebook...)

   بعد ما يخلص تحميل، بيبعت حدث "rw:settings-loaded" لأي كود تاني
   محتاج يستخدم نفس البيانات (زي تحديث الـ JSON-LD في index.html).
========================================================= */

(function () {
  "use strict";

  const API_BASE = window.RW_API_BASE || "";

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  async function loadSettings() {
    let data;

    try {
      const res = await fetch(API_BASE + "/api/settings", { cache: "no-store" });
      if (!res.ok) return;
      data = await res.json();
    } catch (err) {
      console.error("تعذر تحميل إعدادات الموقع:", err);
      return;
    }

    if (!data) return;

    window.RW_SETTINGS = data;

    /* اللوجو الداخلي (هيدر / فوتر) */
    if (data.logo) {
      const logoUrl = resolveImage(data.logo);
      document.querySelectorAll("[data-settings-logo]").forEach((img) => {
        img.src = logoUrl;
      });
    }

    /* اللوجو الخارجي (Favicon + مشاركة السوشيال) */
    const externalLogo = data.logoExternal || data.logo;
    if (externalLogo) {
      const externalUrl = resolveImage(externalLogo);

      document.querySelectorAll("[data-settings-favicon]").forEach((link) => {
        link.href = externalUrl;
      });

      document.querySelectorAll("[data-settings-og-image]").forEach((meta) => {
        meta.setAttribute("content", externalUrl);
      });
    }

    /* النصوص (اسم الموقع، الهاتف، الإيميل، العنوان...) */
    document.querySelectorAll("[data-settings]").forEach((el) => {
      const key = el.getAttribute("data-settings");
      if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
        el.textContent = data[key];
      }
    });

    /* الروابط اللي بتتغيّر (tel: / mailto: / السوشيال ميديا) */
    document.querySelectorAll("[data-settings-href]").forEach((el) => {
      const spec = el.getAttribute("data-settings-href"); // مثال: "tel:phoneIntl" أو "link:facebook"
      const [prefix, key] = spec.split(":");
      if (!data[key]) return;

      if (prefix === "tel") {
        el.setAttribute("href", "tel:" + data[key]);
      } else if (prefix === "mailto") {
        el.setAttribute("href", "mailto:" + data[key]);
      } else if (prefix === "link") {
        el.setAttribute("href", data[key]);
      }
    });

    /* بعد ما نخلص، بلّغ أي كود تاني محتاج نفس البيانات */
    document.dispatchEvent(new CustomEvent("rw:settings-loaded", { detail: data }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSettings);
  } else {
    loadSettings();
  }
})();