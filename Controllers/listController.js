const asyncHandler = require("express-async-handler");
const csv = require("csv-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const Agent = require("../models/Agent");
const List = require("../models/List");

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

const uploadList = asyncHandler(async (req, res) => {
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
      const agents = await Agent.find({ createdBy: req.admin.id }).select(
        "_id"
      );
      if (agents.length === 0) {
        res.status(400);
        throw new Error(
          "No agents found. Please add agents before uploading lists."
        );
      }

      const contacts = await parseFile(req.file);

      if (!validateContacts(contacts)) {
        fs.unlinkSync(req.file.path);
        res.status(400);
        throw new Error(
          "Invalid file format. Please ensure your file has FirstName, Phone, and Notes columns"
        );
      }

      const distributedList = distributeContacts(contacts, agents);

      const list = await List.create({
        fileName: req.file.originalname,
        uploadedBy: req.admin.id,
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

const getLists = asyncHandler(async (req, res) => {
  const lists = await List.find({ uploadedBy: req.admin.id }).populate(
    "distributions.agent",
    "name email mobile"
  );
  res.json(lists);
});

const getListById = asyncHandler(async (req, res) => {
  const list = await List.findById(req.params.id).populate(
    "distributions.agent",
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

const distributeContacts = (contacts, agents) => {
  const distributions = [];
  // const agentCount = Math.min(agents.length, 5); // Use max 5 agents
  const agentCount = agents.length;
  const contactsPerAgent = Math.floor(contacts.length / agentCount);
  const remainder = contacts.length % agentCount;

  // Initialize distributions array
  for (let i = 0; i < agentCount; i++) {
    distributions.push({
      agent: agents[i]._id,
      contacts: [],
    });
  }

  // Distribute contacts evenly
  let contactIndex = 0;
  for (let i = 0; i < agentCount; i++) {
    // Add base number of contacts
    for (let j = 0; j < contactsPerAgent; j++) {
      distributions[i].contacts.push(contacts[contactIndex]);
      contactIndex++;
    }

    // Add one more contact to early agents if there's a remainder
    if (i < remainder) {
      distributions[i].contacts.push(contacts[contactIndex]);
      contactIndex++;
    }
  }

  return distributions;
};

module.exports = { uploadList, getLists, getListById };
