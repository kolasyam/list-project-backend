const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Admin = require("../models/Admin");
const Agent = require("../models/Agent");

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
const protectAgent = asyncHandler(async (req, res, next) => {
  // let token;
  // if (req.headers.authorization) {
  //   try {
  //     token = req.headers.authorization.split(" ")[1];
  //     console.log("agenttoken", token);
  //     const decoded = jwt.verify(token, process.env.AGENT_JWT_SECRET);
  //     req.agent = await Agent.findById(decoded.id).select("-password");
  //     next();
  //   } catch (error) {
  //     res.status(401);
  //     throw new Error("Not authorized, invalid token");
  //   }
  // } else {
  //   res.status(401);
  //   throw new Error("Not authorized, no token provided");
  // }
  let token;

  if (req.headers.authorization) {
    token = req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : req.headers.authorization;

    console.log("Extracted Token:", token);

    try {
      const decoded = jwt.verify(token, process.env.AGENT_JWT_SECRET);
      console.log("Decoded Token:", decoded);

      const agent = await Agent.findById(decoded.id);
      console.log("Fetched Agent from DB:", agent);

      if (!agent) {
        throw new Error("Agent not found in DB");
      }

      req.agent = agent;
      next();
    } catch (error) {
      console.error("JWT Error:", error.message);
      return res.status(401).json({ error: "Invalid token" });
    }
  } else {
    return res.status(401).json({ error: "No token provided" });
  }
});

module.exports = { protect, protectAgent };
