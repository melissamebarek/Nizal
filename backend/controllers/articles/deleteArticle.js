const pool = require("../../config/database");

const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            "DELETE FROM articles WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        res.json({
            success: true,
            message: "Article deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete article"
        });
    }
};

module.exports = deleteArticle;