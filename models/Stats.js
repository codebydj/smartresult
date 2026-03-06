const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema({
  _id: { type: String, default: "global" },
  totalSearches: { type: Number, default: 0 },
});

module.exports = mongoose.model("Stats", statsSchema);