const asyncHandler = require("express-async-handler");
const Agent = require("../models/Agent");
const bcrypt = require("bcryptjs"); // ✅ Use require instead of import
const jwt = require("jsonwebtoken");
const SubAgent = require("../models/SubAgent");

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.AGENT_JWT_SECRET, { expiresIn: "30d" });
// };

const AgentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const agent = await Agent.findOne({ email }).select("+password");

  if (!agent) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, agent.password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  res.json({
    _id: agent._id,
    name: agent.name,
    email: agent.email,
    token: jwt.sign({ id: agent._id }, process.env.AGENT_JWT_SECRET, {
      expiresIn: "30d",
    }), // Generate JWT Token
  });
});
const getAgentProfile = asyncHandler(async (req, res) => {
  if (req.agent) {
    res.json(req.agent); // Return logged-in agent details
  } else {
    res.status(404);
    throw new Error("Agent not found");
  }
});
const createSubAgent = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!req.agent) {
    res.status(401);
    throw new Error("Not authorized, agent not found");
  }

  const agentId = req.agent._id; // Get logged-in agent ID

  // Check if SubAgent email already exists
  const subAgentExists = await SubAgent.findOne({ email });
  if (subAgentExists) {
    res.status(400);
    throw new Error("SubAgent already exists");
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create SubAgent
  const subAgent = await SubAgent.create({
    name,
    email,
    mobile,
    password: hashedPassword,
    createdBy: agentId, // Store current agent ID
  });

  if (subAgent) {
    res.status(201).json({
      _id: subAgent._id,
      name: subAgent.name,
      email: subAgent.email,
      mobile: subAgent.mobile,
      createdBy: subAgent.createdBy,
    });
  } else {
    res.status(400);
    throw new Error("Invalid SubAgent data");
  }
});
const getSubAgents = asyncHandler(async (req, res) => {
  const subAgents = await SubAgent.find({ createdBy: req.agent._id });

  res.status(200).json(subAgents);
});
module.exports = {
  AgentLogin, // ✅ Correctly exported
  getAgentProfile,
  createSubAgent,
  getSubAgents,
};
