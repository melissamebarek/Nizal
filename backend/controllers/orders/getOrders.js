
"use strict";

const db = require("../../config/database");

async function getAllOrders(req, res) {
  try {
    // Get all orders, newest first.
    const [orders] = await db.query(`
      SELECT
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        wilaya_code,
        wilaya_name,
        city,
        delivery_type,
        delivery_notes,
        subtotal,
        shipping_fee,
        total,
        payment_method,
        status,
        created_at,
        updated_at
      FROM orders
      ORDER BY created_at DESC, id DESC
    `);

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Aucune commande trouvée.",
        count: 0,
        data: []
      });
    }

    // Get all items belonging to these orders.
    const orderIds = orders.map(order => order.id);
    const placeholders = orderIds.map(() => "?").join(",");

    const [items] = await db.query(
      `
        SELECT
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.product_name,
          oi.variant_id,
          oi.variant_color,
          oi.variant_size,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          p.name AS current_product_name
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id IN (${placeholders})
        ORDER BY oi.order_id DESC, oi.id ASC
      `,
      orderIds
    );

    // Group items by order.
    const itemsByOrder = new Map();

    for (const item of items) {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }

      itemsByOrder.get(item.order_id).push(item);
    }

    // Attach items to each order.
    const result = orders.map(order => ({
      ...order,
      items: itemsByOrder.get(order.id) || []
    }));

    return res.status(200).json({
      success: true,
      message: "Commandes récupérées avec succès.",
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error("Erreur getAllOrders :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commandes."
    });
  }
}

module.exports = getAllOrders;
