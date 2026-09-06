const { Order } = require("../models");
const { Op } = require("sequelize");
const { sendPushToAll } = require("../lib/push");

// GET /api/orders?page=1&limit=20&status=pending&search=...  (admin only)
async function getOrders(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;

    if (req.query.search) {
      const q = req.query.search;
      where[Op.or] = [
        { customerName: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.json({
      orders: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات" });
  }
}

// GET /api/orders/:id  (admin only)
async function getOrder(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الطلب" });
  }
}

// POST /api/orders  (عام - بيستخدمه العميل من صفحة checkout)
async function createOrder(req, res) {
  try {
    const {
      customerName,
      phone,
      secondaryPhone,
      address,
      city,
      notes,
      paymentMethod,
      paymentReference,
      items,
      shippingFee,
    } = req.body;

    if (!customerName || !phone || !address || !city) {
      return res
        .status(400)
        .json({ message: "الاسم والتليفون والعنوان والمدينة مطلوبين" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "السلة فارغة" });
    }

    const validPaymentMethods = ["cod", "vodafone_cash", "instapay"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "طريقة الدفع غير صحيحة" });
    }

    if (
      (paymentMethod === "vodafone_cash" || paymentMethod === "instapay") &&
      !paymentReference
    ) {
      return res
        .status(400)
        .json({ message: "رقم العملية مطلوب لهذه الطريقة" });
    }

    // إعادة حساب الإجمالي على السيرفر
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + price * qty;
    }, 0);

    const fee = Number(shippingFee) || 0;
    const total = subtotal + fee;

    const order = await Order.create({
      customerName,
      phone,
      secondaryPhone: secondaryPhone || null,
      address,
      city,
      notes: notes || null,
      paymentMethod,
      paymentReference: paymentReference || null,
      items,
      subtotal,
      shippingFee: fee,
      total,
      status: "pending",
    });

    // إرسال إشعار Push فورًا لكل الأدمنز المشتركين
    // (ماخدناش await عشان مانأخرش الرد على العميل لو حصل تأخير في الإرسال)
    sendPushToAll({
      title: "🔔 طلب جديد وصل!",
      body: `${customerName} — ${total.toFixed(0)} ج.م`,
      orderId: order.id,
    }).catch((err) => console.error("Push error:", err));

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الطلب" });
  }
}

// PUT /api/orders/:id/status  (admin only)
async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "shipping",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "حالة غير صحيحة" });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    order.status = status;
    await order.save();

    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء تعديل حالة الطلب" });
  }
}

// DELETE /api/orders/:id  (admin only)
async function deleteOrder(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    await order.destroy();

    res.json({ message: "تم حذف الطلب بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء حذف الطلب" });
  }
}

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};