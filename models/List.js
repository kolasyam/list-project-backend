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

const ListSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  distributions: [
    {
      agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
        required: true,
      },
      contacts: [ContactSchema],
    },
  ],
});

module.exports = mongoose.model("List", ListSchema);
