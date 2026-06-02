// config/mongodb.js

const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("ℹ️ MongoDB already connected");
    return;
  }

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    // retry after 5 seconds
    console.log("🔁 Retrying MongoDB connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// ======================
// CONNECTION EVENTS
// ======================
mongoose.connection.on("connected", () => {
  console.log("📡 Mongoose connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

// ======================
// GRACEFUL SHUTDOWN
// ======================
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB connection closed (app terminated)");
  process.exit(0);
});

module.exports = connectDB;