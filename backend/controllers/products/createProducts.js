const pool = require("../../config/database");

const createProduct = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            name,
            category,
            description,
            price,
            discount,
            images,
            variants
        } = req.body;

        /* =========================
           VALIDATION
        ========================= */

        if (!name || !category || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, category and price are required"
            });
        }

        /* =========================
           START TRANSACTION
        ========================= */

        await connection.beginTransaction();

        /* =========================
           CREATE PRODUCT
        ========================= */

        const [productResult] = await connection.query(
            `INSERT INTO products
            (
                name,
                category,
                description,
                price,
                discount
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                name,
                category,
                description || null,
                Number(price),
                Number(discount) || 0
            ]
        );

        const productId =
            productResult.insertId;


        /* =========================
           CREATE IMAGES
        ========================= */

        if (Array.isArray(images)) {

            for (let i = 0; i < images.length; i++) {

                const image = images[i];

                if (!image || !image.image_url) {
                    continue;
                }

                await connection.query(
                    `INSERT INTO product_images
                    (
                        product_id,
                        image_url,
                        is_main
                    )
                    VALUES (?, ?, ?)`,
                    [
                        productId,
                        image.image_url,
                        image.is_main ? 1 : 0
                    ]
                );
            }
        }


        /* =========================
           CREATE VARIANTS
        ========================= */

        if (Array.isArray(variants)) {

            for (const variant of variants) {

                if (!variant) {
                    continue;
                }

                await connection.query(
                    `INSERT INTO product_variants
                    (
                        product_id,
                        color,
                        size,
                        stock
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        productId,
                        variant.color || null,
                        variant.size || null,
                        Number(variant.stock) || 0
                    ]
                );
            }
        }


        /* =========================
           COMMIT
        ========================= */

        await connection.commit();


        /* =========================
           SUCCESS
        ========================= */

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: {
                id: productId,
                name,
                category,
                description: description || null,
                price: Number(price),
                discount: Number(discount) || 0
            }
        });

    } catch (error) {

        /* =========================
           ROLLBACK
        ========================= */

        await connection.rollback();

        console.error(
            "Create product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });

    } finally {

        connection.release();

    }
};

module.exports = createProduct;