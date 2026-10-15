import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  getProjectsApi,
  createProjectApi,
  deleteProjectApi,
} from '../services/api';
import {
  FolderPlus,
  Trash2,
  ExternalLink,
  Calendar,
  AlertCircle,
  RefreshCw,
  Plus,
  CheckCircle,
  Search,
  X,
  Layers,
  Database,
} from 'lucide-react';

/* ── Skeleton placeholder for loading state ── */
function ProjectCardSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="flex gap-2 pt-2">
        <div className="skeleton h-5 w-12 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
      <div className="skeleton h-8 w-full rounded-lg mt-2" />
    </div>
  );
}

/* ── Env snapshot badge strip ── */
function EnvBadgeStrip({ project }) {
  // In a real implementation these would come from snapshot counts
  // The project doesn't carry this data yet, so we show static env tiers
  return (
    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-800/50">
      <span className="text-[10px] font-mono text-slate-600 mr-0.5">Tiers</span>
      <Badge variant="dev" size="xs">Dev</Badge>
      <Badge variant="test" size="xs">Test</Badge>
      <Badge variant="prod" size="xs">Prod</Badge>
    </div>
  );
}

/* ── Create Project Modal body ── */
function CreateProjectForm({ onSuccess, onClose }) {
  const toast = useToast();
  const nameRef = useRef(null);
  const [name, setName]     = useState('');
  const [desc, setDesc]     = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError]   = useState('');

  // auto-focus handled by Modal, but also set here for safety
  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Project name cannot be empty'); return; }

    try {
      setCreating(true);
      const res = await createProjectApi({ name: name.trim(), description: desc.trim() });
      if (res.success && res.data) {
        toast.success(`Project "${res.data.name}" created successfully!`);
        onSuccess(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error creating project';
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="proj-name" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          Project / Service Name <span className="text-red-400">*</span>
        </label>
        <input
          id="proj-name"
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="e.g., Payment Gateway, Auth Service, User API"
          required
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-600
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="proj-desc" className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          Description <span className="text-slate-600">(Optional)</span>
        </label>
        <textarea
          id="proj-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Primary microservice handling transaction workflows and checkout webhooks."
          rows={3}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-600
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-600 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
            text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors
            shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {creating ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Creating...</span></>
          ) : (
            <><CheckCircle className="w-3.5 h-3.5" /><span>Create Project</span></>
          )}
        </button>
      </div>
    </form>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard({ onSelectProject }) {
  const { user } = useAuth();
  const toast = useToast();

  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchQuery, setSearch]  = useState('');
  const [isModalOpen, setModal]   = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProjectsApi();
      if (res.success && res.data) setProjects(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load projects';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (projectId, projectName) => {
    if (!window.confirm(`Delete project "${projectName}"? This cannot be undone.`)) return;
    try {
      await deleteProjectApi(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      toast.success(`Project "${projectName}" deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete project');
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setModal(false);
  };

  /* Filtered list */
  const filtered = searchQuery.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/70">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Project Workspaces
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.name && <span className="text-slate-400 font-medium">{user.name}</span>}
            {user?.name ? ' · ' : ''}
            Manage applications and track configuration parity across deployment tiers
          </p>
        </div>

        <button
          id="btn-new-project"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
            text-white rounded-lg text-sm font-semibold transition-all duration-150
            shadow-lg shadow-emerald-950/40
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950
            shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      {projects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="project-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg
              text-sm text-slate-200 placeholder:text-slate-600
              focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProjects}
            className="px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg font-mono text-white transition-colors text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 && projects.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-14 text-center max-w-lg mx-auto my-8 animate-fade-in">
          <div className="h-14 w-14 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 mb-4">
            <FolderPlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No projects yet</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Create your first workspace to represent an application, microservice, or backend API.
          </p>
          <button
            onClick={() => setModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Project</span>
          </button>
        </div>
      ) : filtered.length === 0 && searchQuery ? (
        /* No search results */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center max-w-sm mx-auto">
          <Search className="w-6 h-6 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">No projects match</p>
          <p className="text-xs text-slate-600 mt-1">
            No results for <span className="text-slate-400 font-mono">"{searchQuery}"</span>
          </p>
          <button onClick={() => setSearch('')} className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Clear search
          </button>
        </div>
      ) : (
        /* Project cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project, idx) => (
            <div
              key={project._id}
              className="project-card group bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div>
                {/* Card top row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
                    {project.name}
                  </h3>
                  <button
                    id={`btn-delete-${project._id}`}
                    onClick={() => handleDelete(project._id, project.name)}
                    title={`Delete "${project.name}"`}
                    aria-label={`Delete project ${project.name}`}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/40 transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem] leading-relaxed">
                  {project.description || 'No description provided for this project.'}
                </p>

                {/* Env badges */}
                <EnvBadgeStrip project={project} />
              </div>

              {/* Card footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
                  <Calendar className="w-3 h-3" />
                  {new Date(project.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>

                <button
                  id={`btn-open-${project._id}`}
                  onClick={() => onSelectProject && onSelectProject(project)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors group/link focus:outline-none"
                  aria-label={`Open workspace for ${project.name}`}
                >
                  <span>Open Workspace</span>
                  <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats bar when projects exist */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center gap-6 text-[11px] text-slate-600 font-mono pt-2 border-t border-slate-800/50">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            3 environment tiers each
          </span>
          {searchQuery && filtered.length !== projects.length && (
            <span className="text-emerald-500">
              Showing {filtered.length} of {projects.length}
            </span>
          )}
        </div>
      )}

      {/* ── Create Project Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModal(false)}
        title="Create New Project"
        size="md"
      >
        <CreateProjectForm
          onSuccess={handleProjectCreated}
          onClose={() => setModal(false)}
        />
      </Modal>
    </div>
  );
}
