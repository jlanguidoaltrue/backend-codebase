import { asyncHandler } from "../utils/asyncHandler.js";
import {
  findUserByUsername,
  assertAccountUsable,
  verifyPasswordOrLock,
  issueTokens,
  refreshAccessToken,
  registerUser,
} from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await findUserByUsername(username);
  await assertAccountUsable(user);
  await verifyPasswordOrLock(user, password);

  const { token, refreshToken } = issueTokens(user);

  res.json({
    token,
    refreshToken, // remove if you switch to cookie approach
    user: {
      username: user.username,
      isAdmin: user.isAdmin,
      mfaEnabled: user?.mfa?.enabled || false,
    },
  });
});

export const logout = asyncHandler(async (_req, res) => {
  // If using cookies:
  // res.clearCookie("refreshToken");
  res.json({ message: "Logged out." });
});

export const refresh = asyncHandler(async (req, res) => {
  // If using cookies:
  // const refreshToken = req.cookies?.refreshToken;
  const { refreshToken } = req.body;
  const result = refreshAccessToken(refreshToken);
  res.json(result);
});

export const register = asyncHandler(async (req, res) => {
  await registerUser(req.body);
  res.json({ message: "Registration successful. Please set up 2FA." });
});
