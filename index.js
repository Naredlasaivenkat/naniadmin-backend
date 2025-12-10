const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");

const app = express();
app.use(cors());
app.use(express.json());

// Load service account JSON from environment variable (Render)
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

// Create Google Auth client for FCM V1
const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// API endpoint called by your website
app.post("/sendOrderNotification", async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).send({ error: "title and body required" });
  }

  try {
    const accessToken = await getAccessToken();

    const payload = {
      message: {
        topic: "admin", // all admin devices receive
        notification: { title, body }
      }
    };

    const response = await axios.post(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.send({ success: true, result: response.data });

  } catch (err) {
    console.error("ERROR SENDING NOTIFICATION", err.response?.data || err.message);
    return res.status(500).send({ error: err.response?.data || err.message });
  }
});

app.get("/", (req, res) => {
  res.send({ ok: true, msg: "Backend alive" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
