/* =========================================================
   رواد الظل | projects.js
   ربط قسم "أحدث مشاريعنا" (Slider) بالـ API
   يعتمد على: GET /api/projects -> [{ id, title, tag, description, image, order }]
   ✅ تم التعديل: روابط نسبية بالكامل بدل الدومين المكتوب يدوي.
========================================================= */

(function () {
  "use strict";

  const track = document.getElementById("projectsTrack");
  if (!track) return; // القسم مش موجود في الصفحة دي، بلاش نكمل

  const wrapper = document.querySelector(".projects-slider-wrapper");
  const prevBtn = wrapper ? wrapper.querySelector(".slider-prev") : null;
  const nextBtn = wrapper ? wrapper.querySelector(".slider-next") : null;

  /* =========================================================
     HELPERS
  ========================================================= */

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
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

  /* =========================================================
     RENDER
  ========================================================= */

  function renderProjects(projects) {
    if (!projects.length) {
      track.innerHTML = `<div class="projects-empty">لا توجد مشاريع مضافة حالياً</div>`;
      return;
    }

    track.innerHTML = projects
      .map((project) => {
        const imageHtml = project.image
          ? `<img src="${resolveImage(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy">`
          : `<div class="project-card-noimg"><i class="fa-solid fa-image"></i></div>`;

        return `
          <article class="project-card">
            <div class="project-card-media">
              ${imageHtml}
              ${project.tag ? `<span class="project-card-tag">${escapeHtml(project.tag)}</span>` : ""}
            </div>
            <div class="project-card-body">
              <h3>${escapeHtml(project.title)}</h3>
              ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ""}
            </div>
          </article>
        `;
      })
      .join("");
  }

  /* =========================================================
     LOAD
  ========================================================= */

  async function loadProjects() {
    track.innerHTML = `<div class="projects-loading">جاري تحميل المشاريع...</div>`;

    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("فشل تحميل المشاريع");

      const data = await res.json();
      let projects = Array.isArray(data) ? data : data.projects || data.data || [];

      // ترتيب المشاريع حسب order (لو موجود)
      projects = projects.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

      renderProjects(projects);
    } catch (err) {
      console.error("Projects load error:", err);
      track.innerHTML = `<div class="projects-empty">تعذر تحميل المشاريع حالياً، حاول تاني لاحقاً</div>`;
    }
  }

  /* =========================================================
     SLIDER ARROWS
  ========================================================= */

  function scrollByCard(direction) {
    const card = track.querySelector(".project-card");
    if (!card) return;

    const gap = 20; // لازم يطابق الـ gap في الـ CSS بتاع .projects-track
    const cardWidth = card.getBoundingClientRect().width + gap;

    track.scrollBy({
      left: -direction * cardWidth,
      behavior: "smooth",
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => scrollByCard(1));
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => scrollByCard(-1));
  }

  /* =========================================================
     INIT
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProjects);
  } else {
    loadProjects();
  }
})();