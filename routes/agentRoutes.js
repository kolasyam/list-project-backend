const express = require("express");
const router = express.Router();
const {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
} = require("../controllers/agentController");
const { protect } = require("../Middleware/authMiddleware");
// const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createAgent).get(protect, getAgents);

router
  .route("/:id")
  .get(protect, getAgentById)
  .put(protect, updateAgent)
  .delete(protect, deleteAgent);

module.exports = router;
