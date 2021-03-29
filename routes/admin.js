var express = require("express");
const token_auth = require('../middleWare/token_auth');
var router = express.Router();
const admin = require("../controllers/admin");

router.post("/creer-offre",token_auth, admin.creerOffre);
router.put("/modifer-offre",token_auth, admin.modifierOffre);
router.post("/supprimer-offre",token_auth, admin.supprimerOffre);

router.get("/cmd",token_auth, admin.getCmd);
router.post("/modifer-cmd",token_auth, admin.modifierCmd);
module.exports = router;
