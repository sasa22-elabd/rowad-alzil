const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

const WorkSection = sequelize.define(
  "WorkSection",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: true,
    },

    shortDescription: {
      type: DataTypes.STRING(600),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "work_sections",
    timestamps: true,
  }
);

module.exports = WorkSection;