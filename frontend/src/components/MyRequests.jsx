import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { getMyRequests } from '../config/api';
import {
  Send,
  User,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getLocationText } from "../utils/taskLocation";

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function MyRequests() {
  const { sidebarOpen } = useOutletContext() || { sidebarOpen: true };
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getMyRequests();
      setRequests(data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (taskId) => {
    if (!taskId) return;
    navigate(`/dashboard/task/${taskId}`);
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
  };

  return (
    <div className={`mx-auto space-y-6 pb-12 page-enter ${sidebarOpen ? 'w-full' : 'max-w-7xl'}`}>

      {/* Header */}
      <div className="surface-card p-5 md:p-6">
        <h2 className="page-title">My Sent Requests</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Track all task requests you have submitted and their current status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="stat-card border-l-4 border-l-blue-500">
          <p className="stat-value text-blue-700">{stats.total}</p>
          <p className="stat-label">Total Requests</p>
        </div>
        <div className="stat-card border-l-4 border-l-amber-400">
          <p className="stat-value text-amber-700">{stats.pending}</p>
          <p className="stat-label">Pending</p>
        </div>
        <div className="stat-card border-l-4 border-l-emerald-500">
          <p className="stat-value text-emerald-700">{stats.accepted}</p>
          <p className="stat-label">Accepted</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="surface-card p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert-error">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && requests.length === 0 && (
        <div className="surface-card">
          <div className="empty-state">
            <div className="empty-icon">
              <Send className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No requests sent yet
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">
              Browse the task feed and request tasks that match your skills.
            </p>
            <Link
              to="/dashboard/feed"
              className="btn-secondary text-sm mt-5 px-5 py-2.5"
            >
              Browse Task Feed
            </Link>
          </div>
        </div>
      )}

      {/* Requests List */}
      {!loading && !error && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              onClick={() => handleViewTask(req.task?._id)}
              className="surface-card-hover p-5 cursor-pointer transition hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row gap-4">

                <div className="flex-1 space-y-3">

                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-900">
                      {req.task?.title || "Task unavailable"}
                    </h3>

                    <span
                      className={`badge flex-shrink-0 ${
                        req.status === 'pending'
                          ? 'badge-amber'
                          : req.status === 'accepted'
                          ? 'badge-green'
                          : 'badge-red'
                      }`}
                    >
                      {req.status === 'pending' && <Clock className="w-3 h-3" />}
                      {req.status === 'accepted' && <CheckCircle className="w-3 h-3" />}
                      {req.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {req.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {req.task?.description}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {req.task?.createdBy?.first_name}{" "}
                        {req.task?.createdBy?.last_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{getLocationText(req.task?.location) || "-"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Requested {formatDate(req.createdAt)}</span>
                    </div>

                  </div>

                  {/* Button (optional UX improvement) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent double click
                      handleViewTask(req.task?._id);
                    }}
                    className="btn-primary text-xs px-3 py-1.5 mt-2"
                  >
                    View Task
                  </button>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}