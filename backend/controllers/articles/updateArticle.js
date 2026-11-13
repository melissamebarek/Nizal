const pool = require("../../config/database");

const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;

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

        let publishedAt = null;

        if (status === "published") {
            publishedAt = new Date();
        }

        const [result] = await pool.query(
            `UPDATE articles
             SET title = ?,
                 category = ?,
                 cover_image = ?,
                 content = ?,
                 status = ?,
                 published_at = ?
             WHERE id = ?`,
            [
                title,
                category,
                cover_image || null,
                content,
                status || "draft",
                publishedAt,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        res.json({
            success: true,
            message: "Article updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update article"
        });
    }
};

module.exports = updateArticle;