const mongoose = require("mongoose");

const acceptedTaskSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    helper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    taskOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },

    status: {
      type: String,
      enum: ["assigned", "in_progress", "completed"],
      default: "assigned",
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcceptedTask", acceptedTaskSchema);