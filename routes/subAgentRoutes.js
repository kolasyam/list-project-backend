// const express = require("express");
// const router = express.Router();
// const { AgentLogin } = require("../Controllers/subAgentController");
// router.post("/login", AgentLogin);

// module.exports = router;
const express = require("express");
const router = express.Router();
const {
  AgentLogin,
  getAgentProfile,
  createSubAgent,
  getSubAgents,
} = require("../Controllers/subAgentController"); // ✅ Correct import
const { protectAgent } = require("../Middleware/authMiddleware");

router.post("/login", AgentLogin);
router.get("/profile", protectAgent, getAgentProfile);
router.post("/create", protectAgent, createSubAgent);
router.get("/", protectAgent, getSubAgents);
module.exports = router;
