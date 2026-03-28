const User = require("../models/User");
const Task = require("../models/Task");
const Request = require("../models/Request");
const bcrypt = require("bcryptjs");
const { validatePassword } = require("../utils/validatePassword");

/* ================= UPDATE PROFILE PICTURE ================= */

exports.updateProfilePicture = async (req, res) => {
  try {
    console.log(req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path },
      { returnDocument: "after" }
    ).select("profilePicture");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: updatedUser.profilePicture,
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

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { returnDocument: "after" }
    ).select("-password -otp -otpExpiry");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
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
        message: "User not found"
      });
    }

    const [tasksPosted, tasksCompleted, requestsSent] = await Promise.all([
      Task.countDocuments({ createdBy: req.user.id }),
      Task.countDocuments({ createdBy: req.user.id, status: "completed" }),
      Request.countDocuments({ requestedBy: req.user.id })
    ]);

    res.json({
      success: true,
      user,
      stats: {
        tasksPosted,
        tasksCompleted,
        requestsSent
      }
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/* ================= CHANGE PASSWORD ================= */

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain uppercase, lowercase, number, special character and minimum 8 characters",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};
