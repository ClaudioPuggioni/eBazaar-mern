// name, active (boolean), createdAt
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const CategoryModel = new mongoose.model("Category", categorySchema);
module.exports = CategoryModel;
