const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token

    if (!token) {
      return res.status(401).json({
        error: "No token provided. Please login.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired. Please login again.",
      });
    }
    return res.status(401).json({
      error: "Invalid token. Please login.",
    });
  }
};

module.exports = authenticateAdmin;
