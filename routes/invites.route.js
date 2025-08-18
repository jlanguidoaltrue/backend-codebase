router.post("/invites/:token/accept", auth, async (req, res, next) => {
  try {
    const inv = await Invite.findOne({
      token: req.params.token,
      status: "pending",
    });
    if (!inv) return res.status(400).json({ message: "Invalid invite" });

    // upsert membership
    await Membership.findOneAndUpdate(
      { user: req.user.sub, tenant: inv.tenant },
      { $set: { role: inv.role, status: "active" } },
      { upsert: true, new: true }
    );

    inv.status = "accepted";
    await inv.save();

    res.json({ message: "Joined tenant." });
  } catch (e) {
    next(e);
  }
});
