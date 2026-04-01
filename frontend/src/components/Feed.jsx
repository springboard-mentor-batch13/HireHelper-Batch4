import React, { useEffect, useMemo, useState } from "react";
import { getFeedTasks, requestTask } from "../config/api";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  MapPin,
  Calendar as CalendarIcon,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Rss,
  Search,
  SlidersHorizontal,
  Eye,
} from "lucide-react";

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MetaChip({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-slate-600">
      <span className="flex-shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

const CATEGORIES = ["All", "Moving", "Cleaning", "General", "Assembly", "Garden", "Delivery"];

export default function Feed() {
  const navigate = useNavigate();
  const { sidebarOpen } = useOutletContext() || { sidebarOpen: true };

  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [searchTitle, setSearchTitle]       = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [requestState, setRequestState]     = useState({});

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getFeedTasks();
      setTasks(data?.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const titleMatch    = task.title?.toLowerCase().includes(searchTitle.toLowerCase());
      const locationMatch = task.location?.toLowerCase().includes(searchLocation.toLowerCase());
      const categoryMatch = activeCategory === "All" || task.category === activeCategory;
      return titleMatch && locationMatch && categoryMatch;
    });
  }, [tasks, searchTitle, searchLocation, activeCategory]);

  const pendingIds = useMemo(() =>
    new Set(Object.keys(requestState).filter((id) => requestState[id]?.loading)),
    [requestState]
  );

  const handleRequest = async (taskId) => {
    setRequestState((prev) => ({ ...prev, [taskId]: { loading: true, success: "", error: "" } }));
    try {
      const { data } = await requestTask(taskId);
      setRequestState((prev) => ({ ...prev, [taskId]: { loading: false, success: data?.message || "Request Sent Successfully", error: "" } }));
    } catch (err) {
      setRequestState((prev) => ({ ...prev, [taskId]: { loading: false, success: "", error: err.response?.data?.message || err.response?.data?.error || "Request failed" } }));
    }
  };

  const handleView = (taskId) => {
    navigate(`/dashboard/task/${taskId}`);
  };

  return (
    <div className={`mx-auto space-y-6 pb-12 page-enter ${sidebarOpen ? 'w-full' : 'max-w-7xl'}`}>

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="surface-card p-6 md:p-7">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="section-head">Task Feed</h1>
            <p className="section-sub mt-1">Browse open tasks posted by users and help them.</p>
          </div>
          {!loading && !error && (
            <span className="badge-blue px-4 py-1.5 text-sm font-bold">
              {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"} Open
            </span>
          )}
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="surface-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search task name..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                activeCategory === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────── */}
      {loading && (
        <div className="surface-card p-20 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading tasks...</p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="alert-error">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Empty ─────────────────────────────────────────────── */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="surface-card">
          <div className="empty-state">
            <div className="empty-icon">
              <Rss className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No tasks found</h3>
            <p className="section-sub mt-1.5 max-w-xs">Try adjusting your search or category filter.</p>
          </div>
        </div>
      )}

      {/* ── Task Grid ─────────────────────────────────────────── */}
      {!loading && !error && filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filteredTasks.map((task) => {
            const state = requestState[task._id] || { loading: false, success: "", error: "" };
            const isDisabled = state.loading || state.success || pendingIds.has(task._id) || task.status !== "open";
            const userName = task.createdBy
              ? `${task.createdBy.first_name || ""} ${task.createdBy.last_name || ""}`.trim()
              : "Anonymous";

            return (
              <article key={task._id} className="surface-card-hover overflow-hidden flex flex-col">

                {/* Task image */}
                {task.picture ? (
                  <div className="h-44 overflow-hidden border-b border-slate-100">
                    <img src={task.picture} alt={task.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-2 bg-blue-600 w-full" />
                )}

                <div className="p-5 flex flex-col flex-1">

                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{task.title}</h3>
                    <span className={`flex-shrink-0 badge ${task.status === 'open' ? 'badge-green' : 'badge-amber'}`}>
                      {task.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                  {/* Meta chips */}
                  <div className="space-y-1.5 mb-4">
                    <MetaChip icon={<User className="w-3.5 h-3.5" />}>{userName || "Anonymous"}</MetaChip>
                    <MetaChip icon={<MapPin className="w-3.5 h-3.5" />}>{task.location}</MetaChip>
                    <MetaChip icon={<CalendarIcon className="w-3.5 h-3.5" />}>
                      {formatDate(task.startDate)}{task.startTime ? ` · ${task.startTime}` : ""}
                    </MetaChip>
                  </div>

                  {/* Category tag */}
                  {task.category && (
                    <div className="mb-4">
                      <span className="pill-tag">{task.category}</span>
                    </div>
                  )}

                  {/* Feedback messages */}
                  {state.error && <p className="text-xs text-red-600 mb-2 font-medium">{state.error}</p>}
                  {state.success && <p className="text-xs text-emerald-600 mb-2 font-medium">{state.success}</p>}

                  {/* Action button */}
                  <div className="mt-auto space-y-2">
                    <button
                      onClick={() => handleView(task._id)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleRequest(task._id)}
                      disabled={isDisabled}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer border ${
                        state.success
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : task.status !== "open"
                          ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      }`}
                    >
                      {state.loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </span>
                      ) : state.success ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Request Sent
                        </span>
                      ) : task.status !== "open" ? (
                        "Task Closed"
                      ) : (
                        "Send Request to Help"
                      )}
                    </button>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
