/* =========================================================
   رواد الظل | products.js
   منتجات الصفحة الرئيسية — عرض + تنقل لصفحة تفاصيل المنتج
   ✅ تم التعديل: روابط نسبية بالكامل (بدون دومين مكتوب يدوي)
   عشان تشتغل صح مهما كان الدومين اللي الموقع شغال عليه.
========================================================= */

(function () {
  "use strict";

  const PER_PAGE = 8;

  const grid = document.getElementById("rwProductsGrid");
  const pagination = document.getElementById("rwPagination");

  if (!grid) return;

  injectStyles();

  let allProducts = [];
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

  function getProductId(product) {
    const id =
      product.id ??
      product._id ??
      product.ID ??
      product.productId ??
      product.product_id;

    return id !== undefined && id !== null ? String(id) : null;
  }

  function getCategoryId(product) {
    if (product.Category && product.Category.id !== undefined) return product.Category.id;
    if (product.categoryId !== undefined && product.categoryId !== null) return product.categoryId;
    return product.category;
  }

  function categoryName(product) {
    if (product.Category && product.Category.name) return product.Category.name;
    const id = getCategoryId(product);
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : "منتجات";
  }

  /* ---------------------------------------------------
     Toast — رسالة "تمت الإضافة"
  --------------------------------------------------- */

  let toastEl = null;
  let toastTimer = null;

  function ensureToast() {
    if (toastEl) return toastEl;

    toastEl = document.createElement("div");
    toastEl.id = "rwHomeToast";
    toastEl.setAttribute("role", "status");
    toastEl.style.cssText = [
      "position:fixed",
      "bottom:28px",
      "left:50%",
      "transform:translateX(-50%) translateY(20px)",
      "background:#1a1a1a",
      "color:#fff",
      "padding:14px 26px",
      "border-radius:50px",
      "font-family:'Cairo',sans-serif",
      "font-weight:700",
      "font-size:14px",
      "display:flex",
      "align-items:center",
      "gap:10px",
      "box-shadow:0 12px 30px rgba(0,0,0,.25)",
      "z-index:9999",
      "opacity:0",
      "pointer-events:none",
      "transition:opacity .25s ease, transform .25s ease",
    ].join(";");

    toastEl.innerHTML =
      '<span style="width:20px;height:20px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>' +
      "</span>" +
      '<span id="rwHomeToastText">تمت الإضافة إلى السلة بنجاح</span>';

    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.querySelector("#rwHomeToastText").textContent = message || "تمت الإضافة إلى السلة بنجاح";

    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2200);
  }

  /* ---------------------------------------------------
     تحميل البيانات
  --------------------------------------------------- */

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      categories = extractList(data, ["categories", "data", "rows"]);
    } catch (e) {
      console.error("تعذر تحميل التصنيفات:", e);
    }
  }

  async function loadProducts() {
    grid.innerHTML = `<div class="rw-products-loading">جاري تحميل المنتجات...</div>`;

    try {
      const res = await fetch("/api/products?page=1&limit=1000");

      if (!res.ok) {
        console.error("فشل تحميل المنتجات، حالة الاستجابة:", res.status);
        grid.innerHTML = `<div class="rw-products-empty">تعذر تحميل المنتجات (كود ${res.status})، حاول تاني لاحقاً</div>`;
        return;
      }

      const data = await res.json();
      allProducts = extractList(data, ["products", "data", "rows", "items"]);
      renderPage(1);
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="rw-products-empty">تعذر تحميل المنتجات، حاول تاني لاحقاً</div>`;
    }
  }

  function renderPage(page) {
    const totalPages = Math.max(1, Math.ceil(allProducts.length / PER_PAGE));
    const start = (page - 1) * PER_PAGE;
    const pageItems = allProducts.slice(start, start + PER_PAGE);

    renderGrid(pageItems);
    renderPagination(totalPages, page);
  }

  /* ---------------------------------------------------
     رسم الكروت
  --------------------------------------------------- */

  function renderGrid(products) {
    if (!products.length) {
      grid.innerHTML = `<div class="rw-products-empty">لا توجد منتجات حالياً</div>`;
      return;
    }

    grid.innerHTML = products
      .map((p) => {
        const id = getProductId(p);

        return `
      <div class="rw-product-card" data-id="${id || ""}">
        <div class="rw-product-media">
          ${p.discount ? `<span class="rw-product-discount">${p.discount}</span>` : ""}
          <img src="${resolveImage(p.image)}" alt="${p.title || ""}" loading="lazy">

          <div class="rw-product-overlay">
            <button
              type="button"
              class="rw-overlay-btn rw-overlay-view"
              data-id="${id || ""}"
              title="عرض تفاصيل المنتج"
              aria-label="عرض تفاصيل المنتج"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z"/>
                <circle cx="12" cy="12" r="3.2"/>
              </svg>
            </button>

            <button
              type="button"
              class="rw-overlay-btn rw-overlay-cart"
              data-id="${id || ""}"
              title="أضف إلى السلة"
              aria-label="أضف إلى السلة"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6"/>
                <circle cx="9" cy="20" r="1.4"/>
                <circle cx="17" cy="20" r="1.4"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="rw-product-body">
          <span class="rw-product-cat">${categoryName(p)}</span>
          <h3 class="rw-product-title">${p.title || ""}</h3>

          <div class="rw-product-price">
            <span class="rw-price-now">${p.price} ج.م</span>
            ${p.oldPrice ? `<span class="rw-price-old">${p.oldPrice} ج.م</span>` : ""}
          </div>

          <button type="button" class="rw-add-cart" data-id="${id || ""}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6"/>
              <circle cx="9" cy="20" r="1.4"/>
              <circle cx="17" cy="20" r="1.4"/>
            </svg>
            أضف إلى السلة
          </button>
        </div>
      </div>
    `;
      })
      .join("");

    // فتح صفحة التفاصيل عند الضغط على أي مكان في الكارت غير الأزرار
    grid.querySelectorAll(".rw-product-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".rw-add-cart, .rw-overlay-btn")) return;
        const id = card.getAttribute("data-id");
        if (!id) return;
        window.location.href = "product-details.html?id=" + encodeURIComponent(id);
      });
    });

    grid.querySelectorAll(".rw-overlay-view").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (!id) return;
        window.location.href = "product-details.html?id=" + encodeURIComponent(id);
      });
    });

    grid.querySelectorAll(".rw-overlay-cart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const product = allProducts.find((p) => getProductId(p) === id);
        if (!product || !window.RowadCart) return;

        window.RowadCart.addItem(product, 1);
        showToast(`تمت إضافة "${product.title || "المنتج"}" إلى السلة`);
      });
    });

    grid.querySelectorAll(".rw-add-cart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const product = allProducts.find((p) => getProductId(p) === id);
        if (!product || !window.RowadCart) return;

        window.RowadCart.addItem(product, 1);

        btn.classList.add("added");
        setTimeout(() => btn.classList.remove("added"), 1500);

        showToast(`تمت إضافة "${product.title || "المنتج"}" إلى السلة`);
      });
    });
  }

  function renderPagination(totalPages, page) {
    if (!pagination) return;
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const prev = document.createElement("button");
    prev.innerHTML = "‹";
    prev.disabled = page === 1;
    prev.addEventListener("click", () => renderPage(page - 1));
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === page ? "active" : "";
      btn.addEventListener("click", () => renderPage(i));
      pagination.appendChild(btn);
    }

    const next = document.createElement("button");
    next.innerHTML = "›";
    next.disabled = page === totalPages;
    next.addEventListener("click", () => renderPage(page + 1));
    pagination.appendChild(next);
  }

  /* ---------------------------------------------------
     الستايل
  --------------------------------------------------- */

  function injectStyles() {
    if (document.getElementById("rwProductsInlineStyles")) return;

    const style = document.createElement("style");
    style.id = "rwProductsInlineStyles";
    style.textContent = `
      .rw-products-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        margin-top: 40px;
      }
      @media (max-width: 1024px) {
        .rw-products-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 560px) {
        .rw-products-grid { grid-template-columns: 1fr; }
      }

      .rw-product-card {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 3px 16px rgba(0,0,0,0.06);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .rw-product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      }

      .rw-product-media {
        position: relative;
        height: 200px;
        background: #f4f4f4;
        overflow: hidden;
      }
      .rw-product-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform .35s ease;
      }
      .rw-product-card:hover .rw-product-media img {
        transform: scale(1.06);
      }

      .rw-product-discount {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #d64545;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 50px;
        z-index: 3;
      }

      .rw-product-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: rgba(0,0,0,0.28);
        opacity: 0;
        transition: opacity .25s ease;
        z-index: 2;
      }
      .rw-product-card:hover .rw-product-overlay {
        opacity: 1;
      }
      .rw-overlay-btn {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: none;
        background: #fff;
        color: #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transform: translateY(10px);
        opacity: 0;
        transition: transform .25s ease, opacity .25s ease, background .2s ease, color .2s ease;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      .rw-product-card:hover .rw-overlay-btn {
        transform: translateY(0);
        opacity: 1;
      }
      .rw-overlay-btn:hover {
        background: #b8860b;
        color: #fff;
      }
      .rw-overlay-cart {
        transition-delay: .04s;
      }

      .rw-product-body { padding: 16px; }
      .rw-product-cat {
        display: inline-block;
        background: #fff6e6;
        color: #b8860b;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 50px;
        margin-bottom: 10px;
      }
      .rw-product-title {
        font-size: 15px;
        font-weight: 800;
        margin: 0 0 10px;
        color: #1a1a1a;
        line-height: 1.5;
      }
      .rw-product-price {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 14px;
      }
      .rw-price-now {
        font-weight: 800;
        color: #1a1a1a;
        font-size: 15px;
      }
      .rw-price-old {
        font-size: 13px;
        color: #aaa;
        text-decoration: line-through;
      }

      .rw-add-cart {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 11px 10px;
        border: none;
        border-radius: 10px;
        background: #1a1a1a;
        color: #fff;
        font-family: 'Cairo', sans-serif;
        font-weight: 700;
        font-size: 13.5px;
        cursor: pointer;
        transition: background .2s ease, transform .15s ease;
      }
      .rw-add-cart:hover {
        background: #b8860b;
      }
      .rw-add-cart.added {
        background: #25D366;
      }
      .rw-add-cart:active {
        transform: scale(0.97);
      }

      .rw-products-loading, .rw-products-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #9aa1a8;
      }

      #rwPagination {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 30px;
      }
      #rwPagination button {
        min-width: 38px;
        height: 38px;
        border: 1px solid #e2e2e2;
        background: #fff;
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Cairo', sans-serif;
        font-weight: 700;
      }
      #rwPagination button.active {
        background: #1a1a1a;
        color: #fff;
        border-color: #1a1a1a;
      }
      #rwPagination button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  loadCategories().then(loadProducts);
})();