// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  res.status(404).json({ error: "Admin dashboard disabled" });
};

// Get graph data for SGPA visualization
exports.getSGPAGraphData = async (req, res, next) => {
  res.status(404).json({ error: "Admin dashboard disabled" });
};

// Get search history
exports.getSearchHistory = async (req, res, next) => {
  res.status(404).json({ error: "Admin dashboard disabled" });
};

// Clear old search history (Admin only)
exports.clearOldSearchHistory = async (req, res, next) => {
  res.status(404).json({ error: "Admin dashboard disabled" });
};
