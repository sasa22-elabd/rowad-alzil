/* =========================================================
   رواد الظل | seedServices.js
   بيضيف الخدمات الـ 5 القديمة (اللي كانت هاردكودد في الصفحة)
   جوه الداتابيز عشان تظهر في لوحة التحكم وتقدر تعدّل فيها.

   طريقة التشغيل (مرة واحدة بس):
     node seedServices.js
========================================================= */

const { sequelize, Service } = require("./models");

const oldServices = [
  {
    title: "أنظمة التظليل الحديثة",
    description:
      "تركيب وتصنيع الشماسي التجارية والمنزلية بتصميمات هندسية مبتكرة توفر الحماية القصوى والأناقة.",
    tag: "الشماسي",
    image:
      "https://images.unsplash.com/photo-1590496793929-36417d3117b3?auto=format&fit=crop&w=900&q=85",
    order: 1,
  },
  {
    title: "السواتر القماشية والإنشائية",
    description:
      "حلول عصرية وعملية لتأمين الخصوصية وتغطية المساحات باستخدام خامات عالية الجودة ومقاومة للعوامل الجوية.",
    tag: "السواتر",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=85",
    order: 2,
  },
  {
    title: "الأثاث المعدني العصري",
    description:
      "تصاميم مخصصة للأثاث المعدني الداخلي والخارجي تجمع بين قوة التحمل ورقي المظهر.",
    tag: "أثاث معدني",
    image:
      "https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=900&q=85",
    order: 3,
  },
  {
    title: "أعمال الكريتال والفورجيه",
    description:
      "نضع لمسة فنية فريدة عبر أعمال المشغولات المعدنية المشكلة يدوياً وآلياً لنضيف طابعاً فخماً على واجهات ومداخل المباني.",
    tag: "كريتال وفورجيه",
    image:
      "https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=900&q=85",
    order: 4,
  },
  {
    title: "قسم المنشآت المعدنية",
    description:
      "نبتكر وننفذ أضخم الهياكل المعدنية والإنشائية بأعلى معايير الدقة الهندسية والسلامة، مثل الهياكل الحديدية للأسقف والمستودعات والمنشآت التجارية والصناعية.",
    tag: "الهياكل المعدنية",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=85",
    order: 5,
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ متصل بالداتابيز");

    for (const service of oldServices) {
      const existing = await Service.findOne({ where: { title: service.title } });

      if (existing) {
        console.log(`⏭️  موجودة بالفعل: ${service.title}`);
        continue;
      }

      await Service.create(service);
      console.log(`✅ تمت إضافة: ${service.title}`);
    }

    console.log("🎉 تم الانتهاء من إضافة الخدمات القديمة");
    process.exit(0);
  } catch (err) {
    console.error("❌ حصل خطأ أثناء الإضافة:");
    console.error(err);
    process.exit(1);
  }
}

seed();