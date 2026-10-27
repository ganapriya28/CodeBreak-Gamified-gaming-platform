const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { signToken, requireAuth };
