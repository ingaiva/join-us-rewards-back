var express = require("express");
const token_auth = require('../middleWare/token_auth');
var router = express.Router();
const catalogue = require("../controllers/catalogue");

router.get("/",token_auth, catalogue.getCatalogue);

module.exports = router;
