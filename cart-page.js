/* =========================================================
   رواد الظل | cart-page.js
   عرض محتويات السلة + التحكم بالكمية + الانتقال لإتمام الطلب
========================================================= */

(function () {
  "use strict";

  const API_BASE = "https://rowadalthil.com/";

  const itemsContainer = document.getElementById("cartItemsContainer");
  const summaryContainer = document.getElementById("cartSummaryContainer");
  if (!itemsContainer || !summaryContainer) return;

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  function render() {
    const cart = window.RowadCart.getCart();

    if (!cart || cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty">
          سلة المشتريات فارغة حاليًا.
          <br>
          <a href="store.html">تصفّح المتجر</a>
        </div>
      `;
      summaryContainer.innerHTML = "";
      return;
    }

    itemsContainer.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${resolveImage(item.image)}" alt="${item.title}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">${item.price} ج.م</div>
        </div>
        <div class="cart-item-qty">
          <button type="button" class="cart-qty-minus" data-id="${item.id}">-</button>
          <input type="text" class="cart-qty-input" data-id="${item.id}" value="${item.qty}" inputmode="numeric">
          <button type="button" class="cart-qty-plus" data-id="${item.id}">+</button>
        </div>
        <button type="button" class="cart-item-remove" data-id="${item.id}" title="حذف المنتج">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `
      )
      .join("");

    const total = window.RowadCart.getTotal();

    summaryContainer.innerHTML = `
      <div class="cart-summary">
        <div class="cart-summary-row">
          <span>الإجمالي</span>
          <span>${total.toFixed(0)} ج.م</span>
        </div>
        <button type="button" class="cart-checkout-btn" id="goToCheckoutBtn">
          <i class="fa-solid fa-lock"></i>
          إتمام الطلب
        </button>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    itemsContainer.querySelectorAll(".cart-qty-minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const cart = window.RowadCart.getCart();
        const item = cart.find((i) => String(i.id) === String(id));
        if (!item) return;
        window.RowadCart.updateQty(id, Number(item.qty) - 1);
        render();
      });
    });

    itemsContainer.querySelectorAll(".cart-qty-plus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const cart = window.RowadCart.getCart();
        const item = cart.find((i) => String(i.id) === String(id));
        if (!item) return;
        window.RowadCart.updateQty(id, Number(item.qty) + 1);
        render();
      });
    });

    itemsContainer.querySelectorAll(".cart-qty-input").forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.dataset.id;
        const val = parseInt(input.value, 10);
        window.RowadCart.updateQty(id, !val || val < 1 ? 1 : val);
        render();
      });
    });

    itemsContainer.querySelectorAll(".cart-item-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.RowadCart.removeItem(btn.dataset.id);
        render();
      });
    });

    const checkoutBtn = document.getElementById("goToCheckoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        window.location.href = "checkout.html";
      });
    }
  }

  render();

  // لو السلة اتحدثت من صفحة تانية (نادرًا هنا، بس للأمان)
  document.addEventListener("rowadcart:updated", render);
})();