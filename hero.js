/* =========================================================
   رواد الظل | hero.js
   بيجيب سلايدات الصفحة الرئيسية من /api/hero-slides
   ويشغّل: السلايدر + الدوتس + العدّاد + الفيديو مود
========================================================= */

(function () {
  "use strict";

  const API_BASE = "https://rowadalthil.com/";

  const heroSlidesEl = document.getElementById("heroSlides");
  if (!heroSlidesEl) return; // مش موجودين في صفحة السلايدر أصلاً

  const heroDotsEl = document.getElementById("heroDots");
  const heroLabelEl = document.getElementById("heroLabel");
  const heroTitleEl = document.getElementById("heroTitle");
  const heroDescriptionEl = document.getElementById("heroDescription");
  const heroButtonEl = document.querySelector(".hero-button");
  const heroButtonTextEl = heroButtonEl ? heroButtonEl.querySelector("span:last-child") : null;

  const videoThumbnailEl = document.getElementById("videoThumbnail");
  const videoTextEl = document.getElementById("videoText");
  const currentSlideEl = document.getElementById("currentSlide");
  const totalSlidesEl = document.getElementById("totalSlides");

  const videoOpenBtn = document.getElementById("videoOpen");
  const videoModal = document.getElementById("videoModal");
  const videoCloseBtn = document.getElementById("videoClose");
  const heroVideoEl = document.getElementById("heroVideo");
  const videoSourceEl = document.getElementById("videoSource");

  const prevBtn = document.getElementById("prevSlide");
  const nextBtn = document.getElementById("nextSlide");

  let slides = [];
  let currentIndex = 0;
  let autoplayTimer = null;

  const AUTOPLAY_MS = 6000;

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  /* ---------------------------------------------------
     تحميل السلايدات
  --------------------------------------------------- */

  async function loadSlides() {
    try {
      const res = await fetch(API_BASE + "/api/hero-slides");
      const data = await res.json();
      slides = Array.isArray(data) ? data : data.slides || data.data || [];
    } catch (err) {
      console.error("تعذر تحميل سلايدات الصفحة الرئيسية:", err);
      slides = [];
    }
  }

  /* ---------------------------------------------------
     بناء خلفيات السلايدات + الدوتس
  --------------------------------------------------- */

  function buildSlidesDOM() {
    heroSlidesEl.innerHTML = "";
    if (heroDotsEl) heroDotsEl.innerHTML = "";

    slides.forEach((slide, index) => {
      const bg = document.createElement("div");
      bg.className = "hero-slide" + (index === 0 ? " active" : "");
      bg.style.backgroundImage = `url("${resolveImage(slide.image)}")`;
      heroSlidesEl.appendChild(bg);

      if (heroDotsEl) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-dot" + (index === 0 ? " active" : "");
        dot.setAttribute("aria-label", "سلايد " + (index + 1));
        dot.addEventListener("click", () => goToSlide(index));
        heroDotsEl.appendChild(dot);
      }
    });

    if (totalSlidesEl) totalSlidesEl.textContent = pad(slides.length);
  }

  /* ---------------------------------------------------
     عرض سلايد معيّن
  --------------------------------------------------- */

  function renderSlide(index) {
    const slide = slides[index];
    if (!slide) return;

    // النصوص
    if (heroLabelEl) heroLabelEl.textContent = slide.label || "";
    if (heroTitleEl) {
      heroTitleEl.innerHTML = (slide.title || "").replace(/\n/g, "<br>");
    }
    if (heroDescriptionEl) heroDescriptionEl.textContent = slide.description || "";

    if (heroButtonEl) {
      heroButtonEl.href = slide.buttonLink || "#";
    }
    if (heroButtonTextEl) {
      heroButtonTextEl.textContent = slide.buttonText || "";
    }

    // كارت الفيديو
    if (videoThumbnailEl && slide.videoThumbnail) {
      videoThumbnailEl.src = resolveImage(slide.videoThumbnail);
    }
    if (videoTextEl) {
      videoTextEl.textContent = slide.videoText || "";
    }

    if (currentSlideEl) currentSlideEl.textContent = pad(index + 1);

    // الخلفيات والدوتس
    heroSlidesEl.querySelectorAll(".hero-slide").forEach((el, i) => {
      el.classList.toggle("active", i === index);
    });

    if (heroDotsEl) {
      heroDotsEl.querySelectorAll(".hero-dot").forEach((el, i) => {
        el.classList.toggle("active", i === index);
      });
    }

    currentIndex = index;
  }

  function goToSlide(index) {
    if (!slides.length) return;
    const safeIndex = (index + slides.length) % slides.length;
    renderSlide(safeIndex);
    restartAutoplay();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function restartAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    if (slides.length > 1) {
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS);
    }
  }

  /* ---------------------------------------------------
     الأسهم
  --------------------------------------------------- */

  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  /* ---------------------------------------------------
     الفيديو مود
  --------------------------------------------------- */

  function openVideoModal() {
    const slide = slides[currentIndex];
    if (!slide || !slide.videoUrl || !videoModal) return;

    if (videoSourceEl) videoSourceEl.src = slide.videoUrl;
    if (heroVideoEl) {
      heroVideoEl.load();
      heroVideoEl.play().catch(() => {});
    }

    videoModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    if (!videoModal) return;

    videoModal.classList.remove("active");
    document.body.style.overflow = "";

    if (heroVideoEl) heroVideoEl.pause();
  }

  if (videoOpenBtn) videoOpenBtn.addEventListener("click", openVideoModal);
  if (videoCloseBtn) videoCloseBtn.addEventListener("click", closeVideoModal);

  if (videoModal) {
    videoModal.addEventListener("click", (e) => {
      if (e.target === videoModal || e.target.classList.contains("video-modal-overlay")) {
        closeVideoModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && videoModal && videoModal.classList.contains("active")) {
      closeVideoModal();
    }
  });

  /* ---------------------------------------------------
     التشغيل
  --------------------------------------------------- */

  async function init() {
    await loadSlides();

    if (!slides.length) {
      // مفيش سلايدات مضافة لسه من لوحة التحكم — سيب المحتوى الثابت الموجود في HTML زي ما هو
      return;
    }

    buildSlidesDOM();
    renderSlide(0);
    restartAutoplay();
  }

  init();
})();