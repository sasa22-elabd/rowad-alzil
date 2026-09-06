module.exports = (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define("PushSubscription", {
    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    p256dh: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    auth: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return PushSubscription;
};