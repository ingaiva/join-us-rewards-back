const UserModel = require("../models/user");
const fetch = require("node-fetch");
const crypto = require("crypto");
const sendMail = require("../helpers/mail");



const user = {
  getUser: async (req, res) => {
    const idUserOriginal = req?.token?.user?._id;
    if (idUserOriginal) {
      const usrBdd = await UserModel.findOne(
        { idUserOriginal: idUserOriginal },
        {
          orders: 0,
        }
      );

      if (!usrBdd) {
        let newUser = new UserModel({
          idUserOriginal: idUserOriginal,
          email: req?.token?.user?.email,
          username: req?.token?.user?.username,
          birthday: req?.token?.user?.birthday,
          gender: req?.token?.user?.gender,
          locale: req?.token?.user?.locale,
          isActive: req?.token?.user?.isActive,
          isVerified: req?.token?.user?.isVerified,
          roles: req?.token?.user?.roles,
          offre: [],
        });
        const result = await newUser.save();
        if (result instanceof Error) {
          res.status(500).json({ success: false });
        } else {
          res.json({ success: true, user: result });
        }
      } else {
        res.json({ success: true, user: usrBdd });
      }
    } else {
      res.status(400).json({ success: false, message: "Token invalide" });
    }
  },
  getInfoUser: async (req, res) => {
    function compareTransactions(first, second) {
      return new Date(second.createdAt) - new Date(first.createdAt);
    }

    try {
      const idUserOriginal = req?.token?.user?._id;
      const userToken = req?.tokenEncoded;
      const url = process.env.HOST_TRANSACTIONS_API+'/transaction?$limit=50000&$sort[createdAt]=-1';
      const options = {
        method: "GET",
        headers: {
          Authorization: "Bearer " + userToken,
          "Content-Type": "application/json",
        },
      };

      fetch(url, options)
        .then((res) => res.json())
        .then((json) => {
          let data = [];
          let solde = [];
          let stats = [];
          let totalTransactions = json?.data.filter(
            (tr) => tr?.userId === idUserOriginal
          ).length;

          json?.data.sort(compareTransactions).forEach((transaction) => {
            //calculs des stats utilisation:
            if (transaction?.userId === idUserOriginal) {
              if (
                transaction?.action.toLowerCase() === "giver.give" ||
                transaction?.action.toLowerCase() === "taker.search" ||
                transaction?.action.toLowerCase() === "taker.parked"
              ) {
                const actionIndex = stats.findIndex(
                  (el) => el.action === transaction?.action
                );
                if (actionIndex != -1) {
                  stats[actionIndex].solde += 1;
                } else {
                  stats.push({
                    solde: 1,
                    action: transaction?.action,
                  });
                }
              }
            }
            //calculs du solde des points:
            if (transaction?.userId === idUserOriginal) {
              const deviseIndex = solde.findIndex(
                (el) => el.currency === transaction?.currency
              );
              if (deviseIndex != -1) {
                solde[deviseIndex].solde += transaction?.amount;
              } else {
                solde.push({
                  solde: transaction?.amount,
                  currency: transaction?.currency,
                });
              }
            }
            //les 10 derniers transactions:
            if (
              data.length <= 10 &&
              transaction?.userId === idUserOriginal &&
              transaction?.action.toLowerCase() != "user.order" &&
              transaction?.action.toLowerCase() != "user.refund" &&
              transaction?.amount > 0
            ) {
              data.push(transaction);
            }
          });

          res.json({
            success: true,
            lastTransactions: data,
            solde: solde,
            stats: stats,
            totalTransactions: totalTransactions,
          });
        });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Une erreur s'est produite! " + JSON.stringify(error),
      });
    }
  },

  creerCmd: async (req, res) => {
    try {
      // attention, a cette etape utilisateur doit exister dans BDD
      const idUserOriginal = req.token.user._id;
      const offre = req.body.offre;
      const userInput = req.body.userInput;

      const usrBdd = await UserModel.findOne(
        { idUserOriginal: idUserOriginal },
        {         
          birthday: 0,
          gender: 0,
          locale: 0,
          isActive: 0,
          isVerified: 0,
          roles: 0,
        }
      );

      if (usrBdd && usrBdd instanceof UserModel) {
        let newCmd = {
          date: new Date(),
          statut: "accepted",
          nom: userInput?.nom,
          prenom: userInput?.prenom,
          address: userInput?.address,
          address2: userInput?.address2,
          cp: userInput?.cp,
          ville: userInput?.ville,
          pays: userInput?.pays,
          email: userInput?.email,
          offre: offre,
          idUserOriginal: idUserOriginal,
          usernameOriginal: usrBdd.username,
          emailUserOriginal: usrBdd.email,
        };

        usrBdd.orders.push(newCmd);
        const result = await usrBdd.save();
        if (result instanceof UserModel) {
          try {
            const postData = {
              userId: idUserOriginal,
              action: "USER.ORDER",
              type: "USER",
              currency: offre.devise,
              amount: offre.prix * -1,
            };

            const adminToken = process.env.Reward_adminToken; 
            const url = process.env.HOST_TRANSACTIONS_API + '/transaction';
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
                res.json({ success: true, data: newCmd });
              });
          } catch (error) {
            res.status(500).json({
              success: false,
              message: "Une erreur s'est produite! " + JSON.stringify(error),
            });
          }
        } else {
          res
            .status(500)
            .json({ success: false, message: "Une erreur s'est produite!" });
        }
      } else {
        res.status(500).json({
          success: false,
          message: "Une erreur s'est produite, utilisateur non trouvé! ",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Une erreur s'est produite! " + error.message,
      });
    }
  },

  createLoginLink: async (req, res) => {
    const linkTemp = crypto.randomBytes(24).toString("hex");
    const idUserOriginal = req.token.user._id;
    const magiclink = linkTemp;
    let url = process.env.HOST_FRONT_API;
    url += "/connexion/";
    let mailList = req?.token?.user?.email;
    if (process.env.dev_mail) mailList += ", " + process.env.dev_mail;
    
    const attachements=[
      {
        filename: 'community.png',
        path:  './public/images/community.png',
        cid: 'JoinUs' 
      }
    ]
    let imgPath= 'cid:JoinUs' //'./public/images/community.png'  //req.headers.host +

    const content = `
    <div>    
        <img src="${imgPath}" alt="Join-Us-logo">   
        <h1 style="text-align: center; color: blue; font-size: 20px;">Join-Us</h1>
        <p>Bonjour,</p>
        <p>Vous souhaitez vous connecter à votre application Web Join-Us Rewards, veuillez cliquer sur le lien ci-dessous : </p>
        <a href="${url + magiclink}">Cliquez ici pour vous connecter !</a>
    </div>
    `;    
    try {
      let usrBdd = await UserModel.findOne(
        { idUserOriginal: idUserOriginal },
        {
          email: 0,
          username: 0,
          birthday: 0,
          gender: 0,
          locale: 0,
          isActive: 0,
          isVerified: 0,
          roles: 0,
          orders: 0,
        }
      );
      if (!usrBdd) {
        let newUser = new UserModel({
          idUserOriginal: idUserOriginal,
          email: req?.token?.user?.email,
          username: req?.token?.user?.username,
          birthday: req?.token?.user?.birthday,
          gender: req?.token?.user?.gender,
          locale: req?.token?.user?.locale,
          isActive: req?.token?.user?.isActive,
          isVerified: req?.token?.user?.isVerified,
          roles: req?.token?.user?.roles,
          offre: [],
        });
        usrBdd = await newUser.save();
      }

      if (usrBdd && usrBdd instanceof UserModel) {
        const tokenOriginal = req?.tokenEncoded;

        let dateExp = new Date();
        dateExp.setMinutes(dateExp.getMinutes() + 30);
        usrBdd.linkTemp = linkTemp;
        usrBdd.dateExplinkTemp = dateExp;
        usrBdd.token = tokenOriginal;
        const result = await usrBdd.save();

        res.status(200).json({
          success: true,
          message: `id ${
            result._id
          } voici votre lien pour acceder à l'application: ${
            url + magiclink
          } --- expiration : ${result.dateExplinkTemp}`,
          link:url + magiclink,
        });
      }
      // *********************Gros commentaire*********************** //
     
      sendMail(mailList, "Connexion Join-Us Rewards", content, attachements);
      //sendMail(req?.token?.user?.email, "Connexion Ready Rewards", content);
      // *********************Fin du gros commentaire**************** //
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Une erreur s'est produite! " + error.message,
      });
    }
  },
  checkLogin: async (req, res) => {
    const link = req.params.link;
    let usrBdd = await UserModel.findOne(
      { linkTemp: link },
      {
        email: 0,
        username: 0,
        birthday: 0,
        gender: 0,
        locale: 0,
        isActive: 0,
        isVerified: 0,
        roles: 0,
        orders: 0,
      }
    );
    if (!usrBdd) {
      return res.sendStatus(403);
    } else {
      const now = new Date();
      const dateExplink = new Date(usrBdd.dateExplinkTemp);
      const token = usrBdd.token;
      usrBdd.token = "";
      usrBdd.linkTemp = "";
      usrBdd.dateExplinkTemp = null;
      const result = await usrBdd.save();
      if (dateExplink > now && token) {
        res.json({ success: true, token: token });
      } else {
        return res.sendStatus(403);
      }
    }
  },

  getAllTransactionsByUser: async (req, res) => {
    function compareTransactions(first, second) {
      return new Date(second.createdAt) - new Date(first.createdAt);
    }

    try {
      let url =process.env.HOST_TRANSACTIONS_API + '/transaction';
      url += '?$sort[createdAt]=-1';
      
      const idUserOriginal = req?.token?.user?._id;
      const userToken = req?.tokenEncoded;
      const options = {
        method: "GET",
        headers: {
          Authorization: "Bearer " + userToken,
          "Content-Type": "application/json",
        },
      };
      fetch(url, options)
        .then((res) => res.json())
        .then((json) => {
          let data = [];
          let totalTransactions = json?.data.filter(
            (tr) => tr?.userId === idUserOriginal
          ).length;

          res.json({
            success: true,
            transactions: json?.data
              .filter(
                (tr) =>
                  tr?.userId === idUserOriginal &&
                  tr?.action.toLowerCase() != "user.order" &&  tr?.action.toLowerCase() != "user.refund"
              )
              .sort(compareTransactions)
              .slice(0, 2000),
            totalTransactions: totalTransactions,
          });
        });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Une erreur s'est produite! " + JSON.stringify(error),
      });
    }
  },
  getCmd: async (req, res) => {
    function compareCmd(first, second) {
      return new Date(second.date) - new Date(first.date);
    }
    try {
      const idUserOriginal = req?.token?.user?._id;
      let usrBdd = await UserModel.findOne(
        { idUserOriginal: idUserOriginal },
        {
          email: 0,
          username: 0,
          birthday: 0,
          gender: 0,
          locale: 0,
          isActive: 0,
          isVerified: 0,
          roles: 0,
        }
      );
      if (!usrBdd) {
        res.status(401).json({
          success: false,
          message: "Utilisateur non trouvé ",
        });
      } else {
        res.json({ success: true, orders: usrBdd.orders.sort(compareCmd) });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Une erreur s'est produite! " + JSON.stringify(error),
      });
    }
  },
};

module.exports = user;
