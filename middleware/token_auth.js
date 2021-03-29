const jwt = require("jsonwebtoken");
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      //console.log("decodage token ");
      let decoded = jwt.verify(token, process.env.Reward_secret);      
      //console.log("voici ce que j'ai decodé : " + JSON.stringify(decoded));
      req.token = decoded;
      req.tokenEncoded=token;
      next();
    } catch (error) {
      return res.sendStatus(403);
    }
  } else {
    res.sendStatus(401);
  }
};
module.exports = authenticateJWT;
