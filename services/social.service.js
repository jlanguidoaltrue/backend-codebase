import User from "../models/User.js";

export async function findOrCreateUserFromOAuth({
  provider,
  providerId,
  email,
  name,
  avatar,
}) {
  let user = await User.findOne({
    identities: { $elemMatch: { provider, providerId } },
  });

  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase() });
  }

  if (!user) {
    user = await User.create({
      username: (email || providerId).split("@")[0],
      email: email?.toLowerCase() || `${providerId}@${provider}.local`,
      password: "SOCIAL_LOGIN", // not used
      avatar: avatar || "",
      info: { name: name || "" },
      identities: [{ provider, providerId, email }],
    });
  } else {
    const has = user.identities.some(
      (i) => i.provider === provider && i.providerId === providerId
    );
    if (!has) {
      user.identities.push({ provider, providerId, email });
      if (!user.avatar && avatar) user.avatar = avatar;
      if (!user.info?.name && name) user.info = { ...(user.info || {}), name };
      await user.save();
    }
  }
  return user;
}
