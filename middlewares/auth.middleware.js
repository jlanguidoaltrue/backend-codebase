import jwt from "jsonwebtoken";

const { JWT_ACCESS_SECRET } = process.env;

export default function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : null;

  if (!token) return res.status(401).json({ message: "No token." });

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
}