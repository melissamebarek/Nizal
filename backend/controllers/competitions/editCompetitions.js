const pool = require("../../config/database");

const updateCompetition = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

        const {
            name,
            description,
            sport,
            discipline,
            location,
            city,
            start_date,
            start_time,
            end_time,
            organizer,
            cover_image,
            opening_date,
            closing_date,
            registration_fee,
            max_participants,
            eligibility,
            categories,
            documents
        } = req.body;

        /* =========================
           VALIDATION
        ========================= */

        if (!name || !sport || !start_date) {
            return res.status(400).json({
                success: false,
                message: "Name, sport and start date are required"
            });
        }

        /* =========================
           CHECK COMPETITION
        ========================= */

        const [existing] = await connection.query(
            "SELECT id FROM competitions WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Competition not found"
            });
        }

        await connection.beginTransaction();

        /* =========================
           UPDATE COMPETITION
        ========================= */

        await connection.query(
            `UPDATE competitions
             SET
                name = ?,
                description = ?,
                sport = ?,
                discipline = ?,
                location = ?,
                city = ?,
                start_date = ?,
                start_time = ?,
                end_time = ?,
                organizer = ?,
                cover_image = ?,
                opening_date = ?,
                closing_date = ?,
                registration_fee = ?,
                max_participants = ?,
                eligibility = ?
             WHERE id = ?`,
            [
                name,
                description || null,
                sport,
                discipline || null,
                location || null,
                city || null,
                start_date,
                start_time || null,
                end_time || null,
                organizer || null,
                cover_image || null,
                opening_date || null,
                closing_date || null,
                Number(registration_fee) || 0,
                max_participants
                    ? Number(max_participants)
                    : null,
                eligibility || null,
                id
            ]
        );

        /* =========================
           UPDATE CATEGORIES
        ========================= */

        if (Array.isArray(categories)) {

            await connection.query(
                `DELETE FROM competition_categories
                 WHERE competition_id = ?`,
                [id]
            );

            for (const category of categories) {

                if (!category) {
                    continue;
                }

                await connection.query(
                    `INSERT INTO competition_categories
                    (
                        competition_id,
                        sport,
                        discipline,
                        gender,
                        age_category,
                        weight_category
                    )
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        category.sport || sport,
                        category.discipline || null,
                        category.gender || null,
                        category.age_category || null,
                        category.weight_category || null
                    ]
                );
            }
        }

        /* =========================
           UPDATE DOCUMENTS
        ========================= */

        if (Array.isArray(documents)) {

            await connection.query(
                `DELETE FROM competition_documents
                 WHERE competition_id = ?`,
                [id]
            );

            for (const document of documents) {

                if (!document || !document.name) {
                    continue;
                }

                await connection.query(
                    `INSERT INTO competition_documents
                    (
                        competition_id,
                        name,
                        description,
                        is_required,
                        accepted_formats,
                        max_file_size
                    )
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        document.name,
                        document.description || null,
                        document.is_required !== false ? 1 : 0,
                        document.accepted_formats || null,
                        document.max_file_size
                            ? Number(document.max_file_size)
                            : null
                    ]
                );
            }
        }

        /* =========================
           COMMIT
        ========================= */

        await connection.commit();

        res.json({
            success: true,
            message: "Competition updated successfully"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Update competition error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update competition"
        });

    } finally {
        connection.release();
    }
};

module.exports = updateCompetition;