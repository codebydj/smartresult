const { getResult } = require("../services/scraperService");

exports.getResult = async (req, res) => {
  const { pin, semester } = req.body || req.query || {};

  if (!pin) {
    return res.status(400).json({ error: "PIN is required" });
  }

  try {
    const result = await getResult(pin, semester);
    res.json(result);
  } catch (err) {
    console.error("Error fetching result:", err);
    res.status(500).json({ error: "Failed to fetch result" });
  }
};
