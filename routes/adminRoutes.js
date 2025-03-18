const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
} = require("../controllers/adminController");
// const { protect } = require("../middleware/authMiddleware");
const { protect } = require("../Middleware/authMiddleware");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", protect, getAdminProfile);
router.post("/logout", logoutAdmin);
module.exports = router;
