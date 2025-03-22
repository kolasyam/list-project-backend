const asyncHandler = require("express-async-handler");
const csv = require("csv-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const Agent = require("../models/Agent");
const SubAgent = require("../models/SubAgent");
const SubAgentList = require("../models/SubAgentList");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /csv|xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Please upload only CSV or Excel files!");
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10000000 }, // 10MB max
});

const uploadSubAgentList = asyncHandler(async (req, res) => {
  upload.single("file")(req, res, async function (err) {
    if (err) {
      res.status(400);
      throw new Error(err);
    }

    if (!req.file) {
      res.status(400);
      throw new Error("Please upload a file");
    }

    try {
      const subAgents = await SubAgent.find({ createdBy: req.agent.id }).select(
        "_id"
      );
      if (subAgents.length === 0) {
        res.status(400);
        throw new Error(
          "No sub-agents found. Please add sub-agents before uploading lists."
        );
      }

      const contacts = await parseFile(req.file);

      if (!validateContacts(contacts)) {
        fs.unlinkSync(req.file.path);
        res.status(400);
        throw new Error(
          "Invalid file format. Please ensure your file has FirstName, Phone, and Notes columns."
        );
      }

      const distributedList = distributeContacts(contacts, subAgents);

      const list = await SubAgentList.create({
        fileName: req.file.originalname,
        uploadedByAgent: req.agent.id,
        distributions: distributedList,
      });

      fs.unlinkSync(req.file.path);

      res.status(201).json(list);
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500);
      throw new Error(`Error processing file: ${error.message}`);
    }
  });
});

const getSubAgentLists = asyncHandler(async (req, res) => {
  const lists = await SubAgentList.find({
    uploadedByAgent: req.agent.id,
  }).populate("distributions.subAgent", "name email mobile");
  res.json(lists);
});

const getSubAgentListById = asyncHandler(async (req, res) => {
  const list = await SubAgentList.findById(req.params.id).populate(
    "distributions.subAgent",
    "name email mobile"
  );

  if (list) {
    res.json(list);
  } else {
    res.status(404);
    throw new Error("List not found");
  }
});

const parseFile = async (file) => {
  const contacts = [];

  const ext = path.extname(file.originalname).toLowerCase();
  const filePath = path.resolve(__dirname, "../uploads", file.filename);
  if (ext === ".csv") {
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          contacts.push({
            firstName: row.FirstName || "",
            phone: row.Phone || "",
            notes: row.Notes || "",
          });
        })
        .on("end", () => {
          resolve(contacts);
        })
        .on("error", reject);
    });
  } else if (ext === ".xlsx" || ext === ".xls") {
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    data.forEach((row) => {
      contacts.push({
        firstName: row.FirstName || "",
        phone: row.Phone || "",
        notes: row.Notes || "",
      });
    });

    return contacts;
  }

  throw new Error("Unsupported file format");
};

const validateContacts = (contacts) => {
  if (contacts.length === 0) return false;

  const firstContact = contacts[0];
  return (
    "firstName" in firstContact &&
    "phone" in firstContact &&
    "notes" in firstContact
  );
};

const distributeContacts = (contacts, subAgents) => {
  if (subAgents.length === 0 || contacts.length === 0) return [];

  // Step 1: Create a unique list based on firstName
  const uniqueContacts = [];
  const nameSet = new Set();

  contacts.forEach((contact) => {
    if (!nameSet.has(contact.firstName.toLowerCase())) {
      nameSet.add(contact.firstName.toLowerCase());
      uniqueContacts.push(contact);
    }
  });
  const distributions = [];
  const subAgentCount = subAgents.length;
  const contactsPerSubAgent = Math.floor(uniqueContacts.length / subAgentCount);
  const remainder = uniqueContacts.length % subAgentCount;

  for (let i = 0; i < subAgentCount; i++) {
    distributions.push({
      subAgent: subAgents[i]._id,
      contacts: [],
    });
  }

  let contactIndex = 0;
  for (let i = 0; i < subAgentCount; i++) {
    for (let j = 0; j < contactsPerSubAgent; j++) {
      distributions[i].contacts.push(contacts[contactIndex]);
      contactIndex++;
    }

    if (i < remainder) {
      distributions[i].contacts.push(contacts[contactIndex]);
      contactIndex++;
    }
  }

  return distributions;
};

module.exports = { uploadSubAgentList, getSubAgentLists, getSubAgentListById };
