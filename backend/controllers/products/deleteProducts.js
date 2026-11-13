const pool = require("../../config/database");

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        /* =========================
           CHECK PRODUCT
        ========================= */

        const [products] = await pool.query(
            "SELECT id FROM products WHERE id = ?",
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        /* =========================
           DELETE PRODUCT
        ========================= */

        await pool.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
};

module.exports = deleteProduct;