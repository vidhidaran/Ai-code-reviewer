import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
console.log("URI:", process.env.MONGODB_URI);
try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("SUCCESS");
    process.exit(0);
} catch (e) {
    console.log("FAILED:", e.message);
    process.exit(1);
}
