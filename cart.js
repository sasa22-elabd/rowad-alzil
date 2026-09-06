/* =========================================================
   رواد الظل | cart.js
   المحرك الأساسي للسلة — يُستخدم في كل صفحات الموقع
   (الرئيسية، المتجر، تفاصيل المنتج، صفحة السلة)
========================================================= */

(function () {
  "use strict";
  const API_BASE = "https://rowadalthil.com/";

  const STORAGE_KEY = "rowad_cart_v1";

  /* ---------------------------------------------------
     قراءة / كتابة السلة في localStorage
  --------------------------------------------------- */

  function readCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("تعذر قراءة السلة:", e);
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("تعذر حفظ السلة:", e);
    }

    updateBadge();

    document.dispatchEvent(
      new CustomEvent("rowadcart:updated", { detail: cart })
    );
  }

  /* ---------------------------------------------------
     تحديث بادج عدد المنتجات في الهيدر (كل الصفحات)
  --------------------------------------------------- */

  function updateBadge() {
    const cart = readCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    document
      .querySelectorAll("#cartCountBadge, .cart-count")
      .forEach((el) => {
        el.textContent = count;
        el.style.display = count > 0 ? "inline-flex" : "none";
      });
  }

  /* ---------------------------------------------------
     استخراج id ثابت من أي شكل بيانات منتج قادم من الـ API
  --------------------------------------------------- */

  function normalizeId(product) {
    const id =
      product.id ??
      product._id ??
      product.ID ??
      product.productId ??
      product.product_id;

    return id !== undefined && id !== null ? String(id) : null;
  }

  /* ---------------------------------------------------
     إضافة منتج للسلة
  --------------------------------------------------- */

  function addItem(product, qty) {
    qty = Number(qty) || 1;

    const id = normalizeId(product);
    if (!id) {
      console.error("لا يمكن إضافة منتج بدون id:", product);
      return;
    }

    const cart = readCart();
    const existing = cart.find((i) => String(i.id) === id);

    if (existing) {
      existing.qty = Number(existing.qty || 0) + qty;
    } else {
      cart.push({
        id: id,
        title: product.title || product.name || "منتج",
        price: Number(product.price) || 0,
        image: product.image || "",
        qty: qty,
      });
    }

    writeCart(cart);
  }

  /* ---------------------------------------------------
     تعديل الكمية (لو الكمية صفر أو أقل بيتم الحذف)
  --------------------------------------------------- */

  function updateQty(id, qty) {
    qty = Number(qty);
    let cart = readCart();

    if (!qty || qty <= 0) {
      cart = cart.filter((i) => String(i.id) !== String(id));
    } else {
      const item = cart.find((i) => String(i.id) === String(id));
      if (item) item.qty = qty;
    }

    writeCart(cart);
  }

  /* ---------------------------------------------------
     حذف منتج من السلة
  --------------------------------------------------- */

  function removeItem(id) {
    const cart = readCart().filter((i) => String(i.id) !== String(id));
    writeCart(cart);
  }

  /* ---------------------------------------------------
     تفريغ السلة بالكامل
  --------------------------------------------------- */

  function clearCart() {
    writeCart([]);
  }

  /* ---------------------------------------------------
     قراءات
  --------------------------------------------------- */

  function getCart() {
    return readCart();
  }

  function getTotal() {
    return readCart().reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );
  }

  function getCount() {
    return readCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  /* ---------------------------------------------------
     تصدير الواجهة العامة
  --------------------------------------------------- */

  window.RowadCart = {
    addItem,
    updateQty,
    removeItem,
    clearCart,
    getCart,
    getTotal,
    getCount,
    normalizeId,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateBadge);
  } else {
    updateBadge();
  }
})();