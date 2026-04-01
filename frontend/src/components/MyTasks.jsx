import React, { useEffect, useMemo, useState } from "react";
import { getMyTasks, deleteTask } from "../config/api";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import {
  Search,
  MapPin,
  Clock,
  AlertCircle,
  Inbox,
  Pencil,
  Trash2,
  Loader2,
  Plus,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatDateTime(dateValue, timeValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${datePart}${timeValue ? `, ${timeValue}` : ""}`;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800";

const STATUS_STYLE = {
  open:      "badge-green",
  assigned:  "badge-amber",
  completed: "badge-blue",
};

export default function MyTasks() {
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { sidebarOpen } = useOutletContext() || { sidebarOpen: true };

  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [query, setQuery]   = useState("");

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getMyTasks();
      setTasks(data?.tasks || []);
    } catch (err) {
      console.error("Load tasks error:", err);
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete Task",
      message: "This task will be permanently deleted. This action cannot be undone.",
      confirmText: "Delete Task",
      cancelText: "Keep Task",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleEdit = (id) => navigate(`/dashboard/edit-task/${id}`);
  const handleView = (id) => navigate(`/dashboard/task/${id}`);

  const filteredTasks = useMemo(() => {
    const s = query.toLowerCase();
    return tasks.filter((t) =>
      `${t.title} ${t.description} ${t.location}`.toLowerCase().includes(s)
    );
  }, [tasks, query]);

  return (
    <div className={`mx-auto space-y-6 pb-12 page-enter ${sidebarOpen ? 'w-full' : 'max-w-7xl'}`}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="surface-card p-6 md:p-7">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="section-head">My Tasks</h1>
            <p className="section-sub mt-1">Tasks you have created and are managing.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Task count badge */}
            {!loading && (
              <span className="badge-blue px-3.5 py-1.5 text-sm font-bold">
                {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
              </span>
            )}
            <Link to="/dashboard/add-task" className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              Post Task
            </Link>
          </div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="surface-card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="input-field pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────── */}
      {loading && (
        <div className="surface-card p-20 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading your tasks...</p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="alert-error">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────────── */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="surface-card">
          <div className="empty-state">
            <div className="empty-icon">
              <Inbox className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No tasks found</h3>
            <p className="section-sub mt-1.5 max-w-xs">
              {query ? "Try a different search term." : "You haven't posted any tasks yet."}
            </p>
            {!query && (
              <Link to="/dashboard/add-task" className="btn-primary text-sm mt-5 px-5">
                Post Your First Task
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Task Grid ──────────────────────────────────────────── */}
      {!loading && !error && filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filteredTasks.map((task) => (
            <article key={task._id} className="surface-card overflow-hidden flex flex-col card-lift">

              {/* Image */}
              <div className="h-44 overflow-hidden relative">
                <img
                  src={task.picture || DEFAULT_IMAGE}
                  alt={task.title}
                  className="h-full w-full object-cover"
                />
                {/* Status badge overlay */}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${STATUS_STYLE[task.status] || 'badge-slate'} shadow-sm`}>
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">

                {/* Title */}
                <h3 className="font-bold text-[16px] text-slate-900 mb-2 leading-snug">{task.title}</h3>

                {/* Description */}
                <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                {/* Meta */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[13px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{task.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{formatDateTime(task.startDate, task.startTime)}</span>
                  </div>
                </div>

                {/* Category pill */}
                {task.category && (
                  <div className="mb-4">
                    <span className="pill-tag">{task.category}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleView(task._id)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(task._id)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>

              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
