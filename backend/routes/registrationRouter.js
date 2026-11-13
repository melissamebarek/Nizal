
"use strict";

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

// Controller
const registrationController = require(
    "../controllers/registrations/createRegistration"
);
const getRegistrations = require(
    "../controllers/registrations/getRegistrations"
);

const {
    getRegistrationById,
    getRegistrationDocument,
    updateRegistrationStatus,
    requestRegistrationInfo,
    getRegistrationHistory
} = require("../controllers/registrations/manageRegistration");
if (
    !registrationController ||
    typeof registrationController.createRegistration !== "function"
) {
    throw new Error(
        "createRegistration introuvable dans le controller."
    );
}

// Upload directory
const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "registrations"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

// Disk storage
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `registration-${Date.now()}-${crypto
                .randomBytes(6)
                .toString("hex")}${extension}`;

        callback(null, uniqueName);
    }
});

// Accepted formats
const allowedMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png"
]);

const allowedExtensions = new Set([
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png"
]);

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    },

    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (
            !allowedExtensions.has(extension) ||
            !allowedMimeTypes.has(file.mimetype)
        ) {
            return callback(
                new Error(
                    "Format de fichier non autorisé. Utilisez PDF, JPG ou PNG."
                )
            );
        }

        callback(null, true);
    }
});

// POST /api/registrations
router.post("/", (req, res, next) => {
    upload.array("documents", 10)(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            let message = "Erreur lors de l'envoi des documents.";

            if (error.code === "LIMIT_FILE_SIZE") {
                message = "Chaque fichier ne doit pas dépasser 10 Mo.";
            } else if (error.code === "LIMIT_FILE_COUNT") {
                message = "Vous ne pouvez pas envoyer plus de 10 fichiers.";
            } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
                message =
                    "Champ de fichier inattendu. Utilisez le champ documents.";
            }

            return res.status(400).json({
                success: false,
                message
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message ||
                "Impossible de recevoir les documents."
        });
    });
}, registrationController.createRegistration);

router.get("/", getRegistrations.getAllRegistrations);

router.get("/:id/history", getRegistrationHistory);
router.get("/:id/documents/:documentId", getRegistrationDocument);
router.get("/:id", getRegistrationById);

router.patch("/:id/status", updateRegistrationStatus);
router.patch("/:id/request-info", requestRegistrationInfo);

module.exports = router;
