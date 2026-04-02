import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getTaskById } from "../config/api";
import { getLocationText } from "../utils/taskLocation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  User,
  Tag,
  FileText,
} from "lucide-react";

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200";

export default function TaskDetails() {
  const { sidebarOpen } = useOutletContext() || { sidebarOpen: true };
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await getTaskById(id);
        setTask(data?.task || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load task details.");
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  const mapUrl = useMemo(() => {
    const locationText = getLocationText(task?.location);
    if (!locationText) return "";
    if (locationText.toLowerCase().includes("location available after acceptance")) return "";
    return `https://www.google.com/maps?q=${encodeURIComponent(locationText)}&output=embed`;
  }, [task?.location]);

  if (loading) {
    return (
      <div className="surface-card p-20 flex flex-col items-center gap-3 text-slate-500 max-w-4xl mx-auto mt-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading task details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className={`mx-auto space-y-6 pb-12 page-enter ${sidebarOpen ? "w-full" : "max-w-5xl"}`}>
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost text-sm px-3 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="alert-error">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error || "Task not found."}</p>
        </div>
      </div>
    );
  }

  const ownerName = task.createdBy
    ? `${task.createdBy.first_name || ""} ${task.createdBy.last_name || ""}`.trim() || "Unknown"
    : "Unknown";

  return (
    <div className={`mx-auto space-y-6 pb-12 page-enter ${sidebarOpen ? "w-full" : "max-w-5xl"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost text-sm px-3 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className={`badge ${task.status === "open" ? "badge-green" : "badge-amber"}`}>
          {task.status}
        </span>
      </div>

      <article className="surface-card overflow-hidden">
        <div className="h-56 sm:h-72 overflow-hidden border-b border-slate-100">
          <img
            src={task.picture || DEFAULT_IMAGE}
            alt={task.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-6 md:p-7 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{task.title}</h1>
            <p className="text-sm text-slate-600 mt-2">Full task details and location map.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Task Owner</p>
              <p className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                {ownerName}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Category</p>
              <p className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                {task.category || "-"}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Start</p>
              <p className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDate(task.startDate)} {task.startTime ? `· ${task.startTime}` : ""}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">End</p>
              <p className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                {task.endDate ? `${formatDate(task.endDate)}${task.endTime ? ` · ${task.endTime}` : ""}` : "-"}
              </p>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <span>{task.description || "-"}</span>
            </p>
          </div>

          <div className="surface-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Location</p>
            <p className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <span>{getLocationText(task.location) || "-"}</span>
            </p>
          </div>
        </div>
      </article>

      <section className="surface-card p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">Map</h2>
        {mapUrl ? (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <iframe
              title="task-location-map"
              src={mapUrl}
              className="w-full h-[320px] sm:h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="alert-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Location is unavailable for this task.</p>
          </div>
        )}
      </section>
    </div>
  );
}
