
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.error("MongoDB Error:", err.message));

// Issue Schema
const issueSchema = new mongoose.Schema({
  title: String,
  type: String,
  place: String,
  description: String,
  status: { type: String, default: "Reported" },
  priority: String,
  department: String,
  image: String,
  reportedBy: String
}, { timestamps: true });

const Issue = mongoose.model("Issue", issueSchema);

// Test route
app.get("/", (req, res) => {
  res.send("CivicLens Backend is Running!");
});

// Get all issues
app.get("/api/issues", async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create issue
app.post("/api/issues", async (req, res) => {
  try {
    const issue = await Issue.create(req.body);
    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
