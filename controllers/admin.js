const fetch = require("node-fetch");
const OffreModel = require("../models/offre");
const UserModel = require("../models/user");
const controller = {
  creerOffre: async (req, res) => {
    const rolesUserOriginal = req?.token?.roles;
    const adminRole = rolesUserOriginal.find(
      (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
    );
    if (adminRole) {
      const offreData = req.body;
      if (offreData) {
        let newOffre = new OffreModel({
          titre: offreData?.titre,
          description: offreData?.description,
          dateCreation: new Date(),
          lienExterne: offreData?.lienExterne,
          dateFin: offreData?.dateFin,
          statut: offreData?.statut,
          prix: offreData?.prix,
          devise: offreData?.devise,
          virtuel: offreData?.virtuel,
          pays: offreData?.pays,
        });

        const result = await newOffre.save();
        if (result instanceof OffreModel) {
          res.json({ success: true, data: result });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Une erreur s'est produite!" });
        }
      } else {
        res.status(400).json({
          success: false,
          message: "Données insuffisantes pour créer une offre",
        });
      }
    } else {
      res.status(403).json({ success: false, message: "Accès non autorisé" });
    }
  },
  supprimerOffre: async (req, res) => {
    const rolesUserOriginal = req?.token?.roles;
    const adminRole = rolesUserOriginal.find(
      (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
    );
    if (adminRole) {
      const offreData = req.body;
      if (offreData?._id) {
        const result = await OffreModel.deleteOne({ _id: offreData?._id });
        res.json({ success: true });
      }
    } else {
      res.status(403).json({ success: false, message: "Accès non autorisé" });
    }
  },
  modifierOffre: async (req, res) => {
    const rolesUserOriginal = req?.token?.roles;
    const adminRole = rolesUserOriginal.find(
      (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
    );
    if (adminRole) {
      const offreData = req.body;
      console.log("modifierOffre " + JSON.stringify(req.body));

      const offreToUpdate = await OffreModel.findOne({ _id: offreData?._id });
      if (offreData && offreToUpdate) {
        offreToUpdate.titre = offreData?.titre;
        offreToUpdate.description = offreData?.description;
        offreToUpdate.dateCreation = offreData?.dateCreation;
        offreToUpdate.lienExterne = offreData?.lienExterne;
        offreToUpdate.dateFin = offreData?.dateFin;
        offreToUpdate.statut = offreData?.statut;
        offreToUpdate.prix = offreData?.prix;
        offreToUpdate.devise = offreData?.devise;
        offreToUpdate.virtuel = offreData?.virtuel;
        offreToUpdate.pays = offreData?.pays;

        const result = await offreToUpdate.save();
        if (result instanceof OffreModel) {
          res.json({ success: true, data: result });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Une erreur s'est produite!" });
        }
      } else {
        res.status(400).json({
          success: false,
          message: "Données insuffisantes pour mettre à jour une offre",
        });
      }
    } else {
      res.status(403).json({ success: false, message: "Accès non autorisé" });
    }
  },
  getCmd: async (req, res) => {
    function compareCmd(first, second) {
      return new Date(second.date) - new Date(first.date);
    }
    const rolesUserOriginal = req?.token?.roles;
    const adminRole = rolesUserOriginal.find(
      (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
    );
    if (adminRole) {
      const UsersFromBd = await UserModel.find().exec();
      if (UsersFromBd instanceof Error) {
        res
          .status(500)
          .json({ success: false, message: "Une erreur s'est produite!" });
      }
      const orders = [];
      UsersFromBd.forEach((user) => {
        user.orders.forEach((order) => {
          orders.push(order);
        });
      });
      orders.sort(compareCmd);
      res.json({ success: true, orders: orders.slice(0, 2000) });
    } else {
      res.status(403).json({ success: false, message: "Accès non autorisé" });
    }
  },
  modifierCmd: async (req, res) => {
    const rolesUserOriginal = req?.token?.roles;
    const adminRole = rolesUserOriginal.find(
      (element) => element === "ROLE_SUPER_ADMIN" || element === "ROLE_RP_APP"
    );
    if (adminRole) {
      const cmdData = req.body;

      const result = await UserModel.findOneAndUpdate(
        { "orders._id": cmdData._id },
        { "orders.$": cmdData }
      );
      if (result instanceof Error) {
        res.status(500).json({
            success: false,
            message:
              "Une erreur s'est produite lors de modification d'une commande!",
          });
      } else {
        if(cmdData.statut==='refunded'){
          console.log("statut cmd refunded")
          try {
            const postData = {
              userId: cmdData.idUserOriginal,
              action: "USER.REFUND",
              type: "USER",
              currency: cmdData.offre.devise,
              amount: cmdData.offre.prix,
            };
  
            const adminToken = process.env.Reward_adminToken;
            const url = process.env.HOST_TRANSACTIONS_API + "/transaction";
            const options = {
              method: "POST",
              headers: {
                Authorization: "Bearer " + adminToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(postData),
            };
            fetch(url, options)
              .then((res) => res.json())
              .then((json) => {
                res.json({ success: true, order: result });
              });
          } catch (error) {
            console.log("erreur update : " +error);
            res.status(500).json({
              success: false,
              message: "Une erreur s'est produite! " + JSON.stringify(error),
            });
          }

        } else {
          res.json({ success: true, order: result });
        }
      }
    }
  },
};
module.exports = controller;
