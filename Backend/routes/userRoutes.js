const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const {
  updateProfile,
  updateProfilePicture,
  getProfile,
  changePassword,
  sendChangePasswordOtp,
  changePasswordWithOtp,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/profile", authMiddleware, getProfile);

router.put("/update-profile", authMiddleware, updateProfile); 
router.put(
  "/profile-picture",
  authMiddleware,
  upload.single("profilePicture"),
  updateProfilePicture,
);
router.put("/change-password", authMiddleware, changePassword);
router.post("/change-password/send-otp", authMiddleware, sendChangePasswordOtp);
router.put("/change-password/verify-otp", authMiddleware, changePasswordWithOtp);

module.exports = router;
