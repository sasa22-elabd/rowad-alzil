/* =========================================================
   رواد الظل | checkout.js
   صفحة إتمام الطلب: فورم بيانات + طريقة دفع + إرسال للباك اند
   + تأكيد إضافي عبر واتساب
========================================================= */

(function () {
  "use strict";

  const API_BASE = "https://rowadalthil.com/";
  const SHIPPING_FEE = 0; // غيّرها لو عندك رسوم شحن ثابتة، أو خليها منطق حسب المدينة

  const container = document.getElementById("checkoutContainer");
  if (!container) return;

  let WHATSAPP_NUMBER = "201000000000";

  // أرقام الدفع - غيّرها بأرقامك الحقيقية
  const VODAFONE_CASH_NUMBER = "010XXXXXXXX";
  const INSTAPAY_HANDLE = "rowadalzill@instapay"; // أو الرابط بتاعك

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
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
      console.warn("تعذر تحميل إعدادات الموقع:", e);
    }
  }

  function renderEmpty() {
    container.innerHTML = `
      <div class="checkout-empty">
        السلة فارغة، مفيش حاجة لإتمام طلبها.<br><br>
        <a href="store.html">تصفّح المتجر</a>
      </div>
    `;
  }

  function renderForm(cart) {
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );
    const total = subtotal + SHIPPING_FEE;

    container.innerHTML = `
      <div class="checkout-wrap">

        <div class="checkout-card">
          <h2>بيانات الاستلام</h2>
          <div class="form-error-banner" id="formErrorBanner"></div>

          <form id="checkoutForm" novalidate>
            <div class="form-row" data-field="customerName">
              <label>الاسم بالكامل</label>
              <input type="text" name="customerName" placeholder="اكتب اسمك بالكامل">
              <div class="field-error">من فضلك أدخل الاسم</div>
            </div>

            <div class="form-row-2">
              <div class="form-row" data-field="phone">
                <label>رقم التليفون</label>
                <input type="tel" name="phone" placeholder="01xxxxxxxxx">
                <div class="field-error">من فضلك أدخل رقم تليفون صحيح</div>
              </div>
              <div class="form-row" data-field="secondaryPhone">
                <label>رقم بديل (اختياري)</label>
                <input type="tel" name="secondaryPhone" placeholder="01xxxxxxxxx">
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-row" data-field="city">
                <label>المحافظة / المدينة</label>
                <input type="text" name="city" placeholder="مثال: القاهرة">
                <div class="field-error">من فضلك أدخل المدينة</div>
              </div>
              <div class="form-row" data-field="address">
                <label>العنوان بالتفصيل</label>
                <input type="text" name="address" placeholder="الحي، الشارع، رقم العقار">
                <div class="field-error">من فضلك أدخل العنوان</div>
              </div>
            </div>

            <div class="form-row">
              <label>ملاحظات (اختياري)</label>
              <textarea name="notes" rows="2" placeholder="أي تفاصيل إضافية عن الطلب أو التوصيل"></textarea>
            </div>

            <h2 style="margin-top:26px;">طريقة الدفع</h2>
            <div class="payment-options">

              <label class="payment-option selected" data-method="cod">
                <input type="radio" name="paymentMethod" value="cod" checked>
                <div class="payment-option-info">
                  <strong><i class="fa-solid fa-truck"></i> الدفع عند الاستلام</strong>
                  <span>ادفع نقدًا لمندوب التوصيل عند وصول الطلب</span>
                </div>
              </label>

              <label class="payment-option" data-method="vodafone_cash">
                <input type="radio" name="paymentMethod" value="vodafone_cash">
                <div class="payment-option-info">
                  <strong><i class="fa-solid fa-mobile-screen"></i> فودافون كاش</strong>
                  <span>حوّل المبلغ وابعت رقم العملية</span>
                </div>
              </label>

              <label class="payment-option" data-method="instapay">
                <input type="radio" name="paymentMethod" value="instapay">
                <div class="payment-option-info">
                  <strong><i class="fa-solid fa-money-bill-transfer"></i> إنستاباي</strong>
                  <span>حوّل المبلغ وابعت رقم العملية أو صورة التحويل</span>
                </div>
              </label>

            </div>

            <div class="payment-details-box" id="vodafoneCashBox">
              حوّل مبلغ <strong>${total} ج.م</strong> على رقم فودافون كاش:
              <strong>${VODAFONE_CASH_NUMBER}</strong><br>
              وبعدين اكتب رقم عملية التحويل تحت.
            </div>

            <div class="payment-details-box" id="instapayBox">
              حوّل مبلغ <strong>${total} ج.م</strong> عبر إنستاباي على:
              <strong>${INSTAPAY_HANDLE}</strong><br>
              وبعدين اكتب رقم العملية أو آخر أرقام التحويل تحت.
            </div>

            <div class="form-row" id="paymentReferenceRow" style="display:none;">
              <label>رقم العملية / إثبات التحويل</label>
              <input type="text" name="paymentReference" placeholder="مثال: 123456789">
              <div class="field-error">من فضلك أدخل رقم العملية</div>
            </div>

            <button type="submit" class="checkout-submit-btn" id="submitBtn">
              <i class="fa-solid fa-lock"></i>
              تأكيد الطلب
            </button>

            <div class="checkout-whatsapp-note">
              <i class="fa-brands fa-whatsapp"></i>
              هيتبعت لك تأكيد فوري على واتساب بعد الطلب
            </div>
          </form>
        </div>

        <div class="checkout-card">
          <h2>ملخص الطلب</h2>
          <div id="summaryItems">
            ${cart
              .map(
                (item) => `
              <div class="summary-item">
                <img src="${resolveImage(item.image)}" alt="${item.title}">
                <div class="summary-item-name">
                  <strong>${item.title}</strong>
                  <small>${item.qty} × ${item.price} ج.م</small>
                </div>
                <div>${(Number(item.price) * Number(item.qty)).toFixed(0)} ج.م</div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="summary-row">
            <span>المجموع الفرعي</span>
            <span>${subtotal.toFixed(0)} ج.م</span>
          </div>
          <div class="summary-row">
            <span>الشحن</span>
            <span>${SHIPPING_FEE > 0 ? SHIPPING_FEE.toFixed(0) + " ج.م" : "مجاني"}</span>
          </div>
          <div class="summary-total-row">
            <span>الإجمالي</span>
            <span>${total.toFixed(0)} ج.م</span>
          </div>
        </div>

      </div>
    `;

    bindForm(cart, subtotal, total);
  }

  function bindForm(cart, subtotal, total) {
    const form = document.getElementById("checkoutForm");
    const submitBtn = document.getElementById("submitBtn");
    const errorBanner = document.getElementById("formErrorBanner");
    const paymentOptions = document.querySelectorAll(".payment-option");
    const vodafoneCashBox = document.getElementById("vodafoneCashBox");
    const instapayBox = document.getElementById("instapayBox");
    const paymentReferenceRow = document.getElementById("paymentReferenceRow");

    function updatePaymentUI() {
      const selected = form.querySelector('input[name="paymentMethod"]:checked').value;

      paymentOptions.forEach((opt) => {
        opt.classList.toggle("selected", opt.dataset.method === selected);
      });

      vodafoneCashBox.classList.toggle("show", selected === "vodafone_cash");
      instapayBox.classList.toggle("show", selected === "instapay");
      paymentReferenceRow.style.display =
        selected === "vodafone_cash" || selected === "instapay" ? "block" : "none";
    }

    paymentOptions.forEach((opt) => {
      opt.addEventListener("click", () => {
        opt.querySelector('input[type="radio"]').checked = true;
        updatePaymentUI();
      });
    });

    updatePaymentUI();

    function showFieldError(field, message) {
      const row = form.querySelector(`[data-field="${field}"]`);
      if (!row) return;
      row.classList.add("has-error");
      const errEl = row.querySelector(".field-error");
      if (errEl && message) errEl.textContent = message;
    }

    function clearErrors() {
      form.querySelectorAll(".form-row.has-error").forEach((row) => {
        row.classList.remove("has-error");
      });
      errorBanner.style.display = "none";
    }

    function validate(data) {
      let valid = true;

      if (!data.customerName || data.customerName.trim().length < 3) {
        showFieldError("customerName");
        valid = false;
      }

      const phoneClean = (data.phone || "").replace(/[^0-9]/g, "");
      if (phoneClean.length < 10) {
        showFieldError("phone");
        valid = false;
      }

      if (!data.city || data.city.trim().length < 2) {
        showFieldError("city");
        valid = false;
      }

      if (!data.address || data.address.trim().length < 5) {
        showFieldError("address");
        valid = false;
      }

      if (
        (data.paymentMethod === "vodafone_cash" || data.paymentMethod === "instapay") &&
        (!data.paymentReference || data.paymentReference.trim().length < 3)
      ) {
        showFieldError("paymentReference");
        valid = false;
      }

      return valid;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (!validate(data)) {
        errorBanner.textContent = "من فضلك راجع البيانات المطلوبة أعلاه";
        errorBanner.style.display = "block";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...`;

      const payload = {
        customerName: data.customerName.trim(),
        phone: data.phone.trim(),
        secondaryPhone: data.secondaryPhone ? data.secondaryPhone.trim() : null,
        city: data.city.trim(),
        address: data.address.trim(),
        notes: data.notes ? data.notes.trim() : null,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference ? data.paymentReference.trim() : null,
        shippingFee: SHIPPING_FEE,
        items: cart.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          qty: item.qty,
        })),
      };

      try {
        const res = await fetch(API_BASE + "/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "حدث خطأ أثناء إرسال الطلب");
        }

        // نجح الطلب: فضّي السلة واعرض شاشة النجاح
        window.RowadCart.clearCart();
        renderSuccess(result.order, payload, total);
      } catch (err) {
        console.error("خطأ في إرسال الطلب:", err);
        errorBanner.textContent = err.message || "حدث خطأ أثناء إرسال الطلب، حاول تاني";
        errorBanner.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> تأكيد الطلب`;
      }
    });
  }

  function renderSuccess(order, payload, total) {
    const orderId = order && order.id ? order.id : "";

    // رسالة واتساب للتأكيد
    let waMessage = `مرحباً، لسه عملت طلب جديد رقم #${orderId}\n\n`;
    waMessage += `الاسم: ${payload.customerName}\n`;
    waMessage += `التليفون: ${payload.phone}\n`;
    waMessage += `العنوان: ${payload.city} - ${payload.address}\n`;
    waMessage += `طريقة الدفع: ${
      payload.paymentMethod === "cod"
        ? "الدفع عند الاستلام"
        : payload.paymentMethod === "vodafone_cash"
        ? "فودافون كاش"
        : "إنستاباي"
    }\n`;
    if (payload.paymentReference) {
      waMessage += `رقم العملية: ${payload.paymentReference}\n`;
    }
    waMessage += `الإجمالي: ${total.toFixed(0)} ج.م`;

    const waLink =
      "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(waMessage);

    container.innerHTML = `
      <div class="checkout-success">
        <i class="fa-solid fa-circle-check"></i>
        <h2>تم استلام طلبك بنجاح 🎉</h2>
        <p>رقم طلبك هو <strong>#${orderId}</strong>. هنتواصل معاك قريب لتأكيد الطلب والتوصيل.</p>
        <div class="success-actions">
          <a href="${waLink}" target="_blank" rel="noopener" class="success-btn-whatsapp">
            <i class="fa-brands fa-whatsapp"></i> تأكيد الطلب عبر واتساب
          </a>
          <a href="store.html" class="success-btn-home">متابعة التسوق</a>
        </div>
      </div>
    `;
  }

  async function init() {
    await loadSettings();

    const cart = window.RowadCart ? window.RowadCart.getCart() : [];
    if (!cart || cart.length === 0) {
      renderEmpty();
      return;
    }

    renderForm(cart);
  }

  init();
})();