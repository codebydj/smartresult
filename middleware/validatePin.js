const { validationResult, check } = require("express-validator");

const pinChecks = [
  check("pin")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("PIN is required")
    .matches(/^[0-9A-Z]{10}$/)
    .withMessage(
      "PIN must be 10 characters: digits and uppercase letters only",
    ),
];

// Middleware factory usable for POST (body) and GET (query)
function validatePin(req, res, next) {
  // Normalize incoming pin into body for validator
  if (req.method === "GET") {
    if (req.query && req.query.pin)
      req.body.pin = String(req.query.pin).trim().toUpperCase();
  } else if (req.method === "POST") {
    if (req.body && req.body.pin)
      req.body.pin = String(req.body.pin).trim().toUpperCase();
  }

  // Run checks
  Promise.all(pinChecks.map((validator) => validator.run(req)))
    .then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errMsg = errors
          .array()
          .map((e) => e.msg)
          .join(". ");
        return res.status(400).json({ success: false, message: errMsg });
      }

      // Attach sanitized PIN to req.cleanPin
      req.cleanPin = (req.body.pin || "").toUpperCase();
      next();
    })
    .catch((err) => {
      console.error("validatePin error:", err);
      return res
        .status(500)
        .json({ success: false, message: "PIN validation failed" });
    });
}

module.exports = validatePin;
