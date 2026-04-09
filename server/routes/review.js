import { Router } from "express";
import { runCodeReview } from "../agent/index.js";
import { Review } from "../db/mongo.js";

const router = Router();

// POST /api/review — run agent and save result
router.post("/review", async (req, res) => {
    try {
        const { code, filename, language } = req.body;

        if (!code || code.trim() === "") {
            return res.status(400).json({ error: "No code provided" });
        }

        console.log(`\n🔍 Reviewing: ${filename} (${language})`);
        const review = await runCodeReview(code, filename || "untitled", language || "javascript");

        // Save to MongoDB (optional, don't block if DB is down)
        try {
            await Review.create({
                filename: filename || "untitled",
                language: language || "javascript",
                code,
                review,
                score: review.score || 0
            });
        } catch (dbErr) {
            console.error("MongoDB save failed:", dbErr.message);
        }

        res.json({ success: true, review });

    } catch (err) {
        console.error("Review route error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/history — fetch last 20 reviews
router.get("/history", async (req, res) => {
    try {
        const history = await Review.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select("filename language score createdAt review");
        res.json({ success: true, history });
    } catch (err) {
        console.error("History fetch failed:", err.message);
        res.json({ success: true, history: [] });
    }
});

// GET /api/review/:id — fetch single review by ID
router.get("/review/:id", async (req, res) => {
    try {
        const item = await Review.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Review not found" });
        res.json({ success: true, review: item.review, filename: item.filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
