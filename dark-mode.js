/* =====================================================================
   ROAD ALZILL — DARK MODE TOGGLE + STICKY / SCROLL-AWARE HEADER
   ملف مستقل — لا يلمس script.js أو أي ملف آخر
===================================================================== */

(function () {
    "use strict";
  const API_BASE = "https://rowadalthil.com/";

    var STORAGE_KEY = "rw-theme";
    var root = document.documentElement;

    /* -----------------------------------------------------------
       1) تحديد الوضع عند التحميل (محفوظ سابقاً أو حسب النظام)
    ----------------------------------------------------------- */
    function getPreferredTheme() {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "dark" || saved === "light") return saved;

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);

        document.querySelectorAll(".theme-toggle").forEach(function (btn) {
            btn.setAttribute(
                "aria-label",
                theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"
            );
        });
    }

    // نطبّق الثيم فوراً لتجنّب وميض الشاشة عند التحميل
    applyTheme(getPreferredTheme());

    /* -----------------------------------------------------------
       2) إنشاء زر التبديل وحقنه في الهيدر (ديسكتوب + موبايل)
    ----------------------------------------------------------- */
    function makeToggleButton() {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "theme-toggle";
        btn.setAttribute("aria-label", "تبديل الوضع الداكن");
        btn.innerHTML =
            '<i class="fa-solid fa-moon" aria-hidden="true"></i>' +
            '<i class="fa-solid fa-sun" aria-hidden="true"></i>';

        btn.addEventListener("click", function () {
            var current = root.getAttribute("data-theme");
            applyTheme(current === "dark" ? "light" : "dark");
        });

        return btn;
    }

function injectToggleButtons() {
    // لو فيه زرار موجود بالفعل في الصفحة (زي #themeToggle اليدوي)
    // بس اربط الحدث عليه، وماتعملش زرار جديد
    var existingButtons = document.querySelectorAll(".theme-toggle");

    if (existingButtons.length) {
        existingButtons.forEach(function (btn) {
            if (!btn.dataset.bound) {
                btn.dataset.bound = "true";

                btn.addEventListener("click", function () {
                    var current = root.getAttribute("data-theme");
                    applyTheme(current === "dark" ? "light" : "dark");
                });
            }
        });

        return; // ماتكملش لعمل زرار جديد
    }

    // الكود الأصلي بتاع إنشاء الزرار — يشتغل بس لو مفيش زرار يدوي في الصفحة
    var headerContainer = document.querySelector(".header-container");
    var headerContact = document.querySelector(".header-contact");

    if (headerContainer) {
        var desktopBtn = makeToggleButton();

        if (headerContact) {
            headerContainer.insertBefore(desktopBtn, headerContact);
        } else {
            headerContainer.appendChild(desktopBtn);
        }
    }

    var mobileHead = document.querySelector(".mobile-nav-head");
    var mobileClose = document.getElementById("mobileClose");

    if (mobileHead) {
        var mobileBtn = makeToggleButton();

        if (mobileClose) {
            mobileHead.insertBefore(mobileBtn, mobileClose);
        } else {
            mobileHead.appendChild(mobileBtn);
        }
    }
}

    /* -----------------------------------------------------------
       3) هيدر متحرك مع السكرول:
          - يختفي عند النزول لأسفل
          - يظهر فوراً عند الصعود لأعلى
          - يبقى ثابتاً وظاهراً أعلى الصفحة دائماً
    ----------------------------------------------------------- */
    function initStickyHeader() {
        var header = document.querySelector(".site-header");
        if (!header) return;

        var lastScrollY = window.scrollY;
        var ticking = false;
        var SHOW_AT_TOP = 80; // لا نخفي الهيدر قبل هذا الحد

        function onScroll() {
            var currentY = window.scrollY;

            // ظل وخلفية أوضح بعد بداية السكرول
            header.classList.toggle("rw-scrolled", currentY > 10);

            if (currentY <= SHOW_AT_TOP) {
                header.classList.remove("rw-hidden");
            } else if (currentY > lastScrollY) {
                // نازل لأسفل
                header.classList.add("rw-hidden");
            } else {
                // طالع لأعلى
                header.classList.remove("rw-hidden");
            }

            lastScrollY = currentY;
            ticking = false;
        }

        window.addEventListener(
            "scroll",
            function () {
                if (!ticking) {
                    window.requestAnimationFrame(onScroll);
                    ticking = true;
                }
            },
            { passive: true }
        );

        // ضبط الحالة الأولية عند التحميل
        onScroll();
    }

    /* -----------------------------------------------------------
       4) التشغيل بعد جاهزية الصفحة
    ----------------------------------------------------------- */
    document.addEventListener("DOMContentLoaded", function () {
        injectToggleButtons();
        initStickyHeader();

        // تفعيل الانتقال الناعم بعد أول رسم للصفحة لتفادي وميض عند التحميل
        requestAnimationFrame(function () {
            root.classList.add("theme-ready");
        });
    });

    // تحديث تلقائي إذا غيّر المستخدم وضع النظام (ولم يختر يدوياً من قبل)
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", function (e) {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? "dark" : "light");
            }
        });
})();