const router = require("express").Router();
const Announcement = require("../models/Announcement");
const { protect, adminOnly } = require("../middleware/auth");
const wrap = require("../utils/wrap");
router.use(protect);
router.get("/", wrap(async (req, res) => res.json(await Announcement.find().populate("author", "name").sort({ createdAt: -1 }).limit(20))));
router.post("/", adminOnly, wrap(async (req, res) => {
  const { title, message, priority } = req.body;
  res.status(201).json(await Announcement.create({ title, message, priority, author: req.user._id }));
}));
router.delete("/:id", adminOnly, wrap(async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: "Announcement deleted" });
}));
module.exports = router;
