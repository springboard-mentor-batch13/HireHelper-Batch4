const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    location: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      isHidden: {
        type: Boolean,
        default: true, // hidden by default
      },
    },

    startDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endDate: {
      type: Date,
    },

    endTime: {
      type: String,
    },

    picture: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "assigned", "completed"],
      default: "open",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
