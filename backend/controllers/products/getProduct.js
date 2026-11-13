const pool = require("../../config/database");

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product = products[0];

        const [images] = await pool.query(
            `SELECT id, image_url, is_main
             FROM product_images
             WHERE product_id = ?
             ORDER BY is_main DESC, id ASC`,
            [id]
        );

        const [variants] = await pool.query(
            `SELECT id, color, size, stock
             FROM product_variants
             WHERE product_id = ?
             ORDER BY id ASC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...product,
                images,
                variants
            }
        });

    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};

module.exports = getProductById;