const mongoose = require("mongoose");
const OffreModel = require("./offre");
// schema cmd = enfant
const OrderSchema = new mongoose.Schema({
  date: Date,
  statut: String,
  nom: String,
  prenom: String,
  address: String,
  address2: String,
  cp: String,
  ville: String,
  pays: String,
  email: String,
  offre: OffreModel.schema,
  idUserOriginal:String,
  usernameOriginal: String,
  emailUserOriginal:String,
});

const UserSchema = new mongoose.Schema({
  idUserOriginal:String,
  email: String,
  username: String,
  birthday: Date,
  gender: String,
  locale: String,
  isActive: Boolean,
  isVerified: Boolean,
  linkTemp:String,
  dateExplinkTemp:Date,
  token:String,
  roles: [],
  orders: [OrderSchema],
});
const User = mongoose.model("User", UserSchema);

module.exports = User;
