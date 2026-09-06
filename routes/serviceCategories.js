const express = require("express");
const router = express.Router();

const {
    ServiceCategory,
    ServiceImage
} = require("../models");


/*
|--------------------------------------------------------------------------
| GET ALL ACTIVE CATEGORIES
|--------------------------------------------------------------------------
*/

router.get("/categories", async (req, res) => {

    try {

        const categories = await ServiceCategory.findAll({

            where: {
                isActive: true
            },

            order: [
                ["sortOrder", "ASC"],
                ["createdAt", "ASC"]
            ]

        });

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء تحميل الأقسام"
        });

    }

});


/*
|--------------------------------------------------------------------------
| GET SINGLE CATEGORY + GALLERY
|--------------------------------------------------------------------------
*/

router.get("/categories/:slug", async (req, res) => {

    try {

        const category = await ServiceCategory.findOne({

            where: {
                slug: req.params.slug,
                isActive: true
            },

            include: [{
                model: ServiceImage,
                as: "images"
            }]

        });

        if (!category) {

            return res.status(404).json({
                success: false,
                message: "القسم غير موجود"
            });

        }

        res.json({
            success: true,
            data: category
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "حدث خطأ"
        });

    }

});


module.exports = router;