import React from 'react';
import { Experience, Skill } from "@/components/profile/types";

// Define types locally or import
interface GitHubRepo { name: string; html_url: string; description: string | null; language: string | null; languages: Record<string, number>; }
interface NewProjectState { name: string; description: string; link: string; skills: string[]; experience: string; }

interface AddProjectModalProps {
  showAddProject: boolean;
  setShowAddProject: (show: boolean) => void;
  newProject: NewProjectState;
  setNewProject: React.Dispatch<React.SetStateAction<NewProjectState>>;
  githubRepos: GitHubRepo[];
  skills: Skill[];
  experiences: Experience[];
  handleAddProject: (e?: React.FormEvent) => Promise<void>;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({
  showAddProject, setShowAddProject, newProject, setNewProject,
  githubRepos, skills, experiences, handleAddProject
}) => {
  if (!showAddProject) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/80 p-2 sm:p-4 backdrop-blur-md">
      <div
        className="bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/60 w-full max-w-lg flex flex-col justify-center p-6 sm:p-8"
        style={{
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.22), 0 1.5px 6px 0 rgba(0,0,0,0.13)",
          minHeight: "min(90vh, 600px)",
          maxHeight: "95vh",
          margin: "auto"
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="font-bold text-xl sm:text-2xl text-gray-100 tracking-tight">Add New Project</div>
          <button
            onClick={() => setShowAddProject(false)}
            className="text-gray-500 hover:text-red-400 text-3xl font-bold transition-all duration-150 px-2 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400 -mt-2 -mr-2"
            aria-label="Close"
          >&times;</button>
        </div>
        {typeof window !== "undefined" && (
          <form
            onSubmit={handleAddProject}
            className="flex flex-col gap-5 overflow-y-auto pr-2 -mr-2"
            style={{ maxHeight: "calc(95vh - 150px)" }}
          >
            {githubRepos.length > 0 && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">Import from GitHub (Optional):</label>
                <select
                  className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
                  value=""
                  onChange={e => {
                    const repo = githubRepos.find(r => r.html_url === e.target.value);
                    if (repo) {
                      setNewProject({
                        name: repo.name,
                        description: repo.description || "",
                        link: repo.html_url,
                        skills: repo.languages ? Object.keys(repo.languages) : (repo.language ? [repo.language] : []),
                        experience: "",
                      });
                    }
                  }}
                >
                  <option value="">-- Select a Repo --</option>
                  {githubRepos.map((repo) => (
                    <option key={repo.html_url} value={repo.html_url}>
                      {repo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Project Name<span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Enter project name"
                className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
                value={newProject.name}
                onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Description</label>
              <textarea
                placeholder="Describe your project"
                className="w-full h-24 resize-none bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
                value={newProject.description}
                onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Project Link</label>
              <input
                type="url"
                placeholder="e.g., https://github.com/user/repo"
                className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
                value={newProject.link}
                onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))}
              />
            </div>
            {skills.length > 0 && (
               <div>
                 <label className="block text-sm text-gray-400 mb-1.5 font-medium">Link Skills:</label>
                 <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-gray-700/50 rounded-lg bg-gray-800/50">
                   {skills.map(skill => (
                     <label key={skill} className="flex items-center gap-1.5 text-xs cursor-pointer bg-gray-700/80 px-3 py-1.5 rounded-full hover:bg-blue-800/60 hover:text-blue-100 transition has-[:checked]:bg-blue-600 has-[:checked]:text-white font-medium">
                       <input
                         type="checkbox"
                         className="hidden"
                         checked={newProject.skills.includes(skill)}
                         onChange={e => {
                           setNewProject(p => ({
                             ...p,
                             skills: e.target.checked
                               ? [...p.skills, skill]
                               : p.skills.filter(s => s !== skill)
                           }));
                         }}
                       />
                       <span>{skill}</span>
                     </label>
                   ))}
                 </div>
               </div>
            )}
            {experiences.length > 0 && (
               <div>
                 <label className="block text-sm text-gray-400 mb-1.5 font-medium">Link Experience (Optional):</label>
                 <select
                   className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
                   value={newProject.experience}
                   onChange={e => setNewProject(p => ({ ...p, experience: e.target.value }))}
                 >
                   <option value="">-- Select Related Experience --</option>
                   {experiences.map((exp, idx) => (
                     <option key={idx} value={`${exp.company} (${exp.years})`}>
                       {exp.company} ({exp.years})
                     </option>
                   ))}
                 </select>
               </div>
            )}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700/50">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-600/80 text-gray-200 font-semibold border border-gray-600/80 transition-all duration-200 text-sm"
                onClick={() => setShowAddProject(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 disabled:hover:shadow-none disabled:hover:scale-100 text-sm"
                disabled={!newProject.name.trim()}
              >
                Add Project
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddProjectModal;
