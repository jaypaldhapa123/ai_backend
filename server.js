require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ Schema
const messageSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Model
const Message = mongoose.model("Message", messageSchema);

// ✅ Home route
app.get("/", (req, res) => {
  res.json({
    status: "Server is running 🚀",
  });
});

// ✅ Store data (called from Cloudflare Worker)
app.post("/api/store", async (req, res) => {
  try {
    // 🔒 Security check
    if (req.headers["x-api-key"] !== process.env.API_KEY) {
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    const { ip, input, response } = req.body;

    if (!ip || !input || !response) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const newMessage = await Message.create({
      ip,
      input,
      response,
    });

    res.json({
      success: true,
      data: newMessage,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ Get all stored data
app.get("/api/data", async (req, res) => {
  try {
    const data = await Message.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
