const Request = require("../models/Request");
const Task = require("../models/Task");
const AcceptedTask = require("../models/AcceptedTask");
const { createNotification } = require("../utils/createNotification");

/* ================= REQUEST TASK ================= */

exports.requestTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.createdBy.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own task",
      });
    }

    if (task.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Task is not available for requests",
      });
    }

    const existing = await Request.findOne({
      task: taskId,
      requestedBy: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already requested this task",
      });
    }

    const request = await Request.create({
      task: taskId,
      requestedBy: req.user.id,
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    console.log("📢 Creating notification for task owner");

    await createNotification({
      recipient: task.createdBy.toString(),
      actor: req.user.id.toString(),
      task: task._id,
      request: request._id,
      type: "new_request",
      title: "New Task Request",
      message: "A user has requested your task",
      io,
      onlineUsers,
    });

    res.status(201).json({
      success: true,
      message: "Request sent successfully",
      request,
    });
  } catch (error) {
    console.error("❌ requestTask error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET REQUESTS FOR MY TASKS ================= */

exports.getRequestsForMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user.id });

    const taskIds = tasks.map((task) => task._id);

    const requests = await Request.find({
      task: { $in: taskIds },
    })
      .populate("requestedBy", "first_name last_name profilePicture")
      .populate("task")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("❌ getRequestsForMyTasks error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET MY REQUESTS ================= */

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      requestedBy: req.user.id,
    })
      .populate({
        path: "task",
        populate: {
          path: "createdBy",
          select: "first_name last_name profilePicture",
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("❌ getMyRequests error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= ACCEPT REQUEST ================= */

exports.acceptRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const request = await Request.findById(req.params.requestId)
      .populate("requestedBy")
      .populate("task");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request already processed",
      });
    }

    const task = await Task.findById(request.task._id);

    if (task.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // ✅ Accept request
    request.status = "accepted";
    await request.save();

    const existingAcceptedTask = await AcceptedTask.findOne({
      task: request.task._id,
    });

    if (existingAcceptedTask) {
      return res.status(400).json({
        message: "Task already assigned",
      });
    }

    await AcceptedTask.create({
      task: request.task._id,
      helper: request.requestedBy._id,
      taskOwner: req.user.id,
      request: request._id,
    });

    // ✅ Assign task
    await Task.findByIdAndUpdate(request.task._id, {
      status: "assigned",
      assignedTo: request.requestedBy._id,
    });

    // ✅ Reject other requests
    const rejectedRequests = await Request.find({
      task: request.task._id,
      status: "pending",
      _id: { $ne: request._id },
    });

    await Request.updateMany(
      {
        task: request.task._id,
        status: "pending",
        _id: { $ne: request._id },
      },
      { status: "rejected" },
    );

    console.log("📢 Notifying accepted user");

    // ✅ Notify accepted user
    await createNotification({
      recipient: request.requestedBy._id.toString(),
      actor: req.user.id.toString(),
      task: request.task._id,
      request: request._id,
      type: "request_accepted",
      title: "Request Accepted",
      message: `Your request for "${request.task.title}" has been accepted`,
      io,
      onlineUsers,
    });

    console.log("📢 Notifying rejected users");

    // ✅ Notify rejected users
    for (const r of rejectedRequests) {
      await createNotification({
        recipient: r.requestedBy.toString(),
        actor: req.user.id.toString(),
        task: request.task._id,
        request: r._id,
        type: "request_rejected",
        title: "Request Rejected",
        message: `Your request for "${request.task.title}" was rejected`,
        io,
        onlineUsers,
      });
    }

    res.json({
      success: true,
      message: "Request accepted",
    });
  } catch (error) {
    console.error("❌ acceptRequest error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= REJECT REQUEST ================= */

exports.rejectRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const request = await Request.findById(req.params.requestId).populate(
      "task",
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request already processed",
      });
    }

    const task = await Task.findById(request.task._id);

    if (task.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    request.status = "rejected";
    await request.save();

    console.log("📢 Notifying rejected user");

    await createNotification({
      recipient: request.requestedBy.toString(),
      actor: req.user.id.toString(),
      task: request.task._id,
      request: request._id,
      type: "request_rejected",
      title: "Request Rejected",
      message: `Your request for "${request.task.title}" was rejected`,
      io,
      onlineUsers,
    });

    res.json({
      success: true,
      message: "Request rejected",
    });
  } catch (error) {
    console.error("❌ rejectRequest error:", error);
    res.status(500).json({ error: error.message });
  }
};
