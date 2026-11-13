
"use strict";

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendRegistrationDecision({
    to,
    participantName,
    competitionName,
    status,
    reason
}) {
    const accepted = status === "accepted";

    const subject = accepted
        ? `Inscription acceptée - ${competitionName}`
        : `Inscription refusée - ${competitionName}`;

    const message = accepted
        ? `Nous avons le plaisir de vous informer que votre inscription à la compétition "${competitionName}" a été acceptée.`
        : `Nous sommes désolés de vous informer que votre inscription à la compétition "${competitionName}" a été refusée.\n\nMotif du refus : ${reason}`;

    return transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: `Bonjour ${participantName || "participant"},\n\n${message}\n\nCordialement,\nL'équipe NIZAL`
    });
}

module.exports = { sendRegistrationDecision };
