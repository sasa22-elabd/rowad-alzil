/* =========================================================
   رواد الظل | product-details.js
   صفحة تفاصيل المنتج — قراءة id من الرابط + عرض البيانات
   + كمية + إضافة للسلة + شراء مباشر (checkout) + واتساب
========================================================= */

(function () {
  "use strict";

  const API_BASE = "https://rowadalthil.com/";

  const page = document.getElementById("productDetailsPage");
  if (!page) return;

  let WHATSAPP_NUMBER = "201000000000";

  let categories = [];
  let product = null;
  let qty = 1;

  /* ---------------------------------------------------
     أدوات مساعدة
  --------------------------------------------------- */

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
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

  function getProductId(p) {
    const id = p.id ?? p._id ?? p.ID ?? p.productId ?? p.product_id;
    return id !== undefined && id !== null ? String(id) : null;
  }

  function getCategoryId(p) {
    if (p.Category && p.Category.id !== undefined) return p.Category.id;
    if (p.categoryId !== undefined && p.categoryId !== null) return p.categoryId;
    return p.category;
  }

  function categoryName(p) {
    if (p.Category && p.Category.name) return p.Category.name;
    const id = getCategoryId(p);
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : "منتجات";
  }

  function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  /* ---------------------------------------------------
     تحميل البيانات
  --------------------------------------------------- */

  async function loadCategories() {
    try {
      const res = await fetch(API_BASE + "/api/categories");
      const data = await res.json();
      categories = extractList(data, ["categories", "data", "rows"]);
    } catch (e) {
      console.error("تعذر تحميل التصنيفات:", e);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch(API_BASE + "/api/settings");
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.whatsapp) {
        WHATSAPP_NUMBER = String(data.whatsapp).replace(/[^0-9]/g, "");
      }
    } catch (e) {
      console.warn("تعذر تحميل إعدادات الموقع، هيتم استخدام الرقم الاحتياطي:", e);
    }
  }

  async function loadProduct(id) {
    try {
      const res = await fetch(API_BASE + "/api/products/" + encodeURIComponent(id));
      if (res.ok) {
        const data = await res.json();
        const single = data && typeof data === "object" && !Array.isArray(data)
          ? (data.product || data.data || data)
          : null;

        if (single && getProductId(single) === String(id)) {
          return single;
        }
      }
    } catch (e) {
      // تجاهل، هنستخدم fallback تحت
    }

    try {
      const res = await fetch(API_BASE + "/api/products?page=1&limit=1000");
      if (!res.ok) return null;
      const data = await res.json();
      const list = extractList(data, ["products", "data", "rows", "items"]);
      return list.find((p) => getProductId(p) === String(id)) || null;
    } catch (e) {
      console.error("تعذر تحميل المنتج:", e);
      return null;
    }
  }

  /* ---------------------------------------------------
     الرسم
  --------------------------------------------------- */

  function renderLoading() {
    page.innerHTML = `<div class="pd-loading">جاري تحميل بيانات المنتج...</div>`;
  }

  function renderNotFound() {
    page.innerHTML = `
      <div class="pd-not-found">
        لم يتم العثور على المنتج.<br><br>
        <a href="store.html" style="color:#b8860b;font-weight:700;text-decoration:none;">
          العودة إلى المتجر
        </a>
      </div>
    `;
  }

  function renderProduct(p) {
    document.title = (p.title || "المنتج") + " | رواد الظل";
    const titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = (p.title || "المنتج") + " | رواد الظل";

    const priceNow = Number(p.price) || 0;
    const priceOld = p.oldPrice ? Number(p.oldPrice) : null;

    page.innerHTML = `
      <div class="pd-breadcrumb">
        <a href="index.html">الرئيسية</a>
        <span>/</span>
        <a href="store.html">المتجر</a>
        <span>/</span>
        <span>${p.title || ""}</span>
      </div>

      <div class="pd-wrap">
        <div class="pd-media">
          <img src="${resolveImage(p.image)}" alt="${p.title || ""}">
        </div>

        <div class="pd-info">
          <span class="pd-category">${categoryName(p)}</span>
          <h1 class="pd-title">${p.title || ""}</h1>

          <div class="pd-price-row">
            <span class="pd-price-now">${priceNow} ج.م</span>
            ${priceOld ? `<span class="pd-price-old">${priceOld} ج.م</span>` : ""}
          </div>

          ${p.discount ? `<span class="pd-discount-badge">${p.discount}</span>` : ""}

          <p class="pd-description">${p.description || "لا يوجد وصف لهذا المنتج حالياً."}</p>

          <div class="pd-qty-row">
            <label>الكمية</label>
            <div class="pd-qty-control">
              <button type="button" id="pdQtyMinus">-</button>
              <input type="text" id="pdQtyInput" value="1" inputmode="numeric">
              <button type="button" id="pdQtyPlus">+</button>
            </div>
          </div>

          <div class="pd-actions">
            <button type="button" class="pd-btn pd-btn-buy-now" id="pdBuyNow">
              <i class="fa-solid fa-bolt"></i>
              اطلب الآن - الدفع عند الاستلام أو فودافون كاش/إنستاباي
            </button>

            <button type="button" class="pd-btn pd-btn-cart" id="pdAddCart">
              <i class="fa-solid fa-cart-shopping"></i>
              أضف إلى السلة
            </button>

            <div class="pd-added-msg" id="pdAddedMsg">تمت إضافة المنتج إلى السلة بنجاح</div>

            <a
              class="pd-btn pd-btn-whatsapp-contact"
              id="pdWhatsappContact"
              target="_blank"
              rel="noopener"
            >
              <i class="fa-brands fa-whatsapp"></i>
              استفسار عبر واتساب
            </a>

            <a
              class="pd-btn pd-btn-whatsapp-order"
              id="pdWhatsappOrder"
              target="_blank"
              rel="noopener"
            >
              <i class="fa-brands fa-whatsapp"></i>
              اطلب عبر واتساب مباشرة
            </a>
          </div>
        </div>
      </div>
    `;

    bindEvents(p);
  }

  function bindEvents(p) {
    const qtyInput = document.getElementById("pdQtyInput");
    const minusBtn = document.getElementById("pdQtyMinus");
    const plusBtn = document.getElementById("pdQtyPlus");
    const addBtn = document.getElementById("pdAddCart");
    const buyNowBtn = document.getElementById("pdBuyNow");
    const addedMsg = document.getElementById("pdAddedMsg");
    const waContact = document.getElementById("pdWhatsappContact");
    const waOrder = document.getElementById("pdWhatsappOrder");

    function syncQty() {
      qtyInput.value = String(qty);
      updateWhatsappLinks();
    }

    minusBtn.addEventListener("click", () => {
      if (qty > 1) qty -= 1;
      syncQty();
    });

    plusBtn.addEventListener("click", () => {
      qty += 1;
      syncQty();
    });

    qtyInput.addEventListener("change", () => {
      const val = parseInt(qtyInput.value, 10);
      qty = !val || val < 1 ? 1 : val;
      syncQty();
    });

    // أضف للسلة عادي
    addBtn.addEventListener("click", () => {
      if (!window.RowadCart) return;
      window.RowadCart.addItem(p, qty);

      addedMsg.style.display = "block";
      setTimeout(() => {
        addedMsg.style.display = "none";
      }, 2200);
    });

    // اطلب الآن: يضيف المنتج للسلة (لو مش موجود) وبعدين يوديك على صفحة إتمام الطلب على طول
    buyNowBtn.addEventListener("click", () => {
      if (!window.RowadCart) return;
      window.RowadCart.addItem(p, qty);
      window.location.href = "checkout.html";
    });

    function updateWhatsappLinks() {
      const contactMsg = `مرحباً، عندي استفسار عن منتج "${p.title || ""}"`;
      const orderMsg = `مرحباً، عايز أطلب "${p.title || ""}" — الكمية: ${qty}`;

      waContact.href =
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(contactMsg);
      waOrder.href =
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(orderMsg);
    }

    updateWhatsappLinks();
  }

  /* ---------------------------------------------------
     التشغيل
  --------------------------------------------------- */

  async function init() {
    const id = getIdFromUrl();

    if (!id) {
      renderNotFound();
      return;
    }

    renderLoading();

    await Promise.all([loadSettings(), loadCategories()]);
    product = await loadProduct(id);

    if (!product) {
      renderNotFound();
      return;
    }

    renderProduct(product);
  }

  init();
})();