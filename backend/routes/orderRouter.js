"use strict";

const express = require("express");
const router = express.Router();

const createOrder = require("../controllers/orders/createOrder");
const getOrders = require("../controllers/orders/getOrders");
const getOrder = require("../controllers/orders/getOrder");
const cancelOrder = require("../controllers/orders/removeOrder");
const editOrder = require("../controllers/orders/editOrder");


router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id/edit", editOrder);

module.exports = router;