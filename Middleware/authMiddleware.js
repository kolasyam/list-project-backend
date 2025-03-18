const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Admin = require("../models/Admin");

const protect = asyncHandler(async (req, res, next) => {
  // console.log("Authorization Header:", req.headers.authorization); // ✅ Log header

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    console.log(req.headers.authorization);
    try {
      // token = req.headers.authorization.replace(/^"|"$/g, ""); // ✅ Remove extra quotes
      token = req.headers.authorization.split(" ")[1];
      console.log("Extracted Token:", token); // ✅ Debug

      if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token provided");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded Token:", decoded); // ✅ Debug

      req.admin = await Admin.findById(decoded.id).select("-password");

      if (!req.admin) {
        res.status(401);
        throw new Error("Admin not found");
      }

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    console.error("No token in headers");
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { protect };
