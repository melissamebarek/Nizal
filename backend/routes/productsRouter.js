const express = require("express");

const getProducts = require(
    "../controllers/products/getProducts"
);

const getProduct = require(
    "../controllers/products/getProduct"
);

const editProduct = require(
    "../controllers/products/editProduct"
);

const deleteProduct = require(
    "../controllers/products/deleteProducts"
);

const createProducts = require(
    "../controllers/products/createProducts"
);

const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getProduct);

router.post("/create", createProducts);

router.put("/:id/edit", editProduct);

router.delete("/:id/delete", deleteProduct);


module.exports = router;