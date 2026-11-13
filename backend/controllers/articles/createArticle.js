const pool = require("../../config/database");

const createArticle = async (req, res) => {
    try {
        const {
            title,
            category,
            cover_image,
            content,
            status
        } = req.body;

        if (!title || !category || !content) {
            return res.status(400).json({
                success: false,
                message: "Title, category and content are required"
            });
        }

        const articleStatus = status || "draft";

        const publishedAt =
            articleStatus === "published"
                ? new Date()
                : null;

        const [result] = await pool.query(
            `INSERT INTO articles
            (title, category, cover_image, content, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                title,
                category,
                cover_image || null,
                content,
                articleStatus,
                publishedAt
            ]
        );

        res.status(201).json({
            success: true,
            message: "Article created successfully",
            data: {
                id: result.insertId,
                title,
                category,
                cover_image: cover_image || null,
                content,
                status: articleStatus,
                published_at: publishedAt
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create article"
        });
    }
};

module.exports = createArticle;