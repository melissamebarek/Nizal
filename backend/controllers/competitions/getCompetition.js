const pool = require("../../config/database");

const getCompetitionById = async (req, res) => {
    try {
        const { id } = req.params;

        /* =========================
           GET COMPETITION
        ========================= */

        const [competitions] = await pool.query(
            `SELECT *
             FROM competitions
             WHERE id = ?`,
            [id]
        );

        if (competitions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Competition not found"
            });
        }

        const competition = competitions[0];

        /* =========================
           GET CATEGORIES
        ========================= */

        const [categories] = await pool.query(
            `SELECT *
             FROM competition_categories
             WHERE competition_id = ?
             ORDER BY id ASC`,
            [id]
        );

        /* =========================
           GET DOCUMENTS
        ========================= */

        const [documents] = await pool.query(
            `SELECT *
             FROM competition_documents
             WHERE competition_id = ?
             ORDER BY id ASC`,
            [id]
        );

        const [registrationCounts] = await pool.query(
            `SELECT COUNT(*) AS registration_count
             FROM registrations
             WHERE competition_id = ?`,
            [id]
        );

        /* =========================
           RESPONSE
        ========================= */

        res.json({
            success: true,
            data: {
                ...competition,
                categories,
                documents,
                registration_count: registrationCounts[0].registration_count
            }
        });

    } catch (error) {
        console.error(
            "Get competition error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch competition"
        });
    }
};

module.exports = getCompetitionById;