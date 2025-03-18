const asyncHandler = require("express-async-handler");
const Agent = require("../models/Agent");

const createAgent = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!req.admin) {
    res.status(401);
    throw new Error("Unauthorized: Admin not logged in");
  }

  const agentExists = await Agent.findOne({ email, createdBy: req.admin._id });

  if (agentExists) {
    res.status(400);
    throw new Error("Agent already exists");
  }

  const agent = await Agent.create({
    name,
    email,
    mobile,
    password,
    createdBy: req.admin._id, // Associate agent with the logged-in admin
  });

  if (agent) {
    res.status(201).json({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      mobile: agent.mobile,
      createdBy: agent.createdBy, // Return the admin who created it
    });
  } else {
    res.status(400);
    throw new Error("Invalid agent data");
  }
});

const getAgents = asyncHandler(async (req, res) => {
  if (!req.admin) {
    res.status(401);
    throw new Error("Unauthorized: Admin not logged in");
  }

  const agents = await Agent.find({ createdBy: req.admin._id }).select(
    "-password"
  );
  if (!agents) {
    res.send("No agents");
  }

  res.json(agents);
});

const getAgentById = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id).select("-password");

  if (agent) {
    res.json(agent);
  } else {
    res.status(404);
    throw new Error("Agent not found");
  }
});

const updateAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (agent) {
    agent.name = req.body.name || agent.name;
    agent.email = req.body.email || agent.email;
    agent.mobile = req.body.mobile || agent.mobile;

    if (req.body.password) {
      agent.password = req.body.password;
    }

    const updatedAgent = await agent.save();

    res.json({
      _id: updatedAgent._id,
      name: updatedAgent.name,
      email: updatedAgent.email,
      mobile: updatedAgent.mobile,
    });
  } else {
    res.status(404);
    throw new Error("Agent not found");
  }
});

const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (agent) {
    await agent.remove();
    res.json({ message: "Agent removed" });
  } else {
    res.status(404);
    throw new Error("Agent not found");
  }
});

module.exports = {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
};
