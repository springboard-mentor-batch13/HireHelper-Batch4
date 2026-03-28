const Task = require("../models/Task");
const cloudinary = require("../config/cloudinary");
const { getPublicIdFromUrl } = require("../utils/getPublicId");

/* ===================================== */
/*            CREATE TASK                */
/* ===================================== */

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      startDate,
      startTime,
      endDate,
      endTime,
      picture,
    } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    let imageUrl = "";

    if (picture) {
      const uploadResult = await cloudinary.uploader.upload(picture, {
        folder: "hirehelper/tasks",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
        ],
      });

      imageUrl = uploadResult.secure_url;
    }

    const task = await Task.create({
      createdBy: req.user.id,
      title,
      description,
      category,
      location,
      startDate,
      startTime,
      endDate,
      endTime,
      picture: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================================== */
/*            GET MY TASKS               */
/* ===================================== */

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      createdBy: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================================== */
/*            FEED TASKS                 */
/* ===================================== */

exports.getFeedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      createdBy: { $ne: req.user.id },
      status: "open",
    })
      .populate("createdBy", "first_name last_name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================================== */
/*            GET TASK BY ID             */
/* ===================================== */

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "first_name last_name profilePicture")
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================================== */
/*            GET ASSIGNED TASKS         */
/* ===================================== */

exports.getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id,
    })
      .populate("createdBy", "first_name last_name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================================== */
/*            UPDATE TASK                */
/* ===================================== */

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /* Only creator can update */

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this task",
      });
    }

    const {
      title,
      description,
      category,
      location,
      startDate,
      startTime,
      endDate,
      endTime,
      picture,
    } = req.body;

    let imageUrl = task.picture;

    /* Upload new image if provided */

    if (picture && picture.startsWith("data:image")) {
      // DELETE OLD IMAGE
      if (task.picture) {
        const publicId = getPublicIdFromUrl(task.picture);

        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(picture, {
        folder: "hirehelper/tasks",
      });

      imageUrl = uploadResult.secure_url;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        title,
        description,
        category,
        location,
        startDate,
        startTime,
        endDate,
        endTime,
        picture: imageUrl,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================================== */
/*            DELETE TASK                */
/* ===================================== */

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /* Only creator can delete */

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this task",
      });
    }
    // DELETE IMAGE FROM CLOUDINARY
    if (task.picture) {
      const publicId = getPublicIdFromUrl(task.picture);

      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary Delete Result:", result);
      } else {
        console.log("Invalid publicId, skipping delete");
      }
    }

    await Task.findByIdAndDelete(taskId);

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
