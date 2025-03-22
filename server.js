const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const { errorHandler } = require("./Middleware/errorMiddleware");
require("dotenv").config();
require("./config/db");
const PORT = process.env.PORT || 8000;
app.get("/ping", (req, res) => {
  res.send("PONG");
});
app.use(bodyParser.json());
app.use(cors());
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/agents", require("./routes/agentRoutes"));
app.use("/api/lists", require("./routes/listRoutes"));
app.use("/api/subagents", require("./routes/subAgentRoutes"));
app.use("/api/subagents/lists", require("./routes/subAgentListRoutes"));
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
