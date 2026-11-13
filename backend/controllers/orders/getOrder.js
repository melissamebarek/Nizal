"use strict";

// IMPORTANT:
// Replace this import with the exact database import used
// by your existing working controller.
// The imported variable must be named "db" and support
// mysql2/promise query().
const db = require("../../config/database");

const getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !String(id).trim()) {
            return res.status(400).json({
                success: false,
                message: "Identifiant de commande manquant."
            });
        }

        // Find the order by database ID or order number.
        let orderRows;

        if (/^\d+$/.test(String(id))) {
            [orderRows] = await db.query(
                `SELECT * FROM orders
                 WHERE id = ? OR order_number = ?
                 LIMIT 1`,
                [Number(id), String(id)]
            );
        } else {
            [orderRows] = await db.query(
                `SELECT * FROM orders
                 WHERE order_number = ?
                 LIMIT 1`,
                [String(id)]
            );
        }

        if (!orderRows.length) {
            return res.status(404).json({
                success: false,
                message: "Commande introuvable."
            });
        }

        const order = orderRows[0];

        // Load the products belonging to this order.
        const [items] = await db.query(
            `
SELECT
    oi.id AS order_item_id,
    oi.product_id,
    oi.product_name,
    oi.variant_color,
    oi.variant_size,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    p.name AS current_product_name,
    (
        SELECT pi.image_url
        FROM product_images pi
        WHERE pi.product_id = oi.product_id
        ORDER BY pi.is_main DESC, pi.id ASC
        LIMIT 1
    ) AS cover_image
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = ?
`,
            [order.id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...order,
                items: items.map(item => ({
                    ...item,
                    product_name:
                        item.product_name ||
                        item.current_product_name ||
                        "Produit supprimé",
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    subtotal: Number(item.subtotal)
                }))
            }
        });

    } catch (error) {
        console.error("Erreur getOrderDetails :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors du chargement des détails de la commande."
        });
    }
};

module.exports = getOrderDetails;