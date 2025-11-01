const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let latestAnswer = null;

// Send question to Zapier
app.post("/ask", async (req, res) => {
  try {
    const webhookURL = process.env.ZAPIER_WEBHOOK;
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    res.json({ status: "sent" });
  } catch (err) {
    console.error("Error sending to Zapier:", err);
    res.status(500).json({ error: "Failed to send to Zapier" });
  }
});

// Zapier posts answers here
app.post("/receive-answer", (req, res) => {
  console.log("Received from Zapier:", req.body);
  latestAnswer = req.body;
  res.send("Answer received");
});

// Frontend polls this
app.get("/latest-answer", (req, res) => {
  res.json(latestAnswer || {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));