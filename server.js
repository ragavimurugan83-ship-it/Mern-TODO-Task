
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Serve frontend files from the project folder
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Todo Task Manager server is running"
  });
});

// Send the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Todo Task Manager running on port ${PORT}`);
});
