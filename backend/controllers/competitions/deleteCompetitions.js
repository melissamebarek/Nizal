const pool = require("../../config/database");

const deleteCompetition = async (req, res) => {
    try {
        const { id } = req.params;

        /* =========================
           CHECK COMPETITION
        ========================= */

        const [competitions] = await pool.query(
            "SELECT id FROM competitions WHERE id = ?",
            [id]
        );

        if (competitions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Competition not found"
            });
        }

        /* =========================
           DELETE
        ========================= */

        await pool.query(
            "DELETE FROM competitions WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Competition deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete competition error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete competition"
        });
    }
};

module.exports = deleteCompetition;