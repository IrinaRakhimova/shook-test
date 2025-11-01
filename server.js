const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// store answers by questionId
const answers = new Map();

// Send question to Zapier
app.post("/ask", async (req, res) => {
  try {
    const questionId = Date.now().toString(); // unique ID per question
    const webhookURL = process.env.ZAPIER_WEBHOOK;

    // Save placeholder so frontend waits for it
    answers.set(questionId, null);

    // Send to Zapier, including questionId
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

// Zapier posts answers here
app.post("/receive-answer", (req, res) => {
  const { questionId, answer } = req.body;
  console.log("Received from Zapier:", req.body);

  if (questionId) {
    answers.set(questionId, answer);
  }
  res.send("Answer received");
});

// Frontend polls this
app.get("/latest-answer/:id", (req, res) => {
  const answer = answers.get(req.params.id);
  res.json({ answer });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));