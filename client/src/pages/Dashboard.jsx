import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getProjectsApi, 
  createProjectApi, 
  deleteProjectApi 
} from '../services/api';
import { 
  FolderPlus, 
  Layers, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  GitCompare
} from 'lucide-react';

export default function Dashboard({ onSelectProject }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProjectsApi();
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!newProjectName.trim()) {
      setModalError('Project name cannot be empty');
      return;
    }

    try {
      setCreating(true);
      const res = await createProjectApi({
        name: newProjectName.trim(),
        description: newProjectDesc.trim()
      });

      if (res.success && res.data) {
        setProjects([res.data, ...projects]);
        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Error creating project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return;
    }

    try {
      await deleteProjectApi(projectId);
      setProjects(projects.filter((p) => p._id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Project Workspaces</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your applications and track configuration parity across deployment tiers
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProjects}
            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 rounded font-mono text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <p className="text-xs font-mono">Loading workspaces...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center max-w-xl mx-auto my-8">
          <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 mb-4">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No projects registered</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Create your first project workspace to represent an application, microservice, or backend API.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Project</span>
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {project.name}
                  </h3>
                  <button
                    onClick={() => handleDeleteProject(project._id, project.name)}
                    title="Delete project"
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
                  {project.description || 'No description provided for this project.'}
                </p>

                {/* Target Environments Badges */}
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">Tiers:</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                    Dev
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                    Test
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    Prod
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>

                <button
                  onClick={() => onSelectProject && onSelectProject(project)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <span>Open Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-slate-100">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Project / Service Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Payment Gateway, Auth Service"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Primary microservice handling transaction workflows and checkout webhooks."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
