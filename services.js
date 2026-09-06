/* =========================================================
   رواد الظل | services.js (نسخة مُصححة)
   تحميل الخدمات من GET /api/services وعرضها بنفس تصميم
   الكروت الأصلي الموجود في style.css (.rw-service-card
   بتاع .rw-special-services) بدل ما نبني تصميم تاني بيتعارض
   معاه.
========================================================= */

(function () {
  "use strict";

  // نفس الكونتينر اللي فيه الكروت الثابتة أصلاً في index.html
  const container = document.getElementById("rwServicesSlider");
  if (!container) return; // القسم مش موجود في الصفحة دي

  let services = [];
  let categories = [];

  /* ---------------------------------------------------
     أدوات مساعدة
  --------------------------------------------------- */

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  function extractList(data, keys) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];

    for (const key of keys) {
      const val = data[key];
      if (Array.isArray(val)) return val;
    }
    for (const key of keys) {
      const val = data[key];
      if (val && typeof val === "object") {
        for (const innerKey of keys) {
          if (Array.isArray(val[innerKey])) return val[innerKey];
        }
      }
    }
    return [];
  }

  function getServiceId(service) {
    const id =
      service.id ?? service._id ?? service.ID ?? service.serviceId ?? service.service_id;
    return id !== undefined && id !== null ? String(id) : null;
  }

  function categoryName(service) {
    if (service.Category && service.Category.name) return service.Category.name;
    if (service.ServiceCategory && service.ServiceCategory.name) return service.ServiceCategory.name;

    const id =
      (service.Category && service.Category.id) ??
      service.categoryId ??
      service.serviceCategoryId ??
      service.category;

    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : (typeof service.category === "string" ? service.category : "");
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ---------------------------------------------------
     تحميل البيانات
  --------------------------------------------------- */

  async function loadServiceCategories() {
    try {
      const res = await fetch("/api/service-categories");
      if (!res.ok) return;
      const data = await res.json();
      categories = extractList(data, ["categories", "data", "rows"]);
    } catch (e) {
      console.error("تعذر تحميل تصنيفات الخدمات:", e);
    }
  }

  async function loadServices() {
    try {
      const res = await fetch("/api/services");

      if (!res.ok) {
        console.error("فشل تحميل الخدمات، حالة الاستجابة:", res.status);
        return; // سيب الكروت الثابتة في الـ HTML زي ما هي بدل ما تمسحها
      }

      const data = await res.json();
      services = extractList(data, ["services", "data", "rows", "items"]);

      if (services.length) {
        renderServices();
      }
      // لو الـ API رجّع array فاضي، سيب الكروت الثابتة الموجودة أصلاً في الصفحة
    } catch (err) {
      console.error("تعذر تحميل الخدمات:", err);
      // برضه سيب الكروت الثابتة الموجودة، ماتمسحش الكونتينر
    }
  }

  /* ---------------------------------------------------
     الرسم — بنفس بنية وكلاسات الكروت الأصلية في style.css
  --------------------------------------------------- */

  function renderServices() {
    container.innerHTML = services
      .map((service) => {
        const image = service.image ? resolveImage(service.image) : "";
        const title = escapeHtml(service.title || service.name || "");
        const description = escapeHtml(service.description || service.desc || "");
        const tag = escapeHtml(service.tag || categoryName(service) || "");
        const link = service.slug ? escapeHtml(service.slug) + ".html" : "#";

        return `
          <a href="${link}" class="rw-service-link">
            <article class="rw-service-card">
              <div class="rw-service-image">
                ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : ""}
              </div>
              <div class="rw-service-info">
                <h3>${title}</h3>
                ${description ? `<p>${description}</p>` : ""}
                ${tag ? `<span class="rw-service-tag">${tag}</span>` : ""}
              </div>
            </article>
          </a>
        `;
      })
      .join("");

    // بعد ما نغيّر الكروت، السلايدر (services-slider.js) لازم يتحدّث
    // لأنه بيبني الـ dots من عدد الكروت وقت DOMContentLoaded بس.
    // لو services.js بيتنفذ بعد كده، شغّل تحديث الـ dots يدويًا:
    if (typeof window.rwRebuildServicesDots === "function") {
      window.rwRebuildServicesDots();
    }
  }

  /* ---------------------------------------------------
     تشغيل
  --------------------------------------------------- */

  function init() {
    loadServiceCategories().finally(loadServices);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();