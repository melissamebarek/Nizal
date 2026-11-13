const pool = require("../../config/database");

const publishArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `UPDATE articles
             SET status = 'published',
                 published_at = NOW()
             WHERE id = ?`,
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
            message: "Article published successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to publish article"
        });
    }
};

module.exports = publishArticle;