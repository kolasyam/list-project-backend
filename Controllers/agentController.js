// const asyncHandler = require("express-async-handler");
// const Agent = require("../models/Agent");
// const SubAgent = require("../models/SubAgent");

// const createSubAgent = asyncHandler(async (req, res) => {
//   const { name, email, mobile, password, agentid } = req.body;
//   // console.log("agentid", agentid);
//   console.log("body", req.body);
//   // if (!req.admin) {
//   //   res.status(401);
//   //   throw new Error("Unauthorized: Admin not logged in");
//   // }

//   const subagentExists = await SubAgent.findOne({ email });

//   if (subagentExists) {
//     res.status(400);
//     throw new Error("SubAgent already exists");
//   }

//   const subagent = await SubAgent.create({
//     name,
//     email,
//     mobile,
//     password,
//   });

//   if (subagent) {
//     res.status(201).json({
//       _id: subagent._id,
//       name: subagent.name,
//       email: subagent.email,
//       mobile: subagent.mobile,
//     });
//   } else {
//     res.status(400);
//     throw new Error("Invalid agent data");
//   }
// });

// const getAgents = asyncHandler(async (req, res) => {
//   // if (!req.admin) {
//   //   res.status(401);
//   //   throw new Error("Unauthorized: Admin not logged in");
//   // }

//   const agents = await SubAgent.find({ createdBy: req.admin._id }).select(
//     "-password"
//   );
//   if (!agents) {
//     res.send("No agents");
//   }

//   res.json(agents);
// });

// const getAgentById = asyncHandler(async (req, res) => {
//   const agent = await Agent.findById(req.params.id).select("-password");

//   if (agent) {
//     res.json(agent);
//   } else {
//     res.status(404);
//     throw new Error("Agent not found");
//   }
// });

// const updateAgent = asyncHandler(async (req, res) => {
//   const agent = await Agent.findById(req.params.id);

//   if (agent) {
//     agent.name = req.body.name || agent.name;
//     agent.email = req.body.email || agent.email;
//     agent.mobile = req.body.mobile || agent.mobile;

//     if (req.body.password) {
//       agent.password = req.body.password;
//     }

//     const updatedAgent = await agent.save();

//     res.json({
//       _id: updatedAgent._id,
//       name: updatedAgent.name,
//       email: updatedAgent.email,
//       mobile: updatedAgent.mobile,
//     });
//   } else {
//     res.status(404);
//     throw new Error("Agent not found");
//   }
// });
// const loginAgent = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;
//   // console.log(req);

//   const agent = await Agent.findOne({ email });
//   console.log("agent", agent);
//   if (!agent) {
//     res.status(401);
//     throw new Error("Invalid credentials");
//   }
//   res.json({
//     _id: agent._id,
//     name: agent.name,
//     email: agent.email,
//   });
// });

// const getAgentProfile = asyncHandler(async (req, res) => {
//   const agent = await Agent.findById(req.agent._id);
//   console.log("agentprofile", req.agent._id);

//   if (agent) {
//     res.json({
//       _id: agent._id,
//       name: agent.name,
//       email: agent.email,
//     });
//   } else {
//     res.status(404);
//     throw new Error("agent not found");
//   }
// });
// const deleteAgent = asyncHandler(async (req, res) => {
//   const agent = await Agent.findById(req.params.id);

//   if (!agent) {
//     res.status(404);
//     throw new Error("Agent not found");
//   }

//   // await Agent.findByIdAndDelete(req.params.id);
//   await Agent.deleteOne({ _id: req.params.id });

//   res.json({ message: "Agent removed successfully" });
// });

// module.exports = {
//   createSubAgent,
//   getAgents,
//   getAgentById,
//   updateAgent,
//   deleteAgent,
//   loginAgent,
//   getAgentProfile,
// };
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
