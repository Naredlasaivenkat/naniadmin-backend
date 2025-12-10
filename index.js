const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// FCM server key will be provided via Render env var
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const API_KEY = process.env.API_KEY; // optional extra protection

if (!FCM_SERVER_KEY) {
  console.error("FCM_SERVER_KEY is not set. The server will not send notifications.");
}

app.get("/", (req, res) => {
  res.send({ ok: true, msg: "naniadmin backend alive" });
});

// Protected API to send order notification to admin topic
app.post("/sendOrderNotification", async (req, res) => {
  // (optional) check API key header
  if (API_KEY) {
    const reqKey = req.headers["x-api-key"];
    if (!reqKey || reqKey !== API_KEY) {
      return res.status(401).send({ success: false, error: "Unauthorized (invalid API key)" });
    }
  }

  const { title, body, data } = req.body || {};
  if (!FCM_SERVER_KEY) {
    return res.status(500).send({ success: false, error: "Server key not configured" });
  }
  if (!title || !body) {
    return res.status(400).send({ success: false, error: "title and body required" });
  }

  try {
    const payload = {
      to: "/topics/admin",
      notification: { title, body, sound: "default" },
      data: data || {}
    };

    const result = await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      payload,
      {
        headers: {
          "Authorization": `key=${FCM_SERVER_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.send({ success: true, result: result.data });
  } catch (error) {
    console.error("Error sending FCM:", error.response?.data || error.message);
    return res.status(500).send({ success: false, error: error.response?.data || error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
