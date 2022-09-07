const express = require("express");
const router = express.Router();
const AdModel = require("../models/ad-model");
const UserModel = require("../models/user");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require("bcryptjs/dist/bcrypt");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// list all ads
router.get("/", async (req, res) => {
  // let foundAds = await AdModel.find({});
  // if (foundAds !== null) {
  //   if (foundAds.length > 0) {
  //     return res.status(200).send(foundAds);
  //   } else {
  //     return res.status(204).send("There are no ads");
  //   }
  // } else {
  //   return res.status(500).send("Server Error");
  // }

  const ads = await AdModel.find({})
    // .populate("seller", "username") // name field of seller
    // .populate("buyer", "username") // name field of buyer
    .populate("category", "name") // name field of category
    .populate("interested_buyers", "username"); // name field of interested buyers
  // coiincidentally all these AdModel fields have items with fields called 'name'
  return res.status(200).json(ads);
});

// add new ad
router.post("/", upload.single("image"), async (req, res) => {
  const { title, description, price, seller, category, interested_buyers, buyer, created_at, closed_at } = req.body;
  console.log("REQ.BODY:", req.body);
  if (!title || !description || !price || !seller || !category) {
    return res.status(406).send("Required field missing");
  }
  let imageUrl = false;
  if (req.file) {
    imageUrl = process.env.BASE_URL + "uploads/" + req.file.filename;
  }

  const newAd = new AdModel({
    title,
    description,
    price,
    seller,
    category,
    interested_buyers,
    buyer,
    created_at,
    closed_at,
    imageUrl: imageUrl,
  });
  try {
    const savedAd = await newAd.save();
    await UserModel.findOneAndUpdate({ _id: seller }, { $addToSet: { ads: savedAd._id } }, { returnDocument: "after" });
    return res.status(200).send("Ad listed successfully");
  } catch (e) {
    return res.status(501).send(e.message);
  }
});

// get detail of single ad
router.get("/:id", async (req, res) => {
  const ad = await AdModel.findOne({ _id: req.params.id }).populate("seller", "username");
  // const seller = await UserModel.findOne({ _id: ad.seller });
  console.log("singlead:", ad);
  // ad.seller = seller.username;
  if (ad !== null) {
    return res.status(200).send(ad);
  } else {
    return res.status(500).send("Ad does not exist");
  }
});

// delete a particular ad
router.delete("/:id", async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(406).json({ error: "All fields are required" });
  }

  const existingUser = await UserModel.findOne({ _id: userId });

  if (existingUser !== null) {
    const match = await bcrypt.compare(password, existingUser.password);

    if (match) {
      const deletedAd = await AdModel.deleteOne({ _id: req.params.id }, { returnDocument: "after" });
      console.log(deletedAd);
      if (deletedAd.deletedCount > 0) {
        return res.status(200).json({ adId: req.params.id, category: deletedAd.category });
      } else {
        return res.status(500).send("Ad deletion failed");
      }
    } else {
      return res.status(400).json({ error: "Incorrect password" });
    }
  } else {
    return res.status(400).json({ error: "Account does not exist" });
  }
});

// show buying interest
router.post("/:id/interest", async (req, res) => {
  // console.log("REQ.BODY:", req.body);
  const userFound = await UserModel.find({ _id: req.body.userId });
  const adFound = await AdModel.find({ _id: req.params.id });

  // console.log("INTEREST-REQUSER:", userFound);
  // console.log("INTEREST-ADFOUND:", adFound);

  if (adFound[0].seller === userFound[0]._id) return res.status(403).send("Cannot show interest in own ad");

  for (const buyer of adFound[0].interested_buyers) {
    if (buyer.toString() === userFound[0]._id.toString()) {
      const removeInterest = await AdModel.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { interested_buyers: req.body.userId } },
        { returnDocument: "after" }
      );
      console.log("REMOVEDINTEREST", removeInterest);
      return res.status(202).json(removeInterest);
      // return res.status(202).send("Interest removed successfully");
    }
  }

  if (userFound.length === 0 && adFound.length === 0) return res.status(501).send("User and Ad do not exist");
  if (userFound.length === 0) return res.status(501).send("User does not exist");
  if (adFound.length === 0) return res.status(501).send("Ad does not exist");

  const addedInterest = await AdModel.findOneAndUpdate(
    { _id: req.params.id },
    { $addToSet: { interested_buyers: req.body.userId } },
    { returnDocument: "after" }
  );
  console.log("ADDEDINTEREST", addedInterest);
  return res.status(202).json(addedInterest);
  // return res.status(202).send("Interest logged successfully");
});

// close ad with particular buyer
router.post("/:id/close/:buyerId", async (req, res) => {
  const userFound = await UserModel.find({ _id: req.params.buyerId });
  const adFound = await AdModel.find({ _id: req.params.id });

  if (userFound.length === 0 && adFound.length === 0) return res.status(501).send("User and Ad do not exist");
  if (userFound.length === 0) return res.status(501).send("User does not exist");
  if (adFound.length === 0) return res.status(501).send("Ad does not exist");

  await AdModel.findOneAndUpdate({ _id: req.params.id }, { $addToSet: { closed_at: Date.now() } }, { returnDocument: "after" });
  return res.status(202).send("Ad was closed successfully");
});

module.exports = router;
