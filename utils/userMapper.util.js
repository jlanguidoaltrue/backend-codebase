export function toSafeUser(u) {
  if (!u) return null;
  return {
    id: u._id?.toString(),
    email: u.email,
    username: u.username,
    name: (u.info && u.info.name) || u.username || "",
    role: u.isAdmin ? "admin" : "user",
    avatarUrl: u.avatar || "",
    preferences: u.preferences || {},
    phone: u.phone || "",
    mfaEnabled: !!u?.mfa?.enabled,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
