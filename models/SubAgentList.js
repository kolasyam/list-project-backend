const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
});

const SubAgentListSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  uploadedByAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent", // Uploaded by the current logged-in agent
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  distributions: [
    {
      subAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubAgent", // Distributing to sub-agents
        required: true,
      },
      contacts: [ContactSchema], // List of contacts assigned to each sub-agent
    },
  ],
});

module.exports = mongoose.model("SubAgentList", SubAgentListSchema);
