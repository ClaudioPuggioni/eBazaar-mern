const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: "Username already taken" },
  email: { type: String, required: true },
  password: { type: String, required: true },
  ads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ad" }],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const UserModel = new mongoose.model("User", userSchema);
module.exports = UserModel;
