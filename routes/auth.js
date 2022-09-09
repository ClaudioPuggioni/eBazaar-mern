const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user");
const jwt = require("jsonwebtoken");

const refreshTokens = {};

router.post("/signup", async (req, res) => {
  const { username, email, password, confirm_password } = req.body;
  if (!username || !email || !password || !confirm_password) {
    return res.status(406).json({ error: "All fields are required" });
  }
  if (password !== confirm_password) {
    return res.status(406).json({ error: `Passwords don't match` });
  }

  const takenUsername = await UserModel.findOne({ username });
  if (takenUsername !== null) return res.status(501).json({ error: "Username is taken" });

  const existingUser = await UserModel.findOne({ email: email });
  if (existingUser !== null) {
    return res.status(406).json({ error: "Email already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(hash);

  const newUser = new UserModel({
    username,
    email,
    password: hash,
  });

  try {
    const savedUser = await newUser.save();
    console.log("SAVED USER:", savedUser);

    const payload = {
      id: savedUser.id,
      email: savedUser.email,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME });

    let resultObj = savedUser.toJSON();
    delete resultObj.password;
    return res.status(201).json({ accessToken, refreshToken, resultObj });
  } catch (e) {
    return res.status(501).json({ error: e.message });
  }
});

router.post("/login", async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(406).json({ error: "All fields are required" });
  }
  const existingUser = await UserModel.findOne({ email: email });
  if (existingUser !== null) {
    if (existingUser.username !== username) return res.status(401).json({ error: "Incorrect username" });
    const match = await bcrypt.compare(password, existingUser.password);
    if (match) {
      const payload = {
        id: existingUser.id,
        email: existingUser.email,
      };

      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME });
      const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME });

      refreshTokens[existingUser.id] = refreshToken;

      let resultObj = existingUser.toJSON();
      delete resultObj.password;
      return res.status(200).json({ accessToken, refreshToken, resultObj });
    } else {
      return res.status(400).json({ error: "Incorrect password" });
    }
  } else {
    return res.status(400).json({ error: "Account does not exist" });
  }
});

router.post("/token", async (req, res) => {
  const refreshToken = req.body.token;
  const id = req.body.id;

  console.log(req.body);
  // Get refresh token, validate refresh token, and generate new access token/
  if (!refreshToken) {
    return res.status(401).send("Please provide refresh token");
  }
  // if (refreshTokens[id] !== refreshToken) {
  //   console.log("STORED RTOKEN:", refreshTokens[id]);
  //   console.log("PROVIDED RTOKEN:", refreshToken);
  //   return res.status(401).send("Invalid token refresh request");
  // } // try implement refresh_token database apart from the 3 we have.
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign({ id: payload.id, email: existingUser.email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
    });
    const refreshToken = jwt.sign({ id: payload.id, email: existingUser.email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
    });
    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(401).send(err.message);
  }
});

// router.post;

module.exports = router;
