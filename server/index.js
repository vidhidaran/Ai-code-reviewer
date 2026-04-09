import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import reviewRouter from "./routes/review.js";
import { mcpManager } from "./mcpClient/index.js";
import { connectMongo } from "./db/mongo.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use("/api", reviewRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "AI Code Reviewer backend running" });
});

// Connect databases and MCP servers then start
await connectMongo();
await mcpManager.connectAll();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await mcpManager.disconnectAll();
  process.exit(0);
});
