

"use strict";

const pool = require("../../config/database");

const getAllRegistrations = async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();

        const [registrations] = await connection.query(`
            SELECT
                r.id,
                r.registration_number,
                r.competition_id,
                r.competition_category_id,
                r.first_name,
                r.last_name,
                r.phone,
                r.email,
                r.date_of_birth,
                r.gender,
                r.club_name,
                r.experience_level,
                r.sport,
                r.discipline,
                r.age_category,
                r.weight_category,
                r.registration_fee,
                r.status,
                r.created_at,

                c.name AS competition_name,
                c.sport AS competition_sport,
                c.start_date AS competition_start_date,
                c.city AS competition_city,

                cc.sport AS category_sport,
                cc.discipline AS category_discipline,
                cc.gender AS category_gender,
                cc.age_category AS category_age,
                cc.weight_category AS category_weight

            FROM registrations r

            LEFT JOIN competitions c
                ON c.id = r.competition_id

            LEFT JOIN competition_categories cc
                ON cc.id = r.competition_category_id

            ORDER BY r.id DESC
        `);

        return res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });

    } catch (error) {
        console.error("Get all registrations error:", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les inscriptions."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    
    getAllRegistrations
};
