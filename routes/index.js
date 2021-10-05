var express = require("express");
var router = express.Router();
const db = require("./../models");
const File = db.File;
const Team = db.Team;

/* GET home page. */
router.get("/", async (req, res, next) => {
  try {
    const { round } = req.query
    let files = await File.findAll({
      where: { round: round ? parseInt(round) : 2, remove: false },
      include: [{ model: Team, attributes: ["team"] }],
    });

    files = files.map((item) => {
      return item.get({ plain: true });
    });

    res.status(200).json({ files });
  } catch (error) {
    res.status(200).json({ files: [] });
  }
});

module.exports = router;
