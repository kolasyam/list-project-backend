const express = require("express");
const router = express.Router();
const {
  uploadList,
  getLists,
  // getListById,
} = require("../controllers/listController");
// const { protect } = require("../middleware/authMiddleware");
const { protect } = require("../Middleware/authMiddleware");

router.route("/").get(protect, getLists);

router.post("/upload", protect, uploadList);

// router.route("/:id").get(protect, getListById);

module.exports = router;
