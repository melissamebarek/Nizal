
"use strict";

const db = require("../../config/database");

const ALLOWED_STATUSES = [
    "new",
    "preparing",
    "shipped",
    "delivered"
];

const TRANSITIONS = {
    new: ["preparing"],
    preparing: ["shipped"],
    shipped: ["delivered"],
    delivered: []
};

module.exports = async function updateOrderStatus(req, res) {
    const orderId = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Identifiant de commande invalide."
        });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Statut demandé invalide."
        });
    }

    try {
        const [orders] = await db.execute(
            "SELECT id, status FROM orders WHERE id = ?",
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Commande introuvable."
            });
        }

        const currentStatus = orders[0].status;

        if (currentStatus === "cancelled") {
            return res.status(409).json({
                success: false,
                message: "Une commande annulée ne peut plus être modifiée."
            });
        }

        if (currentStatus === status) {
            return res.json({
                success: true,
                message: "La commande possède déjà ce statut.",
                data: { id: orderId, status }
            });
        }

        if (!TRANSITIONS[currentStatus]?.includes(status)) {
            return res.status(409).json({
                success: false,
                message: "Transition de statut non autorisée."
            });
        }

        const [result] = await db.execute(
            `UPDATE orders
             SET status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = ?`,
            [status, orderId, currentStatus]
        );

        if (result.affectedRows === 0) {
            return res.status(409).json({
                success: false,
                message: "La commande a été modifiée. Rechargez la page."
            });
        }

        return res.json({
            success: true,
            message: "Statut de commande mis à jour.",
            data: { id: orderId, status }
        });
    } catch (error) {
        console.error("Erreur updateOrderStatus :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la modification du statut."
        });
    }
};
