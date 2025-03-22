const express = require("express");
const { protectAgent } = require("../Middleware/authMiddleware");
const {
  uploadSubAgentList,
  getSubAgentLists,
} = require("../Controllers/subAgentListController");
const router = express.Router();
router.route("/").get(protectAgent, getSubAgentLists);

router.post("/upload", protectAgent, uploadSubAgentList);
module.exports = router;
