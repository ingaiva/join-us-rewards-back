var express = require("express");
var router = express.Router();
const user = require("../controllers/user");
const token_auth = require("../middleWare/token_auth");

/* GET users listing. */
router.get("/", token_auth, user.getUser);

router.post("/creer-cmd", token_auth, user.creerCmd);
router.get("/info", token_auth, user.getInfoUser);
router.get("/transactions", token_auth, user.getAllTransactionsByUser);

router.post("/login", token_auth, user.createLoginLink);
router.get("/login/:link", user.checkLogin);
router.get("/login", function (req, res) {
  res.sendStatus(403);
});
router.get("/cmd", token_auth, user.getCmd);
module.exports = router;
