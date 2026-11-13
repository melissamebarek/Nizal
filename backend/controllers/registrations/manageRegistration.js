
"use strict";

"use strict";

const path = require("path");
const pool = require("../../config/database");
const {
    sendRegistrationDecision
} = require("../../config/mailer");
const registrationUploadsDirectory = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "registrations"
);

const ALLOWED_STATUSES = [
    "accepted",
    "rejected",
    "cancelled",
    "under_review"
];

function sendError(res, status, message) {
    return res.status(status).json({
        success: false,
        message
    });
}

// GET /api/registrations/:id
async function getRegistrationById(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return sendError(res, 400, "ID d'inscription invalide.");
        }

        const [rows] = await pool.query(
            `SELECT
                r.*,
                c.name AS competition_name,
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
             WHERE r.id = ?
             LIMIT 1`,
            [id]
        );

        if (!rows.length) {
            return sendError(res, 404, "Inscription introuvable.");
        }

        const [documents] = await pool.query(
            `SELECT id, file_url, file_name, status, uploaded_at
             FROM registration_documents
             WHERE registration_id = ?
             ORDER BY uploaded_at ASC`,
            [id]
        );

        return res.json({
            success: true,
            data: {
                ...rows[0],
                documents
            }
        });
    } catch (error) {
        console.error("getRegistrationById:", error);
        return sendError(
            res,
            500,
            "Erreur lors du chargement de l'inscription."
        );
    }
}

// GET /api/registrations/:id/documents/:documentId
async function getRegistrationDocument(req, res) {
    try {
        const registrationId = Number(req.params.id);
        const documentId = Number(req.params.documentId);

        if (
            !Number.isInteger(registrationId) ||
            registrationId < 1 ||
            !Number.isInteger(documentId) ||
            documentId < 1
        ) {
            return sendError(res, 400, "Identifiant de document invalide.");
        }

        const [rows] = await pool.query(
            `SELECT file_url, file_name
             FROM registration_documents
             WHERE id = ? AND registration_id = ?
             LIMIT 1`,
            [documentId, registrationId]
        );

        if (!rows.length) {
            return sendError(res, 404, "Document introuvable.");
        }

        const filename = path.basename(
            String(rows[0].file_url || "").replace(/\\/g, "/")
        );
        const extension = path.extname(filename).toLowerCase();
        const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

        if (!filename || !allowedExtensions.has(extension)) {
            console.error("getRegistrationDocument: invalid stored file path");
            return sendError(res, 500, "Le fichier du document est invalide.");
        }

        res.type(extension);
        res.set(
            "Content-Disposition",
            `${req.query.download === "1" ? "attachment" : "inline"}; filename="${filename}"`
        );

        return res.sendFile(
            filename,
            { root: registrationUploadsDirectory },
            error => {
                if (!error) return;
                if (res.headersSent) {
                    console.error("getRegistrationDocument:", error);
                    return;
                }

                if (error.code === "ENOENT") {
                    return sendError(res, 404, "Le fichier du document est introuvable.");
                }

                console.error("getRegistrationDocument:", error);
                return sendError(res, 500, "Impossible d'afficher le document.");
            }
        );
    } catch (error) {
        console.error("getRegistrationDocument:", error);
        return sendError(res, 500, "Impossible de charger le document.");
    }
}

// PATCH /api/registrations/:id/status
// Body: { "status": "accepted" }
// Body for rejection: { "status": "rejected", "reason": "..." }

async function updateRegistrationStatus(req, res) {
    let connection;

    try {
        const id = Number(req.params.id);
        const { status, reason } = req.body;

        if (!Number.isInteger(id) || id < 1) {
            return sendError(res, 400, "ID d'inscription invalide.");
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return sendError(res, 400, "Statut invalide.");
        }

        const rejectionReason = String(reason || "").trim();

        if (status === "rejected" && !rejectionReason) {
            return sendError(
                res,
                400,
                "Le motif du refus est obligatoire."
            );
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Get registration and competition information.
        const [rows] = await connection.query(
            `SELECT
                r.*,
                c.name AS competition_name
             FROM registrations r
             LEFT JOIN competitions c
                ON c.id = r.competition_id
             WHERE r.id = ?
             LIMIT 1
             FOR UPDATE`,
            [id]
        );

        if (!rows.length) {
            await connection.rollback();

            return sendError(
                res,
                404,
                "Inscription introuvable."
            );
        }

        const registration = rows[0];
        const oldStatus = registration.status;

        // Update the registration status.
        await connection.query(
            `UPDATE registrations
             SET status = ?,
                 rejection_reason = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                status,
                status === "rejected" ? rejectionReason : null,
                id
            ]
        );

        // Save the status change in history.
        await connection.query(
            `INSERT INTO registration_history
                (registration_id, old_status, new_status, comment)
             VALUES (?, ?, ?, ?)`,
            [
                id,
                oldStatus,
                status,
                status === "rejected" ? rejectionReason : null
            ]
        );

        // Commit before sending the email.
        await connection.commit();

        let emailSent = false;
        let emailError = null;

        // Send an email only for acceptance or rejection.
        if (status === "accepted" || status === "rejected") {
            try {
                // Adapt these fields if your database uses
                // different column names for participant details.
                const participantName =
                    registration.full_name ||
                    [
                        registration.first_name,
                        registration.last_name
                    ].filter(Boolean).join(" ") ||
                    "Participant";

                if (!registration.email) {
                    throw new Error(
                        "Aucune adresse email pour cette inscription."
                    );
                }

                await sendRegistrationDecision({
                    to: registration.email,
                    participantName,
                    competitionName:
                        registration.competition_name ||
                        "la compétition",
                    status,
                    reason: rejectionReason
                });

                emailSent = true;
            } catch (error) {
                emailError = error.message;

                console.error(
                    "Registration decision email failed:",
                    error
                );
            }
        }

        return res.json({
            success: true,
            message:
                status === "accepted"
                    ? "Inscription acceptée."
                    : status === "rejected"
                        ? "Inscription refusée."
                        : "Statut de l'inscription mis à jour.",
            data: {
                id,
                old_status: oldStatus,
                status,
                rejection_reason:
                    status === "rejected"
                        ? rejectionReason
                        : null,
                email_sent: emailSent,
                email_error: emailError
            }
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Registration rollback failed:",
                    rollbackError
                );
            }
        }

        console.error("updateRegistrationStatus:", error);

        return sendError(
            res,
            500,
            "Impossible de modifier le statut."
        );

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// PATCH /api/registrations/:id/request-info
// Body: { "message": "Merci de fournir un certificat médical lisible." }
async function requestRegistrationInfo(req, res) {
    const connection = await pool.getConnection();

    try {
        const id = Number(req.params.id);
        const message = String(req.body.message || "").trim();

        if (!Number.isInteger(id) || id < 1) {
            return sendError(res, 400, "ID d'inscription invalide.");
        }

        if (!message) {
            return sendError(res, 400, "Veuillez préciser les informations demandées.");
        }

        await connection.beginTransaction();

        const [rows] = await connection.query(
            "SELECT id, status FROM registrations WHERE id = ? FOR UPDATE",
            [id]
        );

        if (!rows.length) {
            await connection.rollback();
            return sendError(res, 404, "Inscription introuvable.");
        }

        const oldStatus = rows[0].status;

        await connection.query(
            `UPDATE registrations
             SET status = 'under_review',
                 additional_info_request = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [message, id]
        );

        await connection.query(
            `INSERT INTO registration_history
                (registration_id, old_status, new_status, comment)
             VALUES (?, ?, ?, ?)`,
            [id, oldStatus, "under_review", message]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Demande d'informations enregistrée.",
            data: {
                id,
                status: "under_review",
                additional_info_request: message
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error("requestRegistrationInfo:", error);
        return sendError(res, 500, "Impossible d'enregistrer la demande.");
    } finally {
        connection.release();
    }
}

// GET /api/registrations/:id/history
async function getRegistrationHistory(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return sendError(res, 400, "ID d'inscription invalide.");
        }

        const [registration] = await pool.query(
            "SELECT id FROM registrations WHERE id = ?",
            [id]
        );

        if (!registration.length) {
            return sendError(res, 404, "Inscription introuvable.");
        }

        const [history] = await pool.query(
            `SELECT id, old_status, new_status, comment, created_at
             FROM registration_history
             WHERE registration_id = ?
             ORDER BY created_at ASC, id ASC`,
            [id]
        );

        return res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error("getRegistrationHistory:", error);
        return sendError(res, 500, "Impossible de charger l'historique.");
    }
}

module.exports = {
    getRegistrationById,
    getRegistrationDocument,
    updateRegistrationStatus,
    requestRegistrationInfo,
    getRegistrationHistory
};
