
"use strict";

const pool = require("../../config/database");
const crypto = require("crypto");

const SHIPPING_PRICES = {
    bureau: 500,
    domicile: 900
};

const roundMoney = value =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function generateOrderNumber() {
    return `NIZ-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const createOrder = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();

        const {
            customer,
            deliveryAddress,
            delivery,
            payment,
            items
        } = req.body || {};

        // 1. Validate customer and address.
        if (
            !customer ||
            !customer.firstName?.trim() ||
            !customer.lastName?.trim() ||
            !customer.email?.trim() ||
            !customer.phone?.trim() ||
            !deliveryAddress?.address?.trim() ||
            !deliveryAddress?.wilayaCode ||
            !deliveryAddress?.wilayaName ||
            !deliveryAddress?.city?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Veuillez remplir toutes les informations du client et de livraison."
            });
        }

        if (
            !delivery ||
            !Object.prototype.hasOwnProperty.call(
                SHIPPING_PRICES,
                delivery.method
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Mode de livraison invalide."
            });
        }

        if (payment?.method !== "cash_on_delivery") {
            return res.status(400).json({
                success: false,
                message: "Méthode de paiement non prise en charge."
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Le panier est vide."
            });
        }

        // 2. Validate and combine duplicate variants.
        const groupedItems = new Map();

        for (const item of items) {
            const productId = Number(item.productId);
            const variantId = Number(item.variantId);
            const quantity = Number(item.quantity);

            if (
                !Number.isSafeInteger(productId) ||
                productId <= 0 ||
                !Number.isSafeInteger(variantId) ||
                variantId <= 0 ||
                !Number.isSafeInteger(quantity) ||
                quantity <= 0 ||
                quantity > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Identifiant de produit, variante ou quantité invalide."
                });
            }

            const key = `${productId}:${variantId}`;

            if (!groupedItems.has(key)) {
                groupedItems.set(key, {
                    productId,
                    variantId,
                    quantity: 0,
                    submittedVariants: []
                });
            }

            const grouped = groupedItems.get(key);
            grouped.quantity += quantity;
            grouped.submittedVariants.push({
                color: item.color,
                size: item.size
            });

            if (grouped.quantity > 1000) {
                return res.status(400).json({
                    success: false,
                    message: "Quantité totale invalide."
                });
            }
        }

        // 3. Begin atomic database transaction.
        await connection.beginTransaction();
        transactionStarted = true;

        const orderItems = [];
        let subtotal = 0;

        // Sort IDs consistently to reduce deadlock risk.
        const groupedList = [...groupedItems.values()].sort(
            (a, b) =>
                a.productId - b.productId ||
                a.variantId - b.variantId
        );

        for (const item of groupedList) {
            // Lock the variant row until transaction finishes.
            const [rows] = await connection.query(
                `SELECT
                    p.id AS product_id,
                    p.name AS product_name,
                    p.price AS product_price,
                    p.discount AS product_discount,
                    pv.id AS variant_id,
                    pv.color AS variant_color,
                    pv.size AS variant_size,
                    pv.stock AS stock
                 FROM products p
                 INNER JOIN product_variants pv
                    ON pv.product_id = p.id
                 WHERE p.id = ? AND pv.id = ?
                 FOR UPDATE`,
                [item.productId, item.variantId]
            );

            if (rows.length === 0) {
                throw new Error(
                    `Produit ou variante introuvable (ID ${item.productId}).`
                );
            }

            const product = rows[0];
            const stock = Number(product.stock);

            // Verify that submitted color/size match this exact variant.
            for (const submitted of item.submittedVariants) {
                if (
                    submitted.color != null &&
                    String(submitted.color) !== String(product.variant_color ?? "")
                ) {
                    throw new Error(
                        `La couleur sélectionnée pour ${product.product_name} est invalide.`
                    );
                }

                if (
                    submitted.size != null &&
                    String(submitted.size) !== String(product.variant_size ?? "")
                ) {
                    throw new Error(
                        `La taille sélectionnée pour ${product.product_name} est invalide.`
                    );
                }
            }

            if (!Number.isFinite(stock) || stock < item.quantity) {
                throw new Error(
                    `Stock insuffisant pour ${product.product_name}. ` +
                    `Disponible : ${Math.max(0, stock || 0)}, demandé : ${item.quantity}.`
                );
            }

            // Assumption: products.discount is a percentage (e.g. 10 = 10%).
            const originalPrice = Number(product.product_price);
            const discountPercent = Number(product.product_discount) || 0;

            if (
                !Number.isFinite(originalPrice) ||
                originalPrice < 0 ||
                !Number.isFinite(discountPercent) ||
                discountPercent < 0 ||
                discountPercent > 100
            ) {
                throw new Error(
                    `Prix ou remise invalide pour ${product.product_name}.`
                );
            }

            const unitDiscount = roundMoney(
                originalPrice * discountPercent / 100
            );

            const unitPrice = roundMoney(
                originalPrice - unitDiscount
            );

            const lineSubtotal = roundMoney(
                unitPrice * item.quantity
            );

            // Conditional stock update is an extra safeguard.
            const [updateResult] = await connection.query(
                `UPDATE product_variants
                 SET stock = stock - ?
                 WHERE id = ?
                   AND product_id = ?
                   AND stock >= ?`,
                [
                    item.quantity,
                    item.variantId,
                    item.productId,
                    item.quantity
                ]
            );

            if (updateResult.affectedRows !== 1) {
                throw new Error(
                    `Le stock de ${product.product_name} vient de changer. Réessayez.`
                );
            }

            subtotal = roundMoney(subtotal + lineSubtotal);

            orderItems.push({
                productId: item.productId,
                variantId: item.variantId,
                productName: product.product_name,
                color: product.variant_color,
                size: product.variant_size,
                quantity: item.quantity,
                unitPrice,
                originalPrice,
                unitDiscount,
                lineSubtotal
            });
        }

        const shippingFee = SHIPPING_PRICES[delivery.method];
        const total = roundMoney(subtotal + shippingFee);
        const orderNumber = generateOrderNumber();

        const customerName =
            `${customer.firstName.trim()} ${customer.lastName.trim()}`;

        const shippingAddress = deliveryAddress.address.trim();

        // 4. Save the order.
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_number,
                customer_name,
                customer_phone,
                customer_email,
                shipping_address,
                wilaya_code,
                wilaya_name,
                city,
                delivery_type,
                delivery_notes,
                payment_method,
                shipping_fee,
                subtotal,
                total,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
            [
                orderNumber,
                customerName,
                customer.phone.trim(),
                customer.email.trim(),
                shippingAddress,
                String(deliveryAddress.wilayaCode),
                deliveryAddress.wilayaName,
                deliveryAddress.city.trim(),
                delivery.method,
                deliveryAddress.notes?.trim() || null,
                "cash_on_delivery",
                shippingFee,
                subtotal,
                total
            ]
        );

        const orderId = orderResult.insertId;

        // 5. Save all order lines.
        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO order_items (
                    order_id,
                    product_id,
                    variant_id,
                    product_name,
                    variant_color,
                    variant_size,
                    quantity,
                    unit_price,
                    original_unit_price,
                    unit_discount,
                    subtotal
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.variantId,
                    item.productName,
                    item.color,
                    item.size,
                    item.quantity,
                    item.unitPrice,
                    item.originalPrice,
                    item.unitDiscount,
                    item.lineSubtotal
                ]
            );
        }

        // Commit only after stock and every order item are saved.
        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Commande enregistrée avec succès.",
            data: {
                orderId,
                orderNumber,
                status: "new",
                subtotal,
                shippingFee,
                total,
                currency: "DZD"
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Order rollback error:", rollbackError);
            }
        }

        console.error("Create order error:", error);

        const clientError =
            /Stock insuffisant|introuvable|invalide|vient de changer/i
                .test(error.message || "");

        return res.status(clientError ? 400 : 500).json({
            success: false,
            message: clientError
                ? error.message
                : "Impossible d'enregistrer la commande. Veuillez réessayer."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = createOrder;
