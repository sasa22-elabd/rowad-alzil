/* =========================================================
   رواد الظل | store.js
   صفحة المتجر — عرض كل المنتجات + بحث + فلترة تصنيف
   (تصميم كارت جديد: زرار "عرض التفاصيل" وزرار "أضف للسلة"
   في نص الصورة + رسالة تأكيد لما تضيف منتج للسلة)
========================================================= */

(function () {
  "use strict";
  const API_BASE = "https://rowadalthil.com/";

  const PER_PAGE = 12;

  const grid = document.getElementById("storeGrid");
  const pagination = document.getElementById("storePagination");
  const searchInput = document.getElementById("storeSearch");
  const categorySelect = document.getElementById("storeCategoryFilter");

  if (!grid) return;

  let currentPage = 1;
  let searchTerm = "";
  let selectedCategory = "";
  let allProducts = [];
  let categories = [];

  /* ---------------------------------------------------
     أدوات مساعدة
  --------------------------------------------------- */

 function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
}

  // يقرأ أي شكل استجابة قادم من الـ API (array مباشر، أو متغلف بأي مفتاح شائع)
  function extractList(data, keys) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];

    for (const key of keys) {
      const val = data[key];
      if (Array.isArray(val)) return val;
    }

    // تغليف من مستويين، مثال: { data: { products: [...] } }
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
     Toast — رسالة "تمت الإضافة" (بتتعمل مرة واحدة وتتحدث)
  --------------------------------------------------- */

  let toastEl = null;
  let toastTimer = null;

  function ensureToast() {
    if (toastEl) return toastEl;

    toastEl = document.createElement("div");
    toastEl.id = "rwStoreToast";
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
      '<span id="rwStoreToastText">تمت الإضافة إلى السلة بنجاح</span>';

    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.querySelector("#rwStoreToastText").textContent = message || "تمت الإضافة إلى السلة بنجاح";

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

      if (categorySelect) {
        categories.forEach((cat) => {
          const opt = document.createElement("option");
          opt.value = cat.id;
          opt.textContent = cat.name;
          categorySelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("تعذر تحميل التصنيفات:", e);
    }
  }

  async function loadProducts() {
    grid.innerHTML = `<div class="rw-products-empty">جاري تحميل المنتجات...</div>`;

    try {
      const res = await fetch("/api/products?page=1&limit=1000");

      if (!res.ok) {
        // لو السيرفر رجّع 401/403 معناه إن الراوت محتاج توكن تسجيل دخول
        // وده مينفعش على صفحة عامة زي المتجر — لازم يبقى GET عام بدون auth
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

  /* ---------------------------------------------------
     فلترة + بحث
  --------------------------------------------------- */

  function getFilteredProducts() {
    let list = allProducts;

    if (selectedCategory) {
      list = list.filter((p) => String(getCategoryId(p)) === String(selectedCategory));
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) => (p.title || "").toLowerCase().includes(q));
    }

    return list;
  }

  function renderPage(page) {
    currentPage = page;

    const filtered = getFilteredProducts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const start = (page - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    renderGrid(pageItems);
    renderPagination(totalPages, page);
  }

  /* ---------------------------------------------------
     رسم الكروت — تصميم جديد بزرارين في نص الصورة
     (عين = تفاصيل المنتج | سلة = إضافة سريعة)
  --------------------------------------------------- */

  function renderGrid(products) {
    if (!products.length) {
      grid.innerHTML = `<div class="rw-products-empty">لا توجد منتجات مطابقة</div>`;
      return;
    }

    grid.innerHTML = products
      .map((p) => {
        const id = getProductId(p);

        return `
      <div class="rw-product-card" data-id="${id || ""}">
        <div class="rw-product-image">
          ${p.discount ? `<span class="rw-product-badge">${p.discount}</span>` : ""}
          <img src="${resolveImage(p.image)}" alt="${p.title || ""}" loading="lazy">

          <div class="rw-product-overlay">
            <button
              type="button"
              class="rw-overlay-btn rw-overlay-view"
              data-id="${id || ""}"
              title="عرض تفاصيل المنتج"
              aria-label="عرض تفاصيل المنتج"
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6"/>
                <circle cx="9" cy="20" r="1.4"/>
                <circle cx="17" cy="20" r="1.4"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="rw-product-content">
          <span class="rw-product-category">${categoryName(p)}</span>

          <h3 class="rw-product-title">${p.title || ""}</h3>

          <div class="rw-product-price">
            <span class="rw-sale-price">${p.price} ج.م</span>
            ${p.oldPrice ? `<span class="rw-old-price">${p.oldPrice} ج.م</span>` : ""}
          </div>

          <button type="button" class="rw-add-cart" data-id="${id || ""}">
            <span class="rw-cart-normal">
              <svg viewBox="0 0 24 24"><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>
              أضف إلى السلة
            </span>
            <span class="rw-cart-hover">
              <svg viewBox="0 0 24 24"><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>
            </span>
          </button>
        </div>
      </div>
    `;
      })
      .join("");

    // فتح صفحة تفاصيل المنتج عند الضغط على أي جزء من الكارت غير الأزرار
    grid.querySelectorAll(".rw-product-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".rw-add-cart, .rw-overlay-btn")) return;
        const id = card.getAttribute("data-id");
        if (!id) return;
        window.location.href = "product-details.html?id=" + encodeURIComponent(id);
      });
    });

    // زرار العين فوق الصورة -> نفس صفحة التفاصيل
    grid.querySelectorAll(".rw-overlay-view").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (!id) return;
        window.location.href = "product-details.html?id=" + encodeURIComponent(id);
      });
    });

    // زرار السلة فوق الصورة -> إضافة سريعة + رسالة تأكيد
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

    // زرار "أضف إلى السلة" الأساسي تحت السعر
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
    prev.className = "rw-page-btn rw-page-arrow";
    prev.innerHTML = "‹";
    prev.disabled = page === 1;
    prev.addEventListener("click", () => renderPage(page - 1));
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.className = "rw-page-btn" + (i === page ? " active" : "");
      btn.textContent = i;
      btn.addEventListener("click", () => renderPage(i));
      pagination.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "rw-page-btn rw-page-arrow";
    next.innerHTML = "›";
    next.disabled = page === totalPages;
    next.addEventListener("click", () => renderPage(page + 1));
    pagination.appendChild(next);
  }

  /* ---------------------------------------------------
     البحث والفلترة
  --------------------------------------------------- */

  let searchTimer;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTerm = searchInput.value.trim();
        renderPage(1);
      }, 300);
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", function () {
      selectedCategory = categorySelect.value;
      renderPage(1);
    });
  }

  loadCategories().then(loadProducts);
})();