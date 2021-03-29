const mongoose = require("mongoose");

// schema 
const OffreSchema = new mongoose.Schema({
  titre: String,
  description: { type: String, default: '' },
  dateCreation:  { type: Date, default: new Date() },
  lienExterne:  { type: String, default: '' },
  dateFin:  { type: Date, default: null },
  statut:  { type: String, default: 'active' },
  prix: { type: Number, default: 0 },
  devise: { type: String, default: 'EUR' },
  virtuel: { type: Boolean, default: true },
  pays: { type: String, default: 'France' },
});

const Offre = mongoose.model("Offre", OffreSchema);

module.exports = Offre;
