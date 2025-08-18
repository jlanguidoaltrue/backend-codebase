router.get("/me/memberships", auth, async (req, res, next) => {
  try {
    const items = await Membership.find({ user: req.user.sub }).populate(
      "tenant role"
    );
    res.json({ data: { items } });
  } catch (e) {
    next(e);
  }
});
