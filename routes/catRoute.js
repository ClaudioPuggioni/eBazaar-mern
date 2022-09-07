const express = require("express");
const router = express.Router();
const CategoryModel = require("../models/category");

// list all categories
router.get("/", async (req, res) => {
  const foundCategories = await CategoryModel.find({});
  if (foundCategories !== null) {
    if (foundCategories.length > 0) {
      return res.status(200).send(foundCategories);
    } else {
      return res.status(204).send("There are no categories");
    }
  } else {
    return res.status(500).send("Server error");
  }
});

// add new category
router.post("/", async (req, res) => {
  const { name, active, created_at } = req.body;
  if (!name) {
    return res.status(406).send("Name cannot be empty");
  }

  const newCategory = new CategoryModel({
    name,
    active,
    created_at,
  });

  try {
    const savedCategory = await newCategory.save();
    return res.status(201).send("Category saved successfully" + savedCategory);
  } catch (e) {
    return res.status(501).send(e.message);
  }
});

// delete particular category
router.delete("/:id", async (req, res) => {
  const deletedCategory = await CategoryModel.deleteOne({ _id: req.params.id });
  if (deletedCategory.deletedCount > 0) {
    return res.status(200).send(`Category ${req.params.id} deleted successfully`);
  } else {
    return res.status(501).send(`Category deletion failed`);
  }
});

module.exports = router;
