export function requireSuperadmin(req, res, next) {
  const u = req.user || {};
  const isSuper =
    u.isSuperAdmin === true || u.role === "superadmin" || u.isAdmin === true;

  if (!isSuper) return res.status(403).json({ message: "Forbidden" });
  next();
}
