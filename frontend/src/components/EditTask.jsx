import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { getTaskById, updateTask } from "../config/api";
import { useToast } from "../context/ToastContext";
import { getLocationText } from "../utils/taskLocation";
import {
  AlertCircle,
  Loader2,
  MapPin,
  ImagePlus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Info
} from "lucide-react";

const CATEGORIES = ["General", "Moving", "Cleaning", "Repairs", "Delivery", "Other"];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FieldLabel({ htmlFor, children, optional }) {
  return (
    <label htmlFor={htmlFor} className="input-label flex items-center justify-between">
      <span>{children}</span>
      {optional && <span className="normal-case font-normal text-slate-400 text-[10px] tracking-normal">Optional</span>}
    </label>
  );
}

export default function EditTask() {
  const { sidebarOpen } = useOutletContext() || { sidebarOpen: true };
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    category: "General",
  });

  const [pictureFile, setPictureFile] = useState(null);
  const [existingImage, setExistingImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const minStartDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  /* LOAD TASK */
  useEffect(() => {
    const loadTask = async () => {
      try {
        const { data } = await getTaskById(id);
        const task = data.task;
        setForm({
          title: task.title || "",
          description: task.description || "",
          location: getLocationText(task.location),
          startDate: task.startDate?.slice(0, 10) || "",
          startTime: task.startTime || "",
          endDate: task.endDate?.slice(0, 10) || "",
          endTime: task.endTime || "",
          category: task.category || "General",
        });
        setExistingImage(task.picture || "");
      } catch (err) {
        setError("Failed to load task. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* SAVE EDITED TASK */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.description || !form.location || !form.startDate || !form.startTime) {
      setError("Please fill in all required fields.");
      return;
    }

    if ((form.endDate && !form.endTime) || (!form.endDate && form.endTime)) {
      setError("End date and end time must be set together.");
      return;
    }

    const startsAt = new Date(`${form.startDate}T${form.startTime}`);
    if (Number.isNaN(startsAt.getTime())) {
      setError("Start date or time is invalid.");
      return;
    }

    if (form.endDate && form.endTime) {
      const endsAt = new Date(`${form.endDate}T${form.endTime}`);
      if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        setError("End date/time must be after start date/time.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let picture = existingImage;
      if (pictureFile) {
        picture = await fileToBase64(pictureFile);
      }

      await updateTask(id, { ...form, picture });
      toast.success("Task Updated", "Your changes have been saved successfully.", 3000);
      navigate("/dashboard/my-tasks");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-card p-20 flex flex-col items-center gap-3 text-slate-500 max-w-4xl mx-auto mt-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading task details...</p>
      </div>
    );
  }

  return (
    <div className={`mx-auto space-y-6 pb-12 page-enter ${sidebarOpen ? 'w-full' : 'max-w-5xl'}`}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="section-head">Edit Task</h2>
          <p className="section-sub mt-1 max-w-xl">Update your task details, schedule, or reference image.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
          <Info className="w-4 h-4" />
          Edit Mode
        </div>
      </div>

      {/* Form Card */}
      <div className="surface-card overflow-hidden">
        {error && (
          <div className="px-6 pt-6 pb-2">
            <div className="alert-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          
          {/* ── Section: Basic Info ──────────────────────────── */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-white shadow-sm">1</div>
              <h3 className="text-base font-bold text-slate-900">Task Details</h3>
            </div>
            
            <div className="space-y-5 pl-11">
              <div className="input-group">
                <FieldLabel htmlFor="title">Task Title *</FieldLabel>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Help move a sofa to the 3rd floor"
                  maxLength={120}
                  className="input-field"
                />
                <div className="flex justify-end mt-1">
                  <p className="text-[11px] text-slate-400 font-medium">{form.title.length}/120</p>
                </div>
              </div>

              <div className="input-group">
                <FieldLabel htmlFor="description">Description *</FieldLabel>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the work in detail — include any important notes, requirements, or tools needed."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="input-group">
                  <FieldLabel htmlFor="location">Location *</FieldLabel>
                  <div className="relative shadow-sm rounded-lg">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="City or neighbourhood"
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <FieldLabel htmlFor="category">Category *</FieldLabel>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="input-field cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Schedule ─────────────────────────────── */}
          <div className="p-6 md:p-8 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-white shadow-sm border border-slate-100">2</div>
              <h3 className="text-base font-bold text-slate-900">Schedule & Timing</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
              <div className="space-y-4 p-4 surface-card">
                <p className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 tracking-wide uppercase">Start Time</p>
                <div className="input-group">
                  <FieldLabel htmlFor="startDate">Date *</FieldLabel>
                  <div className="relative shadow-sm rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={handleChange}
                      min={minStartDate}
                      className="input-field pl-9 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <FieldLabel htmlFor="startTime">Time *</FieldLabel>
                  <div className="relative shadow-sm rounded-lg">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      className="input-field pl-9 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 surface-card">
                <p className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 tracking-wide uppercase">End Time <span className="text-slate-400 font-normal normal-case ml-1">(Optional)</span></p>
                <div className="input-group">
                  <FieldLabel htmlFor="endDate" optional>Date</FieldLabel>
                  <div className="relative shadow-sm rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={handleChange}
                      min={form.startDate || minStartDate}
                      className="input-field pl-9 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <FieldLabel htmlFor="endTime" optional>Time</FieldLabel>
                  <div className="relative shadow-sm rounded-lg">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={handleChange}
                      className="input-field pl-9 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Picture ──────────────────────────────── */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-white shadow-sm border border-slate-100">3</div>
              <h3 className="text-base font-bold text-slate-900">Reference Image <span className="text-sm font-normal text-slate-500 ml-1">(Optional)</span></h3>
            </div>
            
            <div className="pl-11">
              <div className={`
                border-2 border-dashed rounded-xl transition-all duration-200 p-6 flex flex-col items-center justify-center text-center
                ${pictureFile || existingImage ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-blue-400'}
              `}>
                {pictureFile || existingImage ? (
                  <div className="w-full max-w-sm">
                    <div className="relative rounded-lg overflow-hidden shadow-md border border-slate-200 bg-white">
                      <img
                        src={pictureFile ? URL.createObjectURL(pictureFile) : existingImage}
                        alt="preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setPictureFile(null); setExistingImage(""); }}
                        className="absolute top-2 right-2 p-2 bg-slate-900/60 hover:bg-red-600 backdrop-blur text-white rounded-lg transition-colors shadow-sm"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {pictureFile && (
                      <p className="text-xs text-slate-600 mt-3 font-medium truncate px-2">{pictureFile.name}</p>
                    )}
                  </div>
                ) : (
                  <div className="max-w-sm">
                    <div className="empty-icon mx-auto text-slate-400">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">Upload an image</h4>
                    <p className="text-sm text-slate-500 mb-4">Add a photo to help others understand the task better. PNG, JPG up to 5MB.</p>
                    <label
                      htmlFor="picture"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
                    >
                      Browse Files
                    </label>
                  </div>
                )}
                
                <input
                  id="picture"
                  name="picture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPictureFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────── */}
          <div className="p-6 md:p-8 bg-slate-50/80 border-t border-slate-200 pl-11 md:pl-8 flex items-center flex-wrap gap-4 justify-between">
            <button
              type="button"
              onClick={() => navigate("/dashboard/my-tasks")}
              className="btn-ghost"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-8 py-3 text-[15px] shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Changes...
                </>
              ) : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
