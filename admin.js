/* =========================================================
   رواد الظل | admin.js
   لوحة تحكم كاملة: تسجيل دخول + منتجات + تصنيفات + مقالات
   + أعمالنا (projects) + خدماتنا (services)
   (إضافة / تعديل / حذف / رفع صور)
========================================================= */

/* =========================================================
   ⚠️ ملاحظة مهمة جداً قبل الاستخدام:

   الملف ده مبني على افتراض إن الـ API بتاعك شكله كالتالي
   (REST قياسي). لو الـ controllers بتاعتك مختلفة في:
     - أسماء الحقول (title / name / price / oldPrice ...)
     - شكل الـ response (array مباشر ولا { data, total } ...)
     - نظام التوكن (JWT في الـ header) 
   غيّر الجزء المُعلّم بـ "CONFIG" تحت على حسب الكنترولرز
   بتاعتك، أو ابعتلي الكنترولرز وأظبطه بالظبط.

   Endpoints المفترضة:
   POST   /api/auth/login          { email, password } -> { token, user }
   GET    /api/categories          -> [{ id, name, image }]
   POST   /api/categories          FormData(name, image)
   PUT    /api/categories/:id      FormData(name, image?)
   DELETE /api/categories/:id

   GET    /api/products?page=&limit=
          -> { products:[...], total, totalPages, currentPage }
             (لو رجعت array عادي هيتم التعامل معاه تلقائي)
   POST   /api/products            FormData(title, description,
                                    price, oldPrice, discount,
                                    category, image)
   PUT    /api/products/:id        FormData(نفس الحقول)
   DELETE /api/products/:id

   GET    /api/articles?page=&limit=&search=
          -> { articles:[...], total, totalPages, currentPage }
             (أو array عادي)
   POST   /api/articles            FormData(title, slug, excerpt,
                                    content, category, image,
                                    metaTitle, metaDescription,
                                    metaKeywords, published)
   PUT    /api/articles/:id        FormData(نفس الحقول)
   DELETE /api/articles/:id
   GET    /api/articles/:slug      -> مقال واحد (للعرض في الموقع، بدون توكن)

   GET    /api/projects            -> [{ id, title, tag, description, image, order }]
   POST   /api/projects            FormData(title, tag, description, order, image)
   PUT    /api/projects/:id        FormData(نفس الحقول)
   DELETE /api/projects/:id

   GET    /api/services            -> [{ id, title, description, tag, image, order }]
   POST   /api/services            FormData(title, description, tag, order, image)
   PUT    /api/services/:id        FormData(نفس الحقول)
   DELETE /api/services/:id

   التوكن بيتبعت مع كل request كـ:
   Authorization: Bearer <token>
========================================================= */

(function () {
  "use strict";

  /* =========================================================
     CONFIG
  ========================================================= */

  // ⚠️ الإصلاح: تمت إزالة السلاش (/) الزيادة من آخر الرابط.
  // كانت موجودة قبل كده كـ "https://rowadalthil.com/" وبما إن كل
  // الـ paths في الكود بتبدأ بسلاش أصلاً (زي "/api/auth/login")،
  // كان بيتولد رابط فيه سلاشين ورا بعض ("...com//api/auth/login")
  // وده بيخلي أغلب السيرفرات (خصوصاً Nginx / بعض إعدادات Express)
  // ترجع 404 أو تتعامل مع الراوت بشكل غلط -> رسالة "حصل خطأ، حاول تاني"
  // عند تسجيل الدخول.
  const API_BASE = "https://rowadalthil.com";
  const TOKEN_KEY = "rw_admin_token";
  const PRODUCTS_PER_PAGE = 10;
  const ARTICLES_PER_PAGE = 10;

  /* =========================================================
     STATE
  ========================================================= */

  const state = {
    categories: [],
    products: [],
    productsTotalPages: 1,
    productsCurrentPage: 1,
    editingProductId: null,
    editingCategoryId: null,

    articles: [],
    articlesTotalPages: 1,
    articlesCurrentPage: 1,
    articlesSearch: "",
    editingArticleId: null,
  };

  /* =========================================================
     ELEMENTS
  ========================================================= */

  const el = {
    // login
    loginScreen: document.getElementById("loginScreen"),
    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),

    // dashboard shell
    dashboard: document.getElementById("dashboard"),
    navButtons: document.querySelectorAll(".nav-btn"),
    tabPanels: document.querySelectorAll(".tab-panel"),
    logoutBtn: document.getElementById("logoutBtn"),

    // products
    productsTableBody: document.getElementById("productsTableBody"),
    productsPagination: document.getElementById("productsPagination"),
    openAddProduct: document.getElementById("openAddProduct"),

    productModal: document.getElementById("productModal"),
    productModalTitle: document.getElementById("productModalTitle"),
    productForm: document.getElementById("productForm"),
    productId: document.getElementById("productId"),
    productTitle: document.getElementById("productTitle"),
    productDescription: document.getElementById("productDescription"),
    productPrice: document.getElementById("productPrice"),
    productOldPrice: document.getElementById("productOldPrice"),
    productDiscount: document.getElementById("productDiscount"),
    productCategory: document.getElementById("productCategory"),
    productImage: document.getElementById("productImage"),
    productImagePreview: document.getElementById("productImagePreview"),
    productFormError: document.getElementById("productFormError"),

    // categories
    categoriesGrid: document.getElementById("categoriesGrid"),
    openAddCategory: document.getElementById("openAddCategory"),

    categoryModal: document.getElementById("categoryModal"),
    categoryModalTitle: document.getElementById("categoryModalTitle"),
    categoryForm: document.getElementById("categoryForm"),
    categoryId: document.getElementById("categoryId"),
    categoryName: document.getElementById("categoryName"),
    categoryImage: document.getElementById("categoryImage"),
    categoryImagePreview: document.getElementById("categoryImagePreview"),
    categoryFormError: document.getElementById("categoryFormError"),

    // articles
    articlesTableBody: document.getElementById("articlesTableBody"),
    articlesPagination: document.getElementById("articlesPagination"),
    openAddArticle: document.getElementById("openAddArticle"),
    articlesSearchInput: document.getElementById("articlesSearchInput"),

    articleModal: document.getElementById("articleModal"),
    articleModalTitle: document.getElementById("articleModalTitle"),
    articleForm: document.getElementById("articleForm"),
    articleId: document.getElementById("articleId"),
    articleTitle: document.getElementById("articleTitle"),
    articleSlug: document.getElementById("articleSlug"),
    articleCategory: document.getElementById("articleCategory"),
    articleExcerpt: document.getElementById("articleExcerpt"),
    articleContent: document.getElementById("articleContent"),
    articleImage: document.getElementById("articleImage"),
    articleImagePreview: document.getElementById("articleImagePreview"),
    articleMetaTitle: document.getElementById("articleMetaTitle"),
    articleMetaDescription: document.getElementById("articleMetaDescription"),
    articleMetaKeywords: document.getElementById("articleMetaKeywords"),
    articlePublished: document.getElementById("articlePublished"),
    articleFormError: document.getElementById("articleFormError"),
    editorToolbar: document.getElementById("editorToolbar"),

    toast: document.getElementById("toast"),
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function authHeaders(extra) {
    const headers = Object.assign({}, extra || {});
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    return headers;
  }

  let toastTimer;

  function showToast(message, type) {
    if (!el.toast) return;

    el.toast.textContent = message;
    el.toast.className = "toast show" + (type === "error" ? " toast-error" : "");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("show");
    }, 3000);
  }

  async function apiRequest(path, options) {
    options = options || {};

    const res = await fetch(API_BASE + path, {
      method: options.method || "GET",
      headers: options.isFormData
        ? authHeaders(options.headers)
        : authHeaders(Object.assign({ "Content-Type": "application/json" }, options.headers)),
      body: options.body
        ? options.isFormData
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
    });

    const isLoginRequest = path.indexOf("/api/auth/login") === 0;

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if ((res.status === 401 || res.status === 403) && !isLoginRequest) {
      clearToken();
      showLogin();
      throw new Error("انتهت الجلسة، سجّل الدخول تاني");
    }

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || "حصل خطأ، حاول تاني";
      throw new Error(msg);
    }

    return data;
  }

  function fillSelect(select, categories, selectedId) {
    if (!select) return;

    select.innerHTML = `<option value="">بدون تصنيف</option>`;

    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (selectedId && String(selectedId) === String(cat.id)) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  function openModal(modal) {
    if (modal) modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  /* تحويل أي عنوان عربي/إنجليزي إلى slug صالح للرابط */
  function slugify(text) {
    return String(text || "")
      .trim()
      .replace(/[\u064B-\u0652]/g, "") // إزالة التشكيل
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "") // إزالة الرموز
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /* =========================================================
     LOGIN / LOGOUT
  ========================================================= */

  function showLogin() {
    if (el.loginScreen) el.loginScreen.style.display = "flex";
    if (el.dashboard) el.dashboard.style.display = "none";
  }
function showDashboard() {
    if (el.loginScreen) el.loginScreen.style.display = "none";
    if (el.dashboard) el.dashboard.style.display = "flex";

    loadCategories().then(() => loadProducts(1));
    loadArticles(1);
    loadProjects();
    loadServices();
    loadHeroSlides();
    loadOrders(1);
    loadWorkSections();
    loadSettings();
    initPush();
    updateOrdersBadge();
}

  if (el.loginForm) {
    el.loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (el.loginError) el.loginError.textContent = "";

      const email = el.loginEmail.value.trim();
      const password = el.loginPassword.value;

      try {
        const data = await apiRequest("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });

        const token = data.token || (data.data && data.data.token);

        if (!token) {
          throw new Error("لم يتم استلام التوكن من السيرفر");
        }

        setToken(token);
        showDashboard();
        showToast("تم تسجيل الدخول بنجاح");
      } catch (err) {
        if (el.loginError) el.loginError.textContent = err.message;
      }
    });
  }

  if (el.logoutBtn) {
    el.logoutBtn.addEventListener("click", function () {
      clearToken();
      showLogin();
    });
  }

  /* =========================================================
     TABS
  ========================================================= */

  el.navButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = btn.getAttribute("data-tab");

      el.navButtons.forEach((b) => b.classList.toggle("active", b === btn));

      el.tabPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === "tab-" + tab);
      });
    });
  });

  /* =========================================================
     CATEGORIES
  ========================================================= */

  async function loadCategories() {
    try {
      const data = await apiRequest("/api/categories");
      state.categories = Array.isArray(data) ? data : data.categories || data.data || [];

      renderCategoriesGrid();
      fillSelect(el.productCategory, state.categories);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderCategoriesGrid() {
    if (!el.categoriesGrid) return;

    el.categoriesGrid.innerHTML = "";

    if (!state.categories.length) {
      el.categoriesGrid.innerHTML = `<div class="empty-state">لا توجد تصنيفات حالياً</div>`;
      return;
    }

    state.categories.forEach((cat) => {
      const card = document.createElement("div");
      card.className = "cat-card";

      const imageHtml = cat.image
        ? `<img class="cat-card-img" src="${resolveImage(cat.image)}" alt="${cat.name}">`
        : `<div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;color:#bbb;font-size:26px;">
             <i class="fa-solid fa-tags"></i>
           </div>`;

      card.innerHTML = `
        ${imageHtml}
        <div class="cat-card-body">
          <strong>${cat.name}</strong>
          <div class="row-actions">
            <button class="icon-btn btn-edit" data-id="${cat.id}" title="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn danger btn-delete" data-id="${cat.id}" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector(".btn-edit").addEventListener("click", () => openEditCategory(cat.id));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteCategory(cat.id));

      el.categoriesGrid.appendChild(card);
    });
  }

  function resetCategoryForm() {
    state.editingCategoryId = null;
    el.categoryForm.reset();
    el.categoryId.value = "";
    el.categoryFormError.textContent = "";
    el.categoryImagePreview.style.display = "none";
    el.categoryImagePreview.src = "";
    el.categoryModalTitle.textContent = "إضافة تصنيف";
  }

  function openEditCategory(id) {
    const cat = state.categories.find((c) => String(c.id) === String(id));
    if (!cat) return;

    state.editingCategoryId = id;
    el.categoryId.value = id;
    el.categoryName.value = cat.name || "";
    el.categoryFormError.textContent = "";

    if (cat.image) {
      el.categoryImagePreview.src = resolveImage(cat.image);
      el.categoryImagePreview.style.display = "block";
    } else {
      el.categoryImagePreview.style.display = "none";
    }

    el.categoryModalTitle.textContent = "تعديل تصنيف";
    openModal(el.categoryModal);
  }

  async function deleteCategory(id) {
    if (!confirm("متأكد إنك عايز تحذف التصنيف ده؟")) return;

    try {
      await apiRequest("/api/categories/" + id, { method: "DELETE" });
      showToast("تم حذف التصنيف");
      loadCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (el.openAddCategory) {
    el.openAddCategory.addEventListener("click", function () {
      resetCategoryForm();
      openModal(el.categoryModal);
    });
  }

  if (el.categoryImage) {
    el.categoryImage.addEventListener("change", function () {
      const file = el.categoryImage.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        el.categoryImagePreview.src = e.target.result;
        el.categoryImagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (el.categoryForm) {
    el.categoryForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      el.categoryFormError.textContent = "";

      const formData = new FormData();
      formData.append("name", el.categoryName.value.trim());

      if (el.categoryImage.files[0]) {
        formData.append("image", el.categoryImage.files[0]);
      }

      try {
        if (state.editingCategoryId) {
          await apiRequest("/api/categories/" + state.editingCategoryId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل التصنيف");
        } else {
          await apiRequest("/api/categories", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة التصنيف");
        }

        closeModal(el.categoryModal);
        loadCategories();
      } catch (err) {
        el.categoryFormError.textContent = err.message;
      }
    });
  }

  /* =========================================================
     PRODUCTS
  ========================================================= */

  async function loadProducts(page) {
    page = page || 1;

    try {
      const data = await apiRequest(
        "/api/products?page=" + page + "&limit=" + PRODUCTS_PER_PAGE
      );

      if (Array.isArray(data)) {
        // السيرفر رجّع array عادي بدون pagination من السيرفر نفسه
        state.productsTotalPages = Math.max(1, Math.ceil(data.length / PRODUCTS_PER_PAGE));
        state.productsCurrentPage = page;
        const start = (page - 1) * PRODUCTS_PER_PAGE;
        state.products = data.slice(start, start + PRODUCTS_PER_PAGE);
        state._allProducts = data;
      } else {
        state.products = data.products || data.data || [];
        state.productsTotalPages = data.totalPages || 1;
        state.productsCurrentPage = data.currentPage || page;
      }

      renderProductsTable();
      renderProductsPagination();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function getProductCategoryId(product) {
    if (product.Category && product.Category.id !== undefined) return product.Category.id;
    if (product.category && typeof product.category === "object") return product.category.id;
    if (product.categoryId !== undefined && product.categoryId !== null) return product.categoryId;
    if (product.CategoryId !== undefined && product.CategoryId !== null) return product.CategoryId;
    return product.category;
  }

  function categoryName(product) {
    if (product.Category && product.Category.name) return product.Category.name;
    if (product.category && typeof product.category === "object") return product.category.name;

    const id = getProductCategoryId(product);
    if (id === undefined || id === null || id === "") return "—";

    const cat = state.categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : "—";
  }

  function renderProductsTable() {
    if (!el.productsTableBody) return;

    el.productsTableBody.innerHTML = "";

    if (!state.products.length) {
      el.productsTableBody.innerHTML = `
        <tr><td colspan="6" class="empty-state">لا توجد منتجات حالياً</td></tr>
      `;
      return;
    }

    state.products.forEach((product) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          ${
            product.image
              ? `<img class="table-thumb" src="${resolveImage(product.image)}" alt="${product.title}">`
              : `<div class="table-thumb table-thumb-empty"><i class="fa-solid fa-image"></i></div>`
          }
        </td>
        <td>${product.title}</td>
        <td>${categoryName(product)}</td>
        <td>${product.price} ج.م ${product.oldPrice ? `<span class="old-price">${product.oldPrice}</span>` : ""}</td>
        <td><span class="badge badge-active">متاح</span></td>
        <td class="table-actions">
          <button class="btn-icon btn-edit" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

      tr.querySelector(".btn-edit").addEventListener("click", () => openEditProduct(product.id));
      tr.querySelector(".btn-delete").addEventListener("click", () => deleteProduct(product.id));

      el.productsTableBody.appendChild(tr);
    });
  }

  function renderProductsPagination() {
    if (!el.productsPagination) return;

    el.productsPagination.innerHTML = "";

    if (state.productsTotalPages <= 1) return;

    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.innerHTML = "‹";
    prev.disabled = state.productsCurrentPage === 1;
    prev.addEventListener("click", () => loadProducts(state.productsCurrentPage - 1));
    el.productsPagination.appendChild(prev);

    for (let i = 1; i <= state.productsTotalPages; i++) {
      const btn = document.createElement("button");
      btn.className = "page-btn" + (i === state.productsCurrentPage ? " active" : "");
      btn.textContent = i;
      btn.addEventListener("click", () => loadProducts(i));
      el.productsPagination.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "page-btn";
    next.innerHTML = "›";
    next.disabled = state.productsCurrentPage === state.productsTotalPages;
    next.addEventListener("click", () => loadProducts(state.productsCurrentPage + 1));
    el.productsPagination.appendChild(next);
  }

  function resetProductForm() {
    state.editingProductId = null;
    el.productForm.reset();
    el.productId.value = "";
    el.productFormError.textContent = "";
    el.productImagePreview.style.display = "none";
    el.productImagePreview.src = "";
    el.productModalTitle.textContent = "إضافة منتج";
    fillSelect(el.productCategory, state.categories);
  }

  async function findProductById(id) {
    let product = state.products.find((p) => String(p.id) === String(id));
    if (product) return product;

    if (state._allProducts) {
      product = state._allProducts.find((p) => String(p.id) === String(id));
      if (product) return product;
    }

    // fallback: اطلبه من السيرفر مباشرة لو مش موجود في الصفحة الحالية
    try {
      const data = await apiRequest("/api/products/" + id);
      return data.product || data.data || data;
    } catch (e) {
      return null;
    }
  }

  async function openEditProduct(id) {
    const product = await findProductById(id);
    if (!product) {
      showToast("تعذر العثور على المنتج", "error");
      return;
    }

    state.editingProductId = id;

    el.productId.value = id;
    el.productTitle.value = product.title || "";
    el.productDescription.value = product.description || "";
    el.productPrice.value = product.price || "";
    el.productOldPrice.value = product.oldPrice || "";
    el.productDiscount.value = product.discount || "";
    el.productFormError.textContent = "";

    const categoryId = getProductCategoryId(product);

    fillSelect(el.productCategory, state.categories, categoryId);

    if (product.image) {
      el.productImagePreview.src = resolveImage(product.image);
      el.productImagePreview.style.display = "block";
    } else {
      el.productImagePreview.style.display = "none";
    }

    el.productModalTitle.textContent = "تعديل منتج";
    openModal(el.productModal);
  }

  async function deleteProduct(id) {
    if (!confirm("متأكد إنك عايز تحذف المنتج ده؟")) return;

    try {
      await apiRequest("/api/products/" + id, { method: "DELETE" });
      showToast("تم حذف المنتج");
      loadProducts(state.productsCurrentPage);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (el.openAddProduct) {
    el.openAddProduct.addEventListener("click", function () {
      resetProductForm();
      openModal(el.productModal);
    });
  }

  if (el.productImage) {
    el.productImage.addEventListener("change", function () {
      const file = el.productImage.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        el.productImagePreview.src = e.target.result;
        el.productImagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (el.productForm) {
    el.productForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      el.productFormError.textContent = "";

      const formData = new FormData();
      formData.append("title", el.productTitle.value.trim());
      formData.append("description", el.productDescription.value.trim());
      formData.append("price", el.productPrice.value);
      formData.append("oldPrice", el.productOldPrice.value || "");
      formData.append("discount", el.productDiscount.value.trim());
      formData.append("category", el.productCategory.value || "");
      formData.append("categoryId", el.productCategory.value || "");

      if (el.productImage.files[0]) {
        formData.append("image", el.productImage.files[0]);
      }

      try {
        if (state.editingProductId) {
          await apiRequest("/api/products/" + state.editingProductId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل المنتج");
        } else {
          await apiRequest("/api/products", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة المنتج");
        }

        closeModal(el.productModal);
        loadProducts(state.productsCurrentPage);
      } catch (err) {
        el.productFormError.textContent = err.message;
      }
    });
  }

  /* =========================================================
     ARTICLES
  ========================================================= */

  let articlesSearchTimer;

  async function loadArticles(page) {
    page = page || 1;

    try {
      const query =
        "/api/articles?page=" +
        page +
        "&limit=" +
        ARTICLES_PER_PAGE +
        (state.articlesSearch ? "&search=" + encodeURIComponent(state.articlesSearch) : "");

      const data = await apiRequest(query);

      if (Array.isArray(data)) {
        // فلترة محلية لو الباك إند رجّع كل المقالات array عادي
        let list = data;

        if (state.articlesSearch) {
          const q = state.articlesSearch.toLowerCase();
          list = list.filter(
            (a) =>
              (a.title || "").toLowerCase().includes(q) ||
              (a.excerpt || "").toLowerCase().includes(q)
          );
        }

        state.articlesTotalPages = Math.max(1, Math.ceil(list.length / ARTICLES_PER_PAGE));
        state.articlesCurrentPage = page;

        const start = (page - 1) * ARTICLES_PER_PAGE;
        state.articles = list.slice(start, start + ARTICLES_PER_PAGE);
        state._allArticles = data;
      } else {
        state.articles = data.articles || data.data || [];
        state.articlesTotalPages = data.totalPages || 1;
        state.articlesCurrentPage = data.currentPage || page;
      }

      renderArticlesTable();
      renderArticlesPagination();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderArticlesTable() {
    if (!el.articlesTableBody) return;

    el.articlesTableBody.innerHTML = "";

    if (!state.articles.length) {
      el.articlesTableBody.innerHTML = `
        <tr><td colspan="6" class="empty-state">لا توجد مقالات حالياً</td></tr>
      `;
      return;
    }

    state.articles.forEach((article) => {
      const tr = document.createElement("tr");

      const isPublished = article.published === undefined ? true : !!article.published;

      tr.innerHTML = `
        <td>
          ${
            article.image
              ? `<img class="table-thumb" src="${resolveImage(article.image)}" alt="${article.title}">`
              : `<div class="table-thumb table-thumb-empty"><i class="fa-solid fa-image"></i></div>`
          }
        </td>
        <td>
          <strong>${article.title}</strong><br>
          <span style="color:#9aa1a8;font-size:12px;">/${article.slug || ""}</span>
        </td>
        <td>${article.category || "—"}</td>
        <td>${formatDate(article.createdAt || article.updatedAt)}</td>
        <td>
          <span class="badge ${isPublished ? "badge-active" : ""}" style="${
        isPublished ? "" : "background:#fff0f0;color:#d64545;"
      }">
            ${isPublished ? "منشور" : "مسودة"}
          </span>
        </td>
        <td class="table-actions">
          <button class="btn-icon btn-edit" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

      tr.querySelector(".btn-edit").addEventListener("click", () => openEditArticle(article.id));
      tr.querySelector(".btn-delete").addEventListener("click", () => deleteArticle(article.id));

      el.articlesTableBody.appendChild(tr);
    });
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      const d = new Date(value);
      return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return "—";
    }
  }

  function renderArticlesPagination() {
    if (!el.articlesPagination) return;

    el.articlesPagination.innerHTML = "";

    if (state.articlesTotalPages <= 1) return;

    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.innerHTML = "‹";
    prev.disabled = state.articlesCurrentPage === 1;
    prev.addEventListener("click", () => loadArticles(state.articlesCurrentPage - 1));
    el.articlesPagination.appendChild(prev);

    for (let i = 1; i <= state.articlesTotalPages; i++) {
      const btn = document.createElement("button");
      btn.className = "page-btn" + (i === state.articlesCurrentPage ? " active" : "");
      btn.textContent = i;
      btn.addEventListener("click", () => loadArticles(i));
      el.articlesPagination.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "page-btn";
    next.innerHTML = "›";
    next.disabled = state.articlesCurrentPage === state.articlesTotalPages;
    next.addEventListener("click", () => loadArticles(state.articlesCurrentPage + 1));
    el.articlesPagination.appendChild(next);
  }

  function resetArticleForm() {
    state.editingArticleId = null;
    el.articleForm.reset();
    el.articleId.value = "";
    el.articleContent.innerHTML = "";
    el.articleFormError.textContent = "";
    el.articleImagePreview.style.display = "none";
    el.articleImagePreview.src = "";
    el.articlePublished.checked = true;
    el.articleModalTitle.textContent = "إضافة مقال";
  }

  async function findArticleById(id) {
    let article = state.articles.find((a) => String(a.id) === String(id));
    if (article) return article;

    if (state._allArticles) {
      article = state._allArticles.find((a) => String(a.id) === String(id));
      if (article) return article;
    }

    try {
      const data = await apiRequest("/api/articles/" + id);
      return data.article || data.data || data;
    } catch (e) {
      return null;
    }
  }

  async function openEditArticle(id) {
    const article = await findArticleById(id);
    if (!article) {
      showToast("تعذر العثور على المقال", "error");
      return;
    }

    state.editingArticleId = id;

    el.articleId.value = id;
    el.articleTitle.value = article.title || "";
    el.articleSlug.value = article.slug || "";
    el.articleCategory.value = article.category || "";
    el.articleExcerpt.value = article.excerpt || "";
    el.articleContent.innerHTML = article.content || "";
    el.articleMetaTitle.value = article.metaTitle || "";
    el.articleMetaDescription.value = article.metaDescription || "";
    el.articleMetaKeywords.value = article.metaKeywords || "";
    el.articlePublished.checked = article.published === undefined ? true : !!article.published;
    el.articleFormError.textContent = "";

    if (article.image) {
      el.articleImagePreview.src = resolveImage(article.image);
      el.articleImagePreview.style.display = "block";
    } else {
      el.articleImagePreview.style.display = "none";
    }

    el.articleModalTitle.textContent = "تعديل مقال";
    openModal(el.articleModal);
  }

  async function deleteArticle(id) {
    if (!confirm("متأكد إنك عايز تحذف المقال ده؟")) return;

    try {
      await apiRequest("/api/articles/" + id, { method: "DELETE" });
      showToast("تم حذف المقال");
      loadArticles(state.articlesCurrentPage);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (el.openAddArticle) {
    el.openAddArticle.addEventListener("click", function () {
      resetArticleForm();
      openModal(el.articleModal);
    });
  }

  if (el.articleImage) {
    el.articleImage.addEventListener("change", function () {
      const file = el.articleImage.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        el.articleImagePreview.src = e.target.result;
        el.articleImagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  /* توليد الـ slug تلقائياً من العنوان (إلا لو المستخدم عدّله يدوياً) */
  if (el.articleTitle && el.articleSlug) {
    let slugTouchedManually = false;

    el.articleSlug.addEventListener("input", function () {
      slugTouchedManually = true;
    });

    el.articleTitle.addEventListener("input", function () {
      if (!slugTouchedManually) {
        el.articleSlug.value = slugify(el.articleTitle.value);
      }
    });
  }

  /* شريط أدوات تنسيق بسيط للمحتوى (بديل خفيف لمحرر نصوص كامل) */
  if (el.editorToolbar && el.articleContent) {
    el.editorToolbar.querySelectorAll("[data-cmd]").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();

        const cmd = btn.getAttribute("data-cmd");

        el.articleContent.focus();

        if (cmd === "createLink") {
          const url = prompt("رابط اللينك:");
          if (url) document.execCommand(cmd, false, url);
        } else if (cmd === "formatBlock") {
          document.execCommand(cmd, false, btn.getAttribute("data-value"));
        } else {
          document.execCommand(cmd, false, null);
        }
      });
    });
  }

  /* البحث في المقالات */
  if (el.articlesSearchInput) {
    el.articlesSearchInput.addEventListener("input", function () {
      clearTimeout(articlesSearchTimer);
      articlesSearchTimer = setTimeout(() => {
        state.articlesSearch = el.articlesSearchInput.value.trim();
        loadArticles(1);
      }, 350);
    });
  }

  if (el.articleForm) {
    el.articleForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      el.articleFormError.textContent = "";

      const titleVal = el.articleTitle.value.trim();
      const slugVal = (el.articleSlug.value.trim() || slugify(titleVal));

      if (!slugVal) {
        el.articleFormError.textContent = "لازم يكون فيه رابط (slug) صالح للمقال";
        return;
      }

      const formData = new FormData();
      formData.append("title", titleVal);
      formData.append("slug", slugVal);
      formData.append("category", el.articleCategory.value.trim());
      formData.append("excerpt", el.articleExcerpt.value.trim());
      formData.append("content", el.articleContent.innerHTML);
      formData.append("metaTitle", el.articleMetaTitle.value.trim() || titleVal);
      formData.append(
        "metaDescription",
        el.articleMetaDescription.value.trim() || el.articleExcerpt.value.trim()
      );
      formData.append("metaKeywords", el.articleMetaKeywords.value.trim());
      formData.append("published", el.articlePublished.checked ? "true" : "false");

      if (el.articleImage.files[0]) {
        formData.append("image", el.articleImage.files[0]);
      }

      try {
        if (state.editingArticleId) {
          await apiRequest("/api/articles/" + state.editingArticleId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل المقال");
        } else {
          await apiRequest("/api/articles", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة المقال");
        }

        closeModal(el.articleModal);
        loadArticles(state.articlesCurrentPage);
      } catch (err) {
        el.articleFormError.textContent = err.message;
      }
    });
  }
  /* =========================================================
     PROJECTS
  ========================================================= */

  const elProjects = {
    projectsGrid: document.getElementById("projectsGrid"),
    openAddProject: document.getElementById("openAddProject"),

    projectModal: document.getElementById("projectModal"),
    projectModalTitle: document.getElementById("projectModalTitle"),
    projectForm: document.getElementById("projectForm"),
    projectId: document.getElementById("projectId"),
    projectTitle: document.getElementById("projectTitle"),
    projectTag: document.getElementById("projectTag"),
    projectDescription: document.getElementById("projectDescription"),
    projectOrder: document.getElementById("projectOrder"),
    projectImage: document.getElementById("projectImage"),
    projectImagePreview: document.getElementById("projectImagePreview"),
    projectFormError: document.getElementById("projectFormError"),
  };

  state.projects = [];
  state.editingProjectId = null;

  async function loadProjects() {
    try {
      const data = await apiRequest("/api/projects");
      state.projects = Array.isArray(data) ? data : data.projects || data.data || [];
      renderProjectsGrid();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderProjectsGrid() {
    if (!elProjects.projectsGrid) return;

    elProjects.projectsGrid.innerHTML = "";

    if (!state.projects.length) {
      elProjects.projectsGrid.innerHTML = `<div class="empty-state">لا توجد أعمال مضافة حالياً</div>`;
      return;
    }

    state.projects.forEach((project) => {
      const card = document.createElement("div");
      card.className = "cat-card";

      const imageHtml = project.image
        ? `<img class="cat-card-img" src="${resolveImage(project.image)}" alt="${project.title}">`
        : `<div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;color:#bbb;font-size:26px;">
             <i class="fa-solid fa-image"></i>
           </div>`;

      card.innerHTML = `
        ${imageHtml}
        <div class="cat-card-body">
          <strong>${project.title}</strong>
          <div class="row-actions">
            <button class="icon-btn btn-edit" title="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn danger btn-delete" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector(".btn-edit").addEventListener("click", () => openEditProject(project.id));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteProject(project.id));

      elProjects.projectsGrid.appendChild(card);
    });
  }

  function resetProjectForm() {
    state.editingProjectId = null;
    elProjects.projectForm.reset();
    elProjects.projectId.value = "";
    elProjects.projectOrder.value = "0";
    elProjects.projectFormError.textContent = "";
    elProjects.projectImagePreview.style.display = "none";
    elProjects.projectImagePreview.src = "";
    elProjects.projectModalTitle.textContent = "إضافة عمل";
  }

  function openEditProject(id) {
    const project = state.projects.find((p) => String(p.id) === String(id));
    if (!project) return;

    state.editingProjectId = id;
    elProjects.projectId.value = id;
    elProjects.projectTitle.value = project.title || "";
    elProjects.projectTag.value = project.tag || "";
    elProjects.projectDescription.value = project.description || "";
    elProjects.projectOrder.value = project.order || 0;
    elProjects.projectFormError.textContent = "";

    if (project.image) {
      elProjects.projectImagePreview.src = resolveImage(project.image);
      elProjects.projectImagePreview.style.display = "block";
    } else {
      elProjects.projectImagePreview.style.display = "none";
    }

    elProjects.projectModalTitle.textContent = "تعديل عمل";
    openModal(elProjects.projectModal);
  }

  async function deleteProject(id) {
    if (!confirm("متأكد إنك عايز تحذف العمل ده؟")) return;

    try {
      await apiRequest("/api/projects/" + id, { method: "DELETE" });
      showToast("تم حذف العمل");
      loadProjects();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elProjects.openAddProject) {
    elProjects.openAddProject.addEventListener("click", function () {
      resetProjectForm();
      openModal(elProjects.projectModal);
    });
  }

  if (elProjects.projectImage) {
    elProjects.projectImage.addEventListener("change", function () {
      const file = elProjects.projectImage.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        elProjects.projectImagePreview.src = e.target.result;
        elProjects.projectImagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (elProjects.projectForm) {
    elProjects.projectForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      elProjects.projectFormError.textContent = "";

      const formData = new FormData();
      formData.append("title", elProjects.projectTitle.value.trim());
      formData.append("tag", elProjects.projectTag.value.trim());
      formData.append("description", elProjects.projectDescription.value.trim());
      formData.append("order", elProjects.projectOrder.value || "0");

      if (elProjects.projectImage.files[0]) {
        formData.append("image", elProjects.projectImage.files[0]);
      }

      try {
        if (state.editingProjectId) {
          await apiRequest("/api/projects/" + state.editingProjectId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل العمل");
        } else {
          await apiRequest("/api/projects", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة العمل");
        }

        closeModal(elProjects.projectModal);
        loadProjects();
      } catch (err) {
        elProjects.projectFormError.textContent = err.message;
      }
    });
  }
  /* =========================================================
     PUSH NOTIFICATIONS
  ========================================================= */

  async function initPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("المتصفح ده مش بيدعم Push Notifications");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("فعّل الإشعارات عشان يوصلك تنبيه فوري بأي طلب جديد", "error");
        return;
      }

      const { publicKey } = await apiRequest("/api/push/vapid-public-key");

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await apiRequest("/api/push/subscribe", {
        method: "POST",
        body: subscription.toJSON(),
      });
    } catch (err) {
      console.error("Push setup error:", err);
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  /* =========================================================
     ORDERS NAV BADGE
  ========================================================= */

  async function updateOrdersBadge() {
    try {
      const data = await apiRequest("/api/orders?status=pending&limit=1");
      const badge = document.getElementById("ordersNavBadge");
      if (!badge) return;

      const count = data.total || 0;
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    } catch (err) {
      // صامت
    }
  }
  /* =========================================================
     SERVICES (خدماتنا المتخصصة)
  ========================================================= */

  const elServices = {
    servicesGrid: document.getElementById("servicesGrid"),
    openAddService: document.getElementById("openAddService"),

    serviceModal: document.getElementById("serviceModal"),
    serviceModalTitle: document.getElementById("serviceModalTitle"),
    serviceForm: document.getElementById("serviceForm"),
    serviceId: document.getElementById("serviceId"),
    serviceTitle: document.getElementById("serviceTitle"),
    serviceDescription: document.getElementById("serviceDescription"),
    serviceTag: document.getElementById("serviceTag"),
    serviceOrder: document.getElementById("serviceOrder"),
    serviceImage: document.getElementById("serviceImage"),
    serviceImagePreview: document.getElementById("serviceImagePreview"),
    serviceFormError: document.getElementById("serviceFormError"),
  };

  state.services = [];
  state.editingServiceId = null;

  async function loadServices() {
    try {
      const data = await apiRequest("/api/services");
      state.services = Array.isArray(data) ? data : data.services || data.data || [];

      // رتّب حسب order عشان الترتيب في الكارد يطابق ترتيب الظهور في الموقع
      state.services.sort((a, b) => (a.order || 0) - (b.order || 0));

      renderServicesGrid();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderServicesGrid() {
    if (!elServices.servicesGrid) return;

    elServices.servicesGrid.innerHTML = "";

    if (!state.services.length) {
      elServices.servicesGrid.innerHTML = `<div class="empty-state">لا توجد خدمات مضافة حالياً</div>`;
      return;
    }

    state.services.forEach((service) => {
      const card = document.createElement("div");
      card.className = "cat-card";

      const imageHtml = service.image
        ? `<img class="cat-card-img" src="${resolveImage(service.image)}" alt="${service.title}">`
        : `<div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;color:#bbb;font-size:26px;">
             <i class="fa-solid fa-screwdriver-wrench"></i>
           </div>`;

      card.innerHTML = `
        ${imageHtml}
        <div class="cat-card-body">
          <strong>${service.title}</strong>
          ${service.tag ? `<span style="color:#9aa1a8;font-size:12px;">${service.tag}</span>` : ""}
          <div class="row-actions">
            <button class="icon-btn btn-edit" title="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn danger btn-delete" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector(".btn-edit").addEventListener("click", () => openEditService(service.id));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteService(service.id));

      elServices.servicesGrid.appendChild(card);
    });
  }

  function resetServiceForm() {
    state.editingServiceId = null;
    elServices.serviceForm.reset();
    elServices.serviceId.value = "";
    elServices.serviceOrder.value = "0";
    elServices.serviceFormError.textContent = "";
    elServices.serviceImagePreview.style.display = "none";
    elServices.serviceImagePreview.src = "";
    elServices.serviceModalTitle.textContent = "إضافة خدمة";
  }

  function openEditService(id) {
    const service = state.services.find((s) => String(s.id) === String(id));
    if (!service) return;

    state.editingServiceId = id;
    elServices.serviceId.value = id;
    elServices.serviceTitle.value = service.title || "";
    elServices.serviceDescription.value = service.description || "";
    elServices.serviceTag.value = service.tag || "";
    elServices.serviceOrder.value = service.order || 0;
    elServices.serviceFormError.textContent = "";

    if (service.image) {
      elServices.serviceImagePreview.src = resolveImage(service.image);
      elServices.serviceImagePreview.style.display = "block";
    } else {
      elServices.serviceImagePreview.style.display = "none";
    }

    elServices.serviceModalTitle.textContent = "تعديل خدمة";
    openModal(elServices.serviceModal);
  }

  async function deleteService(id) {
    if (!confirm("متأكد إنك عايز تحذف الخدمة دي؟")) return;

    try {
      await apiRequest("/api/services/" + id, { method: "DELETE" });
      showToast("تم حذف الخدمة");
      loadServices();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elServices.openAddService) {
    elServices.openAddService.addEventListener("click", function () {
      resetServiceForm();
      openModal(elServices.serviceModal);
    });
  }

  if (elServices.serviceImage) {
    elServices.serviceImage.addEventListener("change", function () {
      const file = elServices.serviceImage.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        elServices.serviceImagePreview.src = e.target.result;
        elServices.serviceImagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (elServices.serviceForm) {
    elServices.serviceForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      elServices.serviceFormError.textContent = "";

      const formData = new FormData();
      formData.append("title", elServices.serviceTitle.value.trim());
      formData.append("description", elServices.serviceDescription.value.trim());
      formData.append("tag", elServices.serviceTag.value.trim());
      formData.append("order", elServices.serviceOrder.value || "0");

      if (elServices.serviceImage.files[0]) {
        formData.append("image", elServices.serviceImage.files[0]);
      }

      try {
        if (state.editingServiceId) {
          await apiRequest("/api/services/" + state.editingServiceId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل الخدمة");
        } else {
          await apiRequest("/api/services", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة الخدمة");
        }

        closeModal(elServices.serviceModal);
        loadServices();
      } catch (err) {
        elServices.serviceFormError.textContent = err.message;
      }
    });
  }
  /* =========================================================
     WORK SECTIONS (مجالات أعمالنا)
  ========================================================= */

  const elWorkSections = {
    grid: document.getElementById("workSectionsAdminGrid"),
    openAdd: document.getElementById("openAddWorkSection"),

    modal: document.getElementById("workSectionModal"),
    modalTitle: document.getElementById("workSectionModalTitle"),
    form: document.getElementById("workSectionForm"),
    id: document.getElementById("workSectionId"),

    title: document.getElementById("workSectionTitle"),
    slug: document.getElementById("workSectionSlug"),
    shortDescription: document.getElementById("workSectionShortDescription"),
    description: document.getElementById("workSectionDescription"),
    order: document.getElementById("workSectionOrder"),
    isActive: document.getElementById("workSectionIsActive"),

    image: document.getElementById("workSectionImage"),
    imagePreview: document.getElementById("workSectionImagePreview"),

    galleryWrap: document.getElementById("workSectionGalleryWrap"),
    galleryInput: document.getElementById("workSectionGalleryInput"),
    gallery: document.getElementById("workSectionGallery"),

    error: document.getElementById("workSectionFormError"),
    closeBtn: document.getElementById("closeWorkSectionModal"),
  };

  state.workSections = [];
  state.editingWorkSectionId = null;
  state.workSectionImages = [];

  async function loadWorkSections() {
    try {
      const data = await apiRequest("/api/work-sections");
      state.workSections = Array.isArray(data) ? data : data.sections || data.data || [];
      state.workSections.sort((a, b) => (a.order || 0) - (b.order || 0));
      renderWorkSectionsGrid();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderWorkSectionsGrid() {
    if (!elWorkSections.grid) return;
    elWorkSections.grid.innerHTML = "";

    if (!state.workSections.length) {
      elWorkSections.grid.innerHTML = `<div class="empty-state">لا توجد أقسام مضافة حالياً</div>`;
      return;
    }

    state.workSections.forEach((section) => {
      const card = document.createElement("div");
      card.className = "cat-card";

      const imageHtml = section.image
        ? `<img class="cat-card-img" src="${resolveImage(section.image)}" alt="${section.title}">`
        : `<div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;color:#bbb;font-size:26px;">
             <i class="fa-solid fa-layer-group"></i>
           </div>`;

      card.innerHTML = `
        ${imageHtml}
        <div class="cat-card-body">
          <strong>${section.title}</strong>
          <span style="color:#9aa1a8;font-size:12px;">${section.isActive ? "مفعّل" : "غير مفعّل"}</span>
          <div class="row-actions">
            <button class="icon-btn btn-edit" title="تعديل"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn danger btn-delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;

      card.querySelector(".btn-edit").addEventListener("click", () => openEditWorkSection(section.id));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteWorkSection(section.id));

      elWorkSections.grid.appendChild(card);
    });
  }

  function resetWorkSectionForm() {
    state.editingWorkSectionId = null;
    state.workSectionImages = [];

    elWorkSections.form.reset();
    elWorkSections.id.value = "";
    elWorkSections.order.value = "0";
    elWorkSections.isActive.checked = true;
    elWorkSections.error.textContent = "";

    elWorkSections.imagePreview.style.display = "none";
    elWorkSections.imagePreview.src = "";

    elWorkSections.modalTitle.textContent = "إضافة قسم جديد";

    if (elWorkSections.galleryWrap) elWorkSections.galleryWrap.style.display = "none";
    if (elWorkSections.gallery) elWorkSections.gallery.innerHTML = "";
  }

  async function openEditWorkSection(id) {
    const section = state.workSections.find((s) => String(s.id) === String(id));
    if (!section) return;

    state.editingWorkSectionId = id;

    elWorkSections.id.value = id;
    elWorkSections.title.value = section.title || "";
    elWorkSections.slug.value = section.slug || "";
    elWorkSections.shortDescription.value = section.shortDescription || "";
    elWorkSections.description.value = section.description || "";
    elWorkSections.order.value = section.order || 0;
    elWorkSections.isActive.checked = section.isActive === undefined ? true : !!section.isActive;
    elWorkSections.error.textContent = "";

    if (section.image) {
      elWorkSections.imagePreview.src = resolveImage(section.image);
      elWorkSections.imagePreview.style.display = "block";
    } else {
      elWorkSections.imagePreview.style.display = "none";
    }

    elWorkSections.modalTitle.textContent = "تعديل قسم";

    if (elWorkSections.galleryWrap) elWorkSections.galleryWrap.style.display = "block";
    await loadWorkSectionGallery(id);

    openModal(elWorkSections.modal);
  }

  async function deleteWorkSection(id) {
    if (!confirm("متأكد إنك عايز تحذف القسم ده؟")) return;

    try {
      await apiRequest("/api/work-sections/" + id, { method: "DELETE" });
      showToast("تم حذف القسم");
      loadWorkSections();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elWorkSections.openAdd) {
    elWorkSections.openAdd.addEventListener("click", function () {
      resetWorkSectionForm();
      openModal(elWorkSections.modal);
    });
  }

  /* توليد الـ slug تلقائياً من العنوان */
  if (elWorkSections.title && elWorkSections.slug) {
    let workSlugTouchedManually = false;

    elWorkSections.slug.addEventListener("input", function () {
      workSlugTouchedManually = true;
    });

    elWorkSections.title.addEventListener("input", function () {
      if (!workSlugTouchedManually) {
        elWorkSections.slug.value = slugify(elWorkSections.title.value);
      }
    });
  }

  if (elWorkSections.image) {
    elWorkSections.image.addEventListener("change", function () {
      const file = elWorkSections.image.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        elWorkSections.imagePreview.src = e.target.result;
        elWorkSections.imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (elWorkSections.form) {
    elWorkSections.form.addEventListener("submit", async function (e) {
      e.preventDefault();

      elWorkSections.error.textContent = "";

      const titleVal = elWorkSections.title.value.trim();
      const slugVal = elWorkSections.slug.value.trim() || slugify(titleVal);

      if (!titleVal || !slugVal) {
        elWorkSections.error.textContent = "لازم تدخل العنوان والرابط (slug)";
        return;
      }

      const formData = new FormData();
      formData.append("title", titleVal);
      formData.append("slug", slugVal);
      formData.append("shortDescription", elWorkSections.shortDescription.value.trim());
      formData.append("description", elWorkSections.description.value.trim());
      formData.append("order", elWorkSections.order.value || "0");
      formData.append("isActive", elWorkSections.isActive.checked ? "true" : "false");

      if (elWorkSections.image.files[0]) {
        formData.append("image", elWorkSections.image.files[0]);
      }

      try {
        let saved;

        if (state.editingWorkSectionId) {
          saved = await apiRequest("/api/work-sections/" + state.editingWorkSectionId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل القسم");
        } else {
          saved = await apiRequest("/api/work-sections", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة القسم");
        }

        const savedSection = saved.section || saved.data || saved;

        if (savedSection && savedSection.id) {
          state.editingWorkSectionId = savedSection.id;
          elWorkSections.id.value = savedSection.id;
          elWorkSections.modalTitle.textContent = "تعديل قسم";

          if (elWorkSections.galleryWrap) elWorkSections.galleryWrap.style.display = "block";
          await loadWorkSectionGallery(savedSection.id);
        }

        loadWorkSections();
      } catch (err) {
        elWorkSections.error.textContent = err.message;
      }
    });
  }

  if (elWorkSections.closeBtn) {
    elWorkSections.closeBtn.addEventListener("click", function () {
      closeModal(elWorkSections.modal);
    });
  }

  /* =========================================================
     معرض صور القسم (WorkSectionImage)
     ⚠️ الـ endpoints دي افتراضية على نفس نمط باقي الـ API — مش موجودة
     في الـ controller اللي بعتّه. لازم تضيفها في الباك إند:
     GET    /api/work-sections/:id/images
     POST   /api/work-sections/:id/images   FormData(images متعددة)
     DELETE /api/work-section-images/:imageId
  ========================================================= */

  async function loadWorkSectionGallery(sectionId) {
    if (!elWorkSections.gallery) return;

    try {
      const data = await apiRequest("/api/work-sections/" + sectionId + "/images");
      state.workSectionImages = Array.isArray(data) ? data : data.images || data.data || [];
    } catch (err) {
      state.workSectionImages = [];
    }
    renderWorkSectionGallery();
  }

  function renderWorkSectionGallery() {
    if (!elWorkSections.gallery) return;

    elWorkSections.gallery.innerHTML = "";

    if (!state.workSectionImages.length) {
      elWorkSections.gallery.innerHTML = `<div class="empty-state">لا توجد صور في المعرض حالياً</div>`;
      return;
    }

    state.workSectionImages.forEach((img) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      item.innerHTML = `
        <img src="${resolveImage(img.image)}" alt="${img.alt || ""}">
        <button type="button" class="gallery-item-delete" title="حذف الصورة">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      item.querySelector(".gallery-item-delete").addEventListener("click", () => deleteWorkSectionImage(img.id));
      elWorkSections.gallery.appendChild(item);
    });
  }

  async function deleteWorkSectionImage(imageId) {
    if (!confirm("متأكد إنك عايز تحذف الصورة دي من المعرض؟")) return;

    try {
      await apiRequest("/api/work-section-images/" + imageId, { method: "DELETE" });
      showToast("تم حذف الصورة");
      loadWorkSectionGallery(state.editingWorkSectionId);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elWorkSections.galleryInput) {
    elWorkSections.galleryInput.addEventListener("change", async function () {
      const files = elWorkSections.galleryInput.files;
      if (!files || !files.length) return;

      if (!state.editingWorkSectionId) {
        showToast("احفظ القسم الأول قبل ما تضيف صور المعرض", "error");
        elWorkSections.galleryInput.value = "";
        return;
      }

      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));

      try {
        await apiRequest("/api/work-sections/" + state.editingWorkSectionId + "/images", {
          method: "POST",
          body: formData,
          isFormData: true,
        });
        showToast("تم إضافة الصور");
        elWorkSections.galleryInput.value = "";
        loadWorkSectionGallery(state.editingWorkSectionId);
      } catch (err) {
        showToast(err.message, "error");
        elWorkSections.galleryInput.value = "";
      }
    });
  }

  /* =========================================================
     SETTINGS (إعدادات الموقع)
  ========================================================= */

  const elSettings = {
    form: document.getElementById("settingsForm"),
    logo: document.getElementById("settingsLogo"),
    logoPreview: document.getElementById("settingsLogoPreview"),
    logoExternal: document.getElementById("settingsLogoExternal"),
    logoExternalPreview: document.getElementById("settingsLogoExternalPreview"),
    siteName: document.getElementById("settingsSiteName"),
    siteNameEn: document.getElementById("settingsSiteNameEn"),
    phone: document.getElementById("settingsPhone"),
    phoneIntl: document.getElementById("settingsPhoneIntl"),
    whatsapp: document.getElementById("settingsWhatsapp"),
    email: document.getElementById("settingsEmail"),
    address: document.getElementById("settingsAddress"),
    facebook: document.getElementById("settingsFacebook"),
    instagram: document.getElementById("settingsInstagram"),
    twitter: document.getElementById("settingsTwitter"),
    linkedin: document.getElementById("settingsLinkedin"),
    error: document.getElementById("settingsFormError"),
  };

  async function loadSettings() {
    if (!elSettings.form) return;

    try {
      const data = await apiRequest("/api/settings");

      elSettings.siteName.value = data.siteName || "";
      elSettings.siteNameEn.value = data.siteNameEn || "";
      elSettings.phone.value = data.phone || "";
      elSettings.phoneIntl.value = data.phoneIntl || "";
      elSettings.whatsapp.value = data.whatsapp || "";
      elSettings.email.value = data.email || "";
      elSettings.address.value = data.address || "";
      elSettings.facebook.value = data.facebook || "";
      elSettings.instagram.value = data.instagram || "";
      elSettings.twitter.value = data.twitter || "";
      elSettings.linkedin.value = data.linkedin || "";

      if (data.logo) {
        elSettings.logoPreview.src = resolveImage(data.logo);
        elSettings.logoPreview.style.display = "block";
      }

      if (data.logoExternal) {
        elSettings.logoExternalPreview.src = resolveImage(data.logoExternal);
        elSettings.logoExternalPreview.style.display = "block";
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elSettings.logo) {
    elSettings.logo.addEventListener("change", function () {
      const file = elSettings.logo.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        elSettings.logoPreview.src = e.target.result;
        elSettings.logoPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (elSettings.logoExternal) {
    elSettings.logoExternal.addEventListener("change", function () {
      const file = elSettings.logoExternal.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        elSettings.logoExternalPreview.src = e.target.result;
        elSettings.logoExternalPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  if (elSettings.form) {
    elSettings.form.addEventListener("submit", async function (e) {
      e.preventDefault();

      elSettings.error.textContent = "";

      const formData = new FormData();
      formData.append("siteName", elSettings.siteName.value.trim());
      formData.append("siteNameEn", elSettings.siteNameEn.value.trim());
      formData.append("phone", elSettings.phone.value.trim());
      formData.append("phoneIntl", elSettings.phoneIntl.value.trim());
      formData.append("whatsapp", elSettings.whatsapp.value.trim());
      formData.append("email", elSettings.email.value.trim());
      formData.append("address", elSettings.address.value.trim());
      formData.append("facebook", elSettings.facebook.value.trim());
      formData.append("instagram", elSettings.instagram.value.trim());
      formData.append("twitter", elSettings.twitter.value.trim());
      formData.append("linkedin", elSettings.linkedin.value.trim());

      if (elSettings.logo.files[0]) {
        formData.append("logo", elSettings.logo.files[0]);
      }

      if (elSettings.logoExternal.files[0]) {
        formData.append("logoExternal", elSettings.logoExternal.files[0]);
      }

      try {
        await apiRequest("/api/settings", {
          method: "PUT",
          body: formData,
          isFormData: true,
        });

        showToast("تم حفظ الإعدادات بنجاح");
      } catch (err) {
        elSettings.error.textContent = err.message;
      }
    });
  }

  /* =========================================================
     HERO SLIDES
  ========================================================= */

  const elHero = {
    grid: document.getElementById("heroSlidesGrid"),
    openAdd: document.getElementById("openAddHeroSlide"),

    modal: document.getElementById("heroSlideModal"),
    modalTitle: document.getElementById("heroSlideModalTitle"),
    form: document.getElementById("heroSlideForm"),
    id: document.getElementById("heroSlideId"),

    label: document.getElementById("heroSlideLabel"),
    order: document.getElementById("heroSlideOrder"),
    title: document.getElementById("heroSlideTitle"),
    description: document.getElementById("heroSlideDescription"),
    buttonText: document.getElementById("heroSlideButtonText"),
    buttonLink: document.getElementById("heroSlideButtonLink"),

    image: document.getElementById("heroSlideImage"),
    imagePreview: document.getElementById("heroSlideImagePreview"),

    videoThumb: document.getElementById("heroSlideVideoThumb"),
    videoThumbPreview: document.getElementById("heroSlideVideoThumbPreview"),
    videoFile: document.getElementById("heroSlideVideoFile"),
    videoUrl: document.getElementById("heroSlideVideoUrl"),
    videoText: document.getElementById("heroSlideVideoText"),

    error: document.getElementById("heroSlideFormError"),
  };

  state.heroSlides = [];
  state.editingHeroSlideId = null;

  async function loadHeroSlides() {
    try {
      const data = await apiRequest("/api/hero-slides");
      state.heroSlides = Array.isArray(data) ? data : data.slides || data.data || [];
      state.heroSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
      renderHeroSlidesGrid();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderHeroSlidesGrid() {
    if (!elHero.grid) return;

    elHero.grid.innerHTML = "";

    if (!state.heroSlides.length) {
      elHero.grid.innerHTML = `<div class="empty-state">لا توجد سلايدات مضافة حالياً</div>`;
      return;
    }

    state.heroSlides.forEach((slide) => {
      const card = document.createElement("div");
      card.className = "cat-card";

      const imageHtml = slide.image
        ? `<img class="cat-card-img" src="${resolveImage(slide.image)}" alt="${slide.title || ""}">`
        : `<div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;color:#bbb;font-size:26px;">
             <i class="fa-solid fa-image"></i>
           </div>`;

      const titlePreview = (slide.title || "بدون عنوان").split("\n")[0];

      card.innerHTML = `
        ${imageHtml}
        <div class="cat-card-body">
          <strong>${titlePreview}</strong>
          <span style="color:#9aa1a8;font-size:12px;">ترتيب: ${slide.order || 0}</span>
          <div class="row-actions">
            <button class="icon-btn btn-edit" title="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn danger btn-delete" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector(".btn-edit").addEventListener("click", () => openEditHeroSlide(slide.id));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteHeroSlide(slide.id));

      elHero.grid.appendChild(card);
    });
  }

  function resetHeroSlideForm() {
    state.editingHeroSlideId = null;
    elHero.form.reset();
    elHero.id.value = "";
    elHero.order.value = "0";
    elHero.error.textContent = "";

    elHero.imagePreview.style.display = "none";
    elHero.imagePreview.src = "";
    elHero.videoThumbPreview.style.display = "none";
    elHero.videoThumbPreview.src = "";

    elHero.modalTitle.textContent = "إضافة سلايد";
  }

  function openEditHeroSlide(id) {
    const slide = state.heroSlides.find((s) => String(s.id) === String(id));
    if (!slide) return;

    state.editingHeroSlideId = id;

    elHero.id.value = id;
    elHero.label.value = slide.label || "";
    elHero.order.value = slide.order || 0;
    elHero.title.value = slide.title || "";
    elHero.description.value = slide.description || "";
    elHero.buttonText.value = slide.buttonText || "";
    elHero.buttonLink.value = slide.buttonLink || "";
    elHero.videoUrl.value = slide.videoUrl && slide.videoUrl.startsWith("/uploads/") ? "" : (slide.videoUrl || "");
    elHero.videoText.value = slide.videoText || "";
    elHero.error.textContent = "";

    if (slide.image) {
      elHero.imagePreview.src = resolveImage(slide.image);
      elHero.imagePreview.style.display = "block";
    } else {
      elHero.imagePreview.style.display = "none";
    }

    if (slide.videoThumbnail) {
      elHero.videoThumbPreview.src = resolveImage(slide.videoThumbnail);
      elHero.videoThumbPreview.style.display = "block";
    } else {
      elHero.videoThumbPreview.style.display = "none";
    }

    elHero.modalTitle.textContent = "تعديل سلايد";
    openModal(elHero.modal);
  }

  async function deleteHeroSlide(id) {
    if (!confirm("متأكد إنك عايز تحذف السلايد ده؟")) return;

    try {
      await apiRequest("/api/hero-slides/" + id, { method: "DELETE" });
      showToast("تم حذف السلايد");
      loadHeroSlides();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elHero.openAdd) {
    elHero.openAdd.addEventListener("click", function () {
      resetHeroSlideForm();
      openModal(elHero.modal);
    });
  }

  function bindHeroImagePreview(input, previewImg) {
    if (!input) return;
    input.addEventListener("change", function () {
      const file = input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  bindHeroImagePreview(elHero.image, elHero.imagePreview);
  bindHeroImagePreview(elHero.videoThumb, elHero.videoThumbPreview);

  if (elHero.form) {
    elHero.form.addEventListener("submit", async function (e) {
      e.preventDefault();

      elHero.error.textContent = "";

      const formData = new FormData();
      formData.append("label", elHero.label.value.trim());
      formData.append("order", elHero.order.value || "0");
      formData.append("title", elHero.title.value.trim());
      formData.append("description", elHero.description.value.trim());
      formData.append("buttonText", elHero.buttonText.value.trim());
      formData.append("buttonLink", elHero.buttonLink.value.trim());
      formData.append("videoText", elHero.videoText.value.trim());

      if (elHero.videoUrl.value.trim()) {
        formData.append("videoUrl", elHero.videoUrl.value.trim());
      }

      if (elHero.image.files[0]) {
        formData.append("image", elHero.image.files[0]);
      }

      if (elHero.videoThumb.files[0]) {
        formData.append("videoThumbnail", elHero.videoThumb.files[0]);
      }

      if (elHero.videoFile.files[0]) {
        formData.append("videoFile", elHero.videoFile.files[0]);
      }

      try {
        if (state.editingHeroSlideId) {
          await apiRequest("/api/hero-slides/" + state.editingHeroSlideId, {
            method: "PUT",
            body: formData,
            isFormData: true,
          });
          showToast("تم تعديل السلايد");
        } else {
          await apiRequest("/api/hero-slides", {
            method: "POST",
            body: formData,
            isFormData: true,
          });
          showToast("تم إضافة السلايد");
        }

        closeModal(elHero.modal);
        loadHeroSlides();
      } catch (err) {
        elHero.error.textContent = err.message;
      }
    });
  }

  /* =========================================================
     ORDERS
  ========================================================= */

  const ORDERS_PER_PAGE = 15;

  const elOrders = {
    tableBody: document.getElementById("ordersTableBody"),
    pagination: document.getElementById("ordersPagination"),
    searchInput: document.getElementById("ordersSearchInput"),
    statusFilter: document.getElementById("ordersStatusFilter"),

    modal: document.getElementById("orderModal"),
    modalTitle: document.getElementById("orderModalTitle"),
    detailsContent: document.getElementById("orderDetailsContent"),
  };

  state.orders = [];
  state.ordersTotalPages = 1;
  state.ordersCurrentPage = 1;
  state.ordersSearch = "";
  state.ordersStatus = "";

  const STATUS_LABELS = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    shipping: "جاري الشحن",
    completed: "مكتمل",
    cancelled: "ملغي",
  };

  const PAYMENT_LABELS = {
    cod: "الدفع عند الاستلام",
    vodafone_cash: "فودافون كاش",
    instapay: "إنستاباي",
  };

  let ordersSearchTimer;

  async function loadOrders(page) {
    page = page || 1;

    try {
      let query = "/api/orders?page=" + page + "&limit=" + ORDERS_PER_PAGE;

      if (state.ordersStatus) query += "&status=" + encodeURIComponent(state.ordersStatus);
      if (state.ordersSearch) query += "&search=" + encodeURIComponent(state.ordersSearch);

      const data = await apiRequest(query);

      state.orders = data.orders || data.data || [];
      state.ordersTotalPages = data.totalPages || 1;
      state.ordersCurrentPage = data.page || page;

      renderOrdersTable();
      renderOrdersPagination();
      updateOrdersBadge();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderOrdersTable() {
    if (!elOrders.tableBody) return;

    elOrders.tableBody.innerHTML = "";

    if (!state.orders.length) {
      elOrders.tableBody.innerHTML = `
        <tr><td colspan="8" class="empty-state">لا توجد طلبات حالياً</td></tr>
      `;
      return;
    }

    state.orders.forEach((order) => {
      const tr = document.createElement("tr");

      const statusLabel = STATUS_LABELS[order.status] || order.status;
      const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;

      tr.innerHTML = `
        <td>#${order.id}</td>
        <td>${order.customerName}</td>
        <td dir="ltr" style="text-align:right;">${order.phone}</td>
        <td>${Number(order.total).toFixed(0)} ج.م</td>
        <td>${paymentLabel}</td>
        <td><span class="badge badge-${order.status}">${statusLabel}</span></td>
        <td>${formatDate(order.createdAt)}</td>
        <td class="table-actions">
          <button class="btn-icon btn-view" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-icon btn-delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

      tr.querySelector(".btn-view").addEventListener("click", () => openOrderDetails(order.id));
      tr.querySelector(".btn-delete").addEventListener("click", () => deleteOrder(order.id));

      elOrders.tableBody.appendChild(tr);
    });
  }

  function renderOrdersPagination() {
    if (!elOrders.pagination) return;

    elOrders.pagination.innerHTML = "";

    if (state.ordersTotalPages <= 1) return;

    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.innerHTML = "‹";
    prev.disabled = state.ordersCurrentPage === 1;
    prev.addEventListener("click", () => loadOrders(state.ordersCurrentPage - 1));
    elOrders.pagination.appendChild(prev);

    for (let i = 1; i <= state.ordersTotalPages; i++) {
      const btn = document.createElement("button");
      btn.className = "page-btn" + (i === state.ordersCurrentPage ? " active" : "");
      btn.textContent = i;
      btn.addEventListener("click", () => loadOrders(i));
      elOrders.pagination.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "page-btn";
    next.innerHTML = "›";
    next.disabled = state.ordersCurrentPage === state.ordersTotalPages;
    next.addEventListener("click", () => loadOrders(state.ordersCurrentPage + 1));
    elOrders.pagination.appendChild(next);
  }

  async function openOrderDetails(id) {
    try {
      const data = await apiRequest("/api/orders/" + id);
      const order = data.order || data;

      const itemsHtml = (order.items || [])
        .map(
          (item) => `
          <div class="order-items-list-row">
            <span>${item.title} × ${item.qty}</span>
            <span>${(Number(item.price) * Number(item.qty)).toFixed(0)} ج.م</span>
          </div>
        `
        )
        .join("");

      elOrders.detailsContent.innerHTML = `
        <div class="order-details-section">
          <h4>بيانات العميل</h4>
          <div class="order-details-grid">
            <div><strong>الاسم</strong>${order.customerName}</div>
            <div><strong>التليفون</strong><span dir="ltr">${order.phone}</span></div>
            ${order.secondaryPhone ? `<div><strong>تليفون بديل</strong><span dir="ltr">${order.secondaryPhone}</span></div>` : ""}
            <div><strong>المدينة</strong>${order.city}</div>
            <div style="grid-column:1/-1;"><strong>العنوان</strong>${order.address}</div>
            ${order.notes ? `<div style="grid-column:1/-1;"><strong>ملاحظات</strong>${order.notes}</div>` : ""}
          </div>
        </div>

        <div class="order-details-section">
          <h4>الدفع</h4>
          <div class="order-details-grid">
            <div><strong>طريقة الدفع</strong>${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</div>
            ${order.paymentReference ? `<div><strong>رقم العملية</strong><span dir="ltr">${order.paymentReference}</span></div>` : ""}
          </div>
        </div>

        <div class="order-details-section">
          <h4>المنتجات</h4>
          <div class="order-items-list">
            ${itemsHtml}
            <div class="order-items-list-row" style="font-weight:800;">
              <span>الإجمالي</span>
              <span>${Number(order.total).toFixed(0)} ج.م</span>
            </div>
          </div>
        </div>

        <div class="order-details-section">
          <h4>حالة الطلب</h4>
          <div class="order-status-row">
            <select id="orderStatusSelect">
              ${Object.keys(STATUS_LABELS)
                .map(
                  (key) =>
                    `<option value="${key}" ${order.status === key ? "selected" : ""}>${STATUS_LABELS[key]}</option>`
                )
                .join("")}
            </select>
            <button type="button" class="btn-primary" id="saveOrderStatusBtn">
              <i class="fa-solid fa-check"></i> حفظ الحالة
            </button>
          </div>
        </div>
      `;

      document.getElementById("saveOrderStatusBtn").addEventListener("click", async () => {
        const newStatus = document.getElementById("orderStatusSelect").value;
        try {
          await apiRequest("/api/orders/" + order.id + "/status", {
            method: "PUT",
            body: { status: newStatus },
          });
          showToast("تم تحديث حالة الطلب");
          closeModal(elOrders.modal);
          loadOrders(state.ordersCurrentPage);
        } catch (err) {
          showToast(err.message, "error");
        }
      });

      elOrders.modalTitle.textContent = "تفاصيل الطلب #" + order.id;
      openModal(elOrders.modal);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function deleteOrder(id) {
    if (!confirm("متأكد إنك عايز تحذف الطلب ده؟")) return;

    try {
      await apiRequest("/api/orders/" + id, { method: "DELETE" });
      showToast("تم حذف الطلب");
      loadOrders(state.ordersCurrentPage);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (elOrders.searchInput) {
    elOrders.searchInput.addEventListener("input", function () {
      clearTimeout(ordersSearchTimer);
      ordersSearchTimer = setTimeout(() => {
        state.ordersSearch = elOrders.searchInput.value.trim();
        loadOrders(1);
      }, 350);
    });
  }

  if (elOrders.statusFilter) {
    elOrders.statusFilter.addEventListener("change", function () {
      state.ordersStatus = elOrders.statusFilter.value;
      loadOrders(1);
    });
  }

  /* =========================================================
     MODAL CLOSE (زر الإغلاق × + الضغط برّه المودال)
  ========================================================= */

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modalId = btn.getAttribute("data-close");
      closeModal(document.getElementById(modalId));
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.active").forEach((m) => closeModal(m));
    }
  });

  /* =========================================================
     INIT
  ========================================================= */

  if (getToken()) {
    showDashboard();
  } else {
    showLogin();
  }
})();