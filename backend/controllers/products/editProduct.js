const pool = require("../../config/database");

const updateProduct = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

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
           CHECK PRODUCT
        ========================= */

        const [existingProduct] = await connection.query(
            "SELECT id FROM products WHERE id = ?",
            [id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await connection.beginTransaction();

        /* =========================
           UPDATE PRODUCT
        ========================= */

        await connection.query(
            `UPDATE products
             SET
                name = ?,
                category = ?,
                description = ?,
                price = ?,
                discount = ?
             WHERE id = ?`,
            [
                name,
                category,
                description || null,
                Number(price),
                Number(discount) || 0,
                id
            ]
        );

        /* =========================
           UPDATE IMAGES
        ========================= */

        if (Array.isArray(images)) {

            await connection.query(
                "DELETE FROM product_images WHERE product_id = ?",
                [id]
            );

            for (const image of images) {

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
                        id,
                        image.image_url,
                        image.is_main ? 1 : 0
                    ]
                );
            }
        }

        /* =========================
           UPDATE VARIANTS
        ========================= */

        if (Array.isArray(variants)) {

            await connection.query(
                "DELETE FROM product_variants WHERE product_id = ?",
                [id]
            );

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
                        id,
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

        res.json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Update product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });

    } finally {

        connection.release();
    }
};

module.exports = updateProduct;