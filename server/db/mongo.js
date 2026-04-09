import mongoose from "mongoose";

// ── Review schema ──────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    review: { type: Object, required: true },
    score: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Review = mongoose.model("Review", reviewSchema);

// ── Connect ────────────────────────────────────────────────
export async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
    }
}
