const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// store answers by questionId
const answers = new Map();

// Send question to Zapier for AI processing
app.post("/ask", async (req, res) => {
  try {
    const questionId = Date.now().toString(); // unique ID per question
    const webhookURL = process.env.ZAPIER_WEBHOOK;

    answers.set(questionId, null);

    // Send to Zapier (AI flow)
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, question: req.body.question }),
    });

    res.json({ status: "sent", questionId });
  } catch (err) {
    console.error("Error sending to Zapier:", err);
    res.status(500).json({ error: "Failed to send to Zapier" });
  }
});

// Zapier posts AI answers here
app.post("/receive-answer", (req, res) => {
  const { questionId, answer } = req.body;
  console.log("Received from Zapier:", req.body);

  if (questionId) {
    answers.set(questionId, answer);
  }
  res.send("Answer received");
});

// NEW: Endpoint to send question + email manually to Zapier team inbox
app.post("/send-to-team", async (req, res) => {
  const { question, email } = req.body;
  const zapierHook = process.env.ZAPIER_TEAM_WEBHOOK;

  try {
    await fetch(zapierHook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, email }),
    });

    res.json({ success: true, message: "Sent to Zapier team successfully" });
  } catch (err) {
    console.error("Error sending to team Zapier hook:", err);
    res.status(500).json({ success: false, error: "Failed to send to Zapier" });
  }
});

// Frontend polls for answer
app.get("/latest-answer/:id", (req, res) => {
  const answer = answers.get(req.params.id);
  res.json({ answer });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);