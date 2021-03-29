const Offre = require("../models/offre");
const controller = {
  getCatalogue: async (req, res) => {
    try {
      const rolesUserOriginal = req?.token?.roles;
      const adminRole = rolesUserOriginal.find(
        (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
      );
      let filter={};
      if (!adminRole){
        filter={ statut: 'active' };
      }
      const offresFromBd = await Offre.find(filter).exec();
      if (offresFromBd instanceof Error) {
        res.status(500).json({ success: false, message: "Une erreur s'est produite!" });       
      }      
      res.json({ success: true, data: offresFromBd });
      
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Une erreur s'est produite!" });
    }
  },
};
module.exports = controller;
