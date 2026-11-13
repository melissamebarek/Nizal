"use strict";

const pool = require("../../config/database");

const cancelOrder = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { id } = req.params;

        if (!id || !String(id).trim()) {
            return res.status(400).json({
                success: false,
                message: "Identifiant de commande manquant."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        // Lock the order to prevent simultaneous cancellation.
        let orderRows;

        if (/^\d+$/.test(String(id))) {
            [orderRows] = await connection.query(
                `SELECT id, order_number, status
                 FROM orders
                 WHERE id = ? OR order_number = ?
                 LIMIT 1
                 FOR UPDATE`,
                [Number(id), String(id)]
            );
        } else {
            [orderRows] = await connection.query(
                `SELECT id, order_number, status
                 FROM orders
                 WHERE order_number = ?
                 LIMIT 1
                 FOR UPDATE`,
                [String(id)]
            );
        }

        if (orderRows.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Commande introuvable."
            });
        }

        const order = orderRows[0];

        if (order.status === "cancelled") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "Cette commande est déjà annulée."
            });
        }

        if (order.status === "shipped" || order.status === "delivered") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message:
                    "Impossible d'annuler une commande expédiée ou livrée."
            });
        }

        // Load each ordered variant and its quantity.
        const [items] = await connection.query(
            `SELECT variant_id, product_id, quantity
             FROM order_items
             WHERE order_id = ?
             FOR UPDATE`,
            [order.id]
        );

        if (items.length === 0) {
            throw new Error(
                "Aucun article trouvé pour cette commande. Annulation impossible."
            );
        }

        // Restore stock to the exact variants purchased.
        for (const item of items) {
            if (item.variant_id == null) {
                throw new Error(
                    `La variante manque pour l'article ${item.product_id}. ` +
                    "Le stock n'a pas été modifié."
                );
            }

            const quantity = Number(item.quantity);

            if (!Number.isSafeInteger(quantity) || quantity <= 0) {
                throw new Error(
                    "Quantité invalide dans les articles de la commande."
                );
            }

            const [result] = await connection.query(
                `UPDATE product_variants
                 SET stock = stock + ?
                 WHERE id = ? AND product_id = ?`,
                [quantity, item.variant_id, item.product_id]
            );

            if (result.affectedRows !== 1) {
                throw new Error(
                    `Variante introuvable pour le produit ${item.product_id}.`
                );
            }
        }

        // Update the status in the same transaction.
        const [updateResult] = await connection.query(
            `UPDATE orders
             SET status = 'cancelled',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status IN ('new', 'preparing')`,
            [order.id]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error(
                "La commande a changé d'état. Actualisez la page et réessayez."
            );
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: "Commande annulée et stock restauré avec succès.",
            data: {
                orderId: order.id,
                orderNumber: order.order_number,
                status: "cancelled"
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Erreur rollback annulation :", rollbackError);
            }
        }

        console.error("Erreur cancelOrder :", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Impossible d'annuler la commande. Veuillez réessayer."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = cancelOrder;