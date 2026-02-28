const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message || err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  const payload = { success: false, message };
  if (process.env.NODE_ENV === "development") payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
