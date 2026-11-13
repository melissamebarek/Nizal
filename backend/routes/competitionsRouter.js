const express = require("express");

const getCompetitions = require(
    "../controllers/competitions/getCompetitions"
);

const getCompetition = require(
    "../controllers/competitions/getCompetition"
);

const createCompetitions = require(
    "../controllers/competitions/createCompetitions"
);

const editCompetitions = require(
    "../controllers/competitions/editCompetitions"
);

const deleteCompetitions = require(
    "../controllers/competitions/deleteCompetitions"
);

const router = express.Router();

/* GET ALL COMPETITIONS */
router.get("/", getCompetitions);

router.get("/:id", getCompetition);

router.put("/:id/edit", editCompetitions);

router.delete("/:id/delete", deleteCompetitions);


router.post("/create", createCompetitions);


module.exports = router;