const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  title: { type: String, required: [true, "Title is required"], trim: true },
  message: { type: String, required: [true, "Message is required"], trim: true },
  priority: { type: String, enum: ["Normal", "Important"], default: "Normal" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
}, { timestamps: true });
module.exports = mongoose.model("Announcement", schema);
