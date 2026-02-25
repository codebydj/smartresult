const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/smartresult";

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✓ MongoDB Connected Successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error.message);
    console.warn(
      "⚠️  Running in offline mode - database features will be limited",
    );
    console.warn("💡 To use MongoDB, install it locally or use MongoDB Atlas");
    // Don't exit - allow server to run without database
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✓ MongoDB Disconnected");
  } catch (error) {
    console.error("✗ MongoDB Disconnect Error:", error.message);
  }
};

module.exports = { connectDB, disconnectDB };
