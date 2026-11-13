const pool = require("../../config/database");

const getProducts = async (req, res) => {
    try {
        const [products] = await pool.query(
            "SELECT p.*, ( SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.created_at ASC, pi.id ASC LIMIT 1 ) AS cover_image FROM products p ORDER BY p.id DESC;"
        );

        

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};

module.exports = getProducts;