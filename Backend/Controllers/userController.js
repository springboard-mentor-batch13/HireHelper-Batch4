const User = require("../models/User");
const Task = require("../models/Task");
const Request = require("../models/Request");
const { getPublicIdFromUrl } = require("../utils/getPublicId");
const cloudinary = require("../config/cloudinary");
/* ================= UPDATE PROFILE PICTURE ================= */

exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (user.profilePicture) {
      const publicId = getPublicIdFromUrl(user.profilePicture);
      // console.log(publicId);

      if (!publicId) {
        console.log("Invalid publicId, skipping delete");
      } else {
        await cloudinary.uploader.destroy(publicId);
      }
    }
    user.profilePicture = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Update Profile Picture Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
    });
  }
};

/* ================= UPDATE PROFILE ================= */

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone_number } = req.body;

    const updates = {};

    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone_number) updates.phone_number = phone_number;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      returnDocument: "after",
    }).select("-password -otp -otpExpiry");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/* ================= GET PROFILE ================= */

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -otp -otpExpiry")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [tasksPosted, tasksCompleted, requestsSent] = await Promise.all([
      Task.countDocuments({ createdBy: req.user.id }),
      Task.countDocuments({ createdBy: req.user.id, status: "completed" }),
      Request.countDocuments({ requestedBy: req.user.id }),
    ]);

    res.json({
      success: true,
      user,
      stats: {
        tasksPosted,
        tasksCompleted,
        requestsSent,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};
