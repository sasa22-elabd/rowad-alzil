module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define("Setting", {
    siteName: DataTypes.STRING,
    siteNameEn: DataTypes.STRING,
    phone: DataTypes.STRING,
    phoneIntl: DataTypes.STRING,
    whatsapp: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.STRING,
    facebook: DataTypes.STRING,
    instagram: DataTypes.STRING,
    twitter: DataTypes.STRING,
    linkedin: DataTypes.STRING,
    logo: DataTypes.STRING,
    logoExternal: DataTypes.STRING, // ⬅️ جديد: Favicon + صورة المشاركة
  });

  return Setting;
};