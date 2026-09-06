const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const WorkSectionImage = sequelize.define(
    "WorkSectionImage",
    {

        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },


        sectionId: {
            type: DataTypes.UUID,
            allowNull: false
        },


        image: {
            type: DataTypes.STRING(1000),
            allowNull: false
        },


        title: {
            type: DataTypes.STRING(250),
            allowNull: true
        },


        alt: {
            type: DataTypes.STRING(300),
            allowNull: true
        },


        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }

    },
    {
        tableName: "work_section_images",

        timestamps: true
    }
);


module.exports = WorkSectionImage;