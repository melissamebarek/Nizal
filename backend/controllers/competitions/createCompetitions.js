const pool = require("../../config/database");

const createCompetition = async (req, res) => {
    const connection = await pool.getConnection();

    try {
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

        await connection.beginTransaction();

        /* =========================
           CREATE COMPETITION
        ========================= */

        const [competitionResult] = await connection.query(
            `INSERT INTO competitions
            (
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
                eligibility
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                eligibility || null
            ]
        );

        const competitionId =
            competitionResult.insertId;

        /* =========================
           CREATE CATEGORIES
        ========================= */

        if (Array.isArray(categories)) {

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
                        competitionId,
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
           CREATE DOCUMENTS
        ========================= */

        if (Array.isArray(documents)) {

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
                        competitionId,
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

        res.status(201).json({
            success: true,
            message: "Competition created successfully",
            data: {
                id: competitionId,
                name,
                sport,
                start_date
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Create competition error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create competition"
        });

    } finally {
        connection.release();
    }
};

module.exports = createCompetition;