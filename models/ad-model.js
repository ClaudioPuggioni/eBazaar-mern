const mongoose = require("mongoose");
// title, description, price, seller (user id), category (category id), interested_buyers[], buyers, created_at, closed_at

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // (user id)
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }, // (category id)
  interested_buyers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  closed_at: { type: Date },
  imageUrl: { type: String },
});

const AdModel = new mongoose.model("Ad", adSchema);
module.exports = AdModel;
