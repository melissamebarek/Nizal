const pool = require("../../config/database");

const getCompetitions = async (req, res) => {
    try {
        const [competitions] = await pool.query(
            `SELECT
                competitions.*,
                COALESCE(registration_counts.registration_count, 0) AS registration_count
             FROM competitions
             LEFT JOIN (
                SELECT competition_id, COUNT(*) AS registration_count
                FROM registrations
                GROUP BY competition_id
             ) AS registration_counts
                ON registration_counts.competition_id = competitions.id
             ORDER BY start_date ASC, start_time ASC`
        );

        res.json({
            success: true,
            data: competitions
        });

    } catch (error) {
        console.error("Get competitions error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch competitions"
        });
    }
};

module.exports = getCompetitions;