module.exports = (sequelize, DataTypes) => {
  const HeroSlide = sequelize.define(
    "HeroSlide",
    {
      // ترتيب الظهور — رقم أصغر يظهر الأول
      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      // خلفية السلايد
      image: { type: DataTypes.STRING, allowNull: true },

      // النصوص
      label: { type: DataTypes.STRING, allowNull: true }, // مثال: اقرأ المزيد
      title: { type: DataTypes.TEXT, allowNull: true }, // ممكن يحتوي \n لسطر جديد
      description: { type: DataTypes.TEXT, allowNull: true },

      // زرار الـ CTA
      buttonText: { type: DataTypes.STRING, allowNull: true },
      buttonLink: { type: DataTypes.STRING, allowNull: true },

      // كارت الفيديو
      videoThumbnail: { type: DataTypes.STRING, allowNull: true },
      videoUrl: { type: DataTypes.STRING, allowNull: true }, // رابط mp4 (مرفوع أو خارجي)
      videoText: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "hero_slides",
      timestamps: true,
    }
  );

  return HeroSlide;
};