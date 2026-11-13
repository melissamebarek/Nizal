const express = require("express");

const getArticles = require("../controllers/articles/getArticles");

const createArticle = require("../controllers/articles/createArticle");

const publishArticle = require("../controllers/articles/publieArticle");

const updateArticle = require("../controllers/articles/updateArticle");

const deleteArticle = require("../controllers/articles/deleteArticle");

const getArticle = require("../controllers/articles/getArticle");

const router = express.Router();

router.get("/", getArticles);

router.post("/create", createArticle);

router.patch("/:id/publish", publishArticle);

router.put("/:id/update", updateArticle);

router.delete("/:id/delete", deleteArticle);

router.get("/:id", getArticle);

module.exports = router;