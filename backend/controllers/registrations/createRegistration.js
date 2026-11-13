
"use strict";

const pool = require("../../config/database");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

function generateRegistrationNumber() {
    return `REG-${Date.now()}-${crypto.randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;
}

function getValue(object, ...keys) {
    for (const key of keys) {
        if (object?.[key] !== undefined && object?.[key] !== null) {
            return object[key];
        }
    }
    return null;
}

function getText(object, ...keys) {
    const value = getValue(object, ...keys);
    return typeof value === "string" ? value.trim() : "";
}

function positiveId(value) {
    const number = Number(value);

    return Number.isSafeInteger(number) && number > 0
        ? number
        : null;
}

async function removeUploadedFiles(files = []) {
    await Promise.all(files.map(async file => {
        if (!file.path) return;

        try {
            await fs.unlink(file.path);
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.error("File cleanup error:", error);
            }
        }
    }));
}

function parseRegistration(body) {
    let registration = body?.registration;

    if (typeof registration === "string") {
        try {
            registration = JSON.parse(registration);
        } catch {
            return null;
        }
    }

    if (!registration || typeof registration !== "object") {
        return null;
    }

    return registration;
}

function getDocumentKeys(body) {
    let keys = body?.documentKeys ?? body?.["documentKeys[]"] ?? [];

    if (!Array.isArray(keys)) {
        keys = [keys];
    }

    return keys.map(value => String(value).trim()).filter(Boolean);
}

function getPhone(step1) {
    const value = getValue(step1, "phone", "telephone");

    if (typeof value === "string") {
        return value.trim();
    }

    if (value && typeof value === "object") {
        return `${value.countryCode || ""}${value.phone || ""}`.trim();
    }

    const countryCode = getText(step1, "countryCode", "country_code");
    const localPhone = getText(step1, "phoneNumber", "phone_number");

    return `${countryCode}${localPhone}`.trim();
}

function getCategoryId(step3) {
    return positiveId(getValue(
        step3,
        "competitionCategoryId",
        "competition_category_id",
        "categoryId",
        "category_id"
    ));
}

const createRegistration = async (req, res) => {
    let connection;
    let transactionStarted = false;
    let registrationSaved = false;

    const files = Array.isArray(req.files) ? req.files : [];

    try {
        // 1. Parse registration JSON.
        const registration = parseRegistration(req.body);

        if (!registration) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Les données d'inscription sont absentes ou invalides."
            });
        }

        const {
            competitionId,
            step1 = {},
            step2 = {},
            step3 = {},
            termsAccepted
        } = registration;

        const competitionID = positiveId(competitionId);

        if (!competitionID) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Identifiant de compétition invalide."
            });
        }

        // 2. Validate personal information.
        const firstName = getText(step1, "firstName", "first_name");
        const lastName = getText(step1, "lastName", "last_name");
        const email = getText(step1, "email").toLowerCase();
        const phone = getPhone(step1);

        if (!firstName || !lastName || !email || !phone) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Veuillez remplir toutes les informations personnelles."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Adresse e-mail invalide."
            });
        }

        if (termsAccepted !== true) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Vous devez accepter les conditions d'inscription."
            });
        }

        // 3. Read profile and category information.
        const dateOfBirth = getText(
            step1,
            "dateOfBirth",
            "birthDate",
            "date_of_birth",
            "dob"
        ) || null;

        const gender =
            getText(step2, "gender") ||
            getText(step3, "gender") ||
            getText(step1, "gender") ||
            null;

        const clubName = getText(
            step2,
            "clubName",
            "club_name"
        ) || null;

        const experienceLevel = getText(
            step2,
            "experienceLevel",
            "experience_level",
            "experience"
        ) || null;

        const sport =
            getText(step2, "sport") ||
            getText(step3, "sport");

        const discipline =
            getText(step2, "discipline") ||
            getText(step3, "discipline");

        const ageCategory = getText(
            step3,
            "ageCategory",
            "age_category"
        );

        const weightCategory = getText(
            step3,
            "weightCategory",
            "weight_category"
        );

        const categoryId = getCategoryId(step3);

        if (!sport || !ageCategory || !weightCategory || !categoryId) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message:
                    "Les informations du sport, de la catégorie d'âge et du poids sont obligatoires."
            });
        }

        if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Date de naissance invalide."
            });
        }

        // 4. Match document keys to uploaded files.
        const documentKeys = getDocumentKeys(req.body);

        if (documentKeys.length !== files.length) {
            await removeUploadedFiles(files);

            return res.status(400).json({
                success: false,
                message: "Les documents envoyés ne correspondent pas aux fichiers.",
                details: {
                    receivedDocumentKeys: documentKeys.length,
                    receivedFiles: files.length
                }
            });
        }

        const uploadedDocuments = [];
        const seenDocumentIds = new Set();

        for (let index = 0; index < files.length; index++) {
            const documentId = positiveId(documentKeys[index]);

            if (!documentId || seenDocumentIds.has(documentId)) {
                await removeUploadedFiles(files);

                return res.status(400).json({
                    success: false,
                    message: "Identifiant de document invalide ou dupliqué."
                });
            }

            seenDocumentIds.add(documentId);

            uploadedDocuments.push({
                documentId,
                file: files[index]
            });
        }

        // 5. Begin transaction.
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        // 6. Verify competition and registration period.
        const [competitions] = await connection.query(
            `SELECT
                id,
                sport,
                discipline,
                registration_fee,
                opening_date,
                closing_date,
                (opening_date IS NULL OR opening_date <= CURDATE()) AS opening_ok,
                (closing_date IS NULL OR closing_date >= CURDATE()) AS closing_ok
             FROM competitions
             WHERE id = ?
             FOR UPDATE`,
            [competitionID]
        );

        if (!competitions.length) {
            throw new Error("COMPETITION_NOT_FOUND");
        }

        const competition = competitions[0];

        if (Number(competition.opening_ok) !== 1) {
            throw new Error("REGISTRATION_NOT_OPEN");
        }

        if (Number(competition.closing_ok) !== 1) {
            throw new Error("REGISTRATION_CLOSED");
        }

        // 7. Verify category belongs to this competition.
        const [categories] = await connection.query(
            `SELECT
                id,
                sport,
                discipline,
                gender,
                age_category,
                weight_category
             FROM competition_categories
             WHERE id = ? AND competition_id = ?
             LIMIT 1`,
            [categoryId, competitionID]
        );

        if (!categories.length) {
            throw new Error("CATEGORY_NOT_FOUND");
        }

        const category = categories[0];

        if (
            String(category.sport || "") !== sport ||
            String(category.age_category || "") !== ageCategory ||
            String(category.weight_category || "") !== weightCategory ||
            (
                category.discipline &&
                String(category.discipline) !== discipline
            ) ||
            (
                category.gender &&
                String(category.gender) !== String(gender || "")
            )
        ) {
            throw new Error("CATEGORY_MISMATCH");
        }

        // 8. Verify document IDs and mandatory documents.
        const [allDocuments] = await connection.query(
            `SELECT id, name, is_required
             FROM competition_documents
             WHERE competition_id = ?`,
            [competitionID]
        );

        const allowedDocumentIds = new Set(
            allDocuments.map(item => Number(item.id))
        );

        const requiredDocumentIds = new Set(
            allDocuments
                .filter(item =>
                    item.is_required === true ||
                    Number(item.is_required) === 1
                )
                .map(item => Number(item.id))
        );

        for (const documentId of seenDocumentIds) {
            if (!allowedDocumentIds.has(documentId)) {
                throw new Error("DOCUMENT_NOT_ALLOWED");
            }
        }

        for (const requiredId of requiredDocumentIds) {
            if (!seenDocumentIds.has(requiredId)) {
                throw new Error("REQUIRED_DOCUMENT_MISSING");
            }
        }

        // 9. Validate registration fee.
        const registrationFee = Number(competition.registration_fee || 0);

        if (!Number.isFinite(registrationFee) || registrationFee < 0) {
            throw new Error("INVALID_REGISTRATION_FEE");
        }

        // 10. Insert registration.
        const registrationNumber = generateRegistrationNumber();

        const [insertResult] = await connection.query(
            `INSERT INTO registrations (
                registration_number,
                competition_id,
                competition_category_id,
                first_name,
                last_name,
                phone,
                email,
                date_of_birth,
                gender,
                club_name,
                experience_level,
                sport,
                discipline,
                age_category,
                weight_category,
                registration_fee,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
            [
                registrationNumber,
                competitionID,
                categoryId,
                firstName,
                lastName,
                phone,
                email,
                dateOfBirth,
                gender,
                clubName,
                experienceLevel,
                sport,
                discipline || null,
                ageCategory,
                weightCategory,
                registrationFee
            ]
        );

        const registrationId = insertResult.insertId;

        // 11. Insert uploaded document references.
        for (const item of uploadedDocuments) {
            const file = item.file;

            if (!file.path) {
                throw new Error("UPLOADED_FILE_PATH_MISSING");
            }

            const fileUrl = path
                .relative(process.cwd(), file.path)
                .split(path.sep)
                .join("/");

            await connection.query(
                `INSERT INTO registration_documents (
                    registration_id,
                    competition_document_id,
                    file_url,
                    file_name,
                    status
                ) VALUES (?, ?, ?, ?, 'pending')`,
                [
                    registrationId,
                    item.documentId,
                    fileUrl,
                    file.originalname
                ]
            );
        }

        await connection.commit();
        transactionStarted = false;
        registrationSaved = true;

        return res.status(201).json({
            success: true,
            message: "Inscription envoyée avec succès.",
            data: {
                registrationId,
                registrationNumber,
                competitionId: competitionID,
                status: "submitted",
                registrationFee,
                currency: "DZD"
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Registration rollback error:", rollbackError);
            }
        }

        if (!registrationSaved) {
            await removeUploadedFiles(files);
        }

        const clientErrors = {
            COMPETITION_NOT_FOUND: [
                404,
                "Compétition introuvable."
            ],
            REGISTRATION_NOT_OPEN: [
                400,
                "Les inscriptions ne sont pas encore ouvertes."
            ],
            REGISTRATION_CLOSED: [
                400,
                "La période d'inscription est terminée."
            ],
            CATEGORY_NOT_FOUND: [
                400,
                "La catégorie sélectionnée n'appartient pas à cette compétition."
            ],
            CATEGORY_MISMATCH: [
                400,
                "Les informations de la catégorie sélectionnée sont incohérentes."
            ],
            REQUIRED_DOCUMENT_MISSING: [
                400,
                "Veuillez joindre tous les documents obligatoires."
            ],
            DOCUMENT_NOT_ALLOWED: [
                400,
                "Un document ne correspond pas à cette compétition."
            ],
            INVALID_REGISTRATION_FEE: [
                400,
                "Les frais d'inscription sont invalides."
            ],
            UPLOADED_FILE_PATH_MISSING: [
                500,
                "Le chemin d'un fichier envoyé est manquant."
            ]
        };

        const clientError = clientErrors[error.message];

        if (clientError) {
            return res.status(clientError[0]).json({
                success: false,
                message: clientError[1]
            });
        }

        console.error("Create registration error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Impossible d'enregistrer l'inscription. Veuillez réessayer."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    createRegistration
};
