/* =========================================================
   رواد الظل | settings-loader.js
   تحميل إعدادات الموقع العامة من GET /api/settings وتطبيقها

     - نص عادي:      <span data-settings="phone"></span>
     - رابط بادئة:   <a data-settings-href="tel:phoneIntl"></a>
     - رابط مباشر:   <a data-settings-href="link:instagram"></a>
     - لوجو داخلي:   <img data-settings-logo src="images/logo.png">
     - Favicon:      <link data-settings-favicon href="images/favicon.png">
     - صورة مشاركة:  <meta data-settings-og-image content="...">
========================================================= */

(function () {
  "use strict";

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  function normalizeSettings(data) {
    if (Array.isArray(data)) {
      return data.reduce((acc, item) => {
        if (item && item.key !== undefined) acc[item.key] = item.value;
        return acc;
      }, {});
    }
    return data.settings || data.data || data || {};
  }

  function applySettings(settings) {

    // 1) نص عادي
    document.querySelectorAll("[data-settings]").forEach((el) => {
      const key = el.getAttribute("data-settings");
      const value = settings[key];
      if (value !== undefined && value !== null && value !== "") {
        el.textContent = value;
      }
    });

    // 2) روابط
    document.querySelectorAll("[data-settings-href]").forEach((el) => {
      const spec = el.getAttribute("data-settings-href");
      const [type, key] = spec.split(":");
      const value = settings[key];

      if (value === undefined || value === null || value === "") return;

      if (type === "link") {
        el.setAttribute("href", value);
      } else {
        el.setAttribute("href", type + ":" + value);
      }
    });

    // 3) اللوجو الداخلي
    document.querySelectorAll("[data-settings-logo]").forEach((el) => {
      if (settings.logo) {
        el.setAttribute("src", resolveImage(settings.logo));
      }
    });

    // 4) اللوجو الخارجي: Favicon + صورة المشاركة (og:image / twitter:image)
    if (settings.logoExternal) {
      const externalLogoUrl = resolveImage(settings.logoExternal);

      document.querySelectorAll("[data-settings-favicon]").forEach((el) => {
        el.setAttribute("href", externalLogoUrl);
      });

      document.querySelectorAll("[data-settings-og-image]").forEach((el) => {
        el.setAttribute("content", externalLogoUrl);
      });
    }
  }

  async function loadSiteSettings() {
    try {
      const res = await fetch("/api/settings");

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const data = await res.json();
      const settings = normalizeSettings(data);

      window.RW_SETTINGS = settings;
      applySettings(settings);

      document.dispatchEvent(
        new CustomEvent("rw:settings-loaded", { detail: settings })
      );
    } catch (err) {
      console.error("تعذر تحميل الإعدادات:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSiteSettings);
  } else {
    loadSiteSettings();
  }
})();