const pool = require("../../config/database");

const getArticles = async (req, res) => {
    try {
        const [articles] = await pool.query(
            "SELECT * FROM articles ORDER BY created_at DESC"
        );

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch articles"
        });
    }
};

module.exports = getArticles;