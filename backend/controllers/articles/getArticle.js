const pool = require("../../config/database");

const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;

        const [articles] = await pool.query(
            "SELECT * FROM articles WHERE id = ?",
            [id]
        );

        if (articles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        res.json({
            success: true,
            data: articles[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch article"
        });
    }
};

module.exports = getArticleById;