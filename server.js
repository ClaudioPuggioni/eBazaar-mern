require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const chalk = require("chalk");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

// mongoose express bcryptjs nodemon (--save-dev)

const DB_URI = "mongodb+srv://cau:KedQO7t5tUcmXgxJ@cluster0.5z2ih1z.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(DB_URI, {
    useUnifiedTopology: true,
    useNewURLParser: true,
  })
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

// All router imports
const authRouter = require("./routes/auth");
const catRouter = require("./routes/catRoute");
const adRouter = require("./routes/adRoute");
const { urlencoded } = require("express");
const app = express();

let corsOptions = {
  origin: "http://localhost:3000",
  // origin: true,
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};
// Cors usage
app.use(cors(corsOptions));

// Middleware usage
app.use(express.static("public"));
app.use(express.json());
// app.use(urlencoded({ extended: false }));
app.use(morgan("dev"));

// For convenience usage
app.use((req, res, next) => {
  next();
  console.log("==================================================================================================");
  console.log(
    "\n   ",
    chalk.grey(new Date()),
    "\n   ",
    chalk.greenBright(req.method),
    chalk.yellowBright(req.protocol + "://" + req.get("host") + req.originalUrl),
    "\n"
  );
  if (Object.keys(req.params).length > 0) console.log("    Params:", req.params);
  if (Object.keys(req.body).length > 0) console.log("    Body:", req.body);
  if (Object.keys(req.params).length > 0 || Object.keys(req.body).length > 0) console.log("");
  console.log("==================================================================================================");
});

// Router related usage
app.use("/auth", authRouter);
app.use("/category", authenticateRequest, catRouter);
app.use("/ads", authenticateRequest, adRouter);

app.listen(8000);

function authenticateRequest(req, res, next) {
  const authHeaderInfo = req.headers["authorization"];
  if (authHeaderInfo === undefined) {
    return res.status(401).send("No token was provided");
  }
  const token = authHeaderInfo.split(" ")[1];
  if (token === undefined) {
    return res.status(401).send("Proper token was not provided");
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userInfo = payload;
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).send("Invalid token provided");
  }
}
