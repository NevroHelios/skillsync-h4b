import React, { useState } from "react";
import { FaProjectDiagram, FaPlus, FaTrashAlt, FaLink } from "react-icons/fa";
import { Project } from "./types";
import Modal from "./Modal";

type ProjectsListProps = {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
};

const ProjectsList = ({ projects, setProjects }: ProjectsListProps) => {
  const [showProjModal, setShowProjModal] = useState(false);
  const [projForm, setProjForm] = useState<Project>({ name: "", description: "", link: "" });

  const addProject = () => {
    setProjects([...projects, projForm]);
    setProjForm({ name: "", description: "", link: "" });
    setShowProjModal(false);
  };

  const removeProject = (idx: number) => setProjects(projects.filter((_, i) => i !== idx));

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 shadow-sm">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
        <span className="font-semibold text-lg text-indigo-300 flex items-center gap-2">
          <FaProjectDiagram /> Projects
        </span>
        <button
          type="button"
          className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-gray-700/50"
          onClick={() => setShowProjModal(true)}
          aria-label="Add Project"
        >
          <FaPlus />
        </button>
      </div>
      {/* Enhanced List Styling */}
      {projects.length > 0 ? (
        <ul className="space-y-3">
          {projects.map((p, i) => (
            <li key={i} className="flex items-start justify-between text-sm bg-gray-900/40 rounded-md p-3 border border-gray-700/30 shadow-inner transition-shadow hover:shadow-md">
              <div className="flex-1 mr-3">
                <span className="font-medium text-gray-100 block mb-0.5">{p.name}</span>
                {p.description && <p className="text-gray-400 text-xs mb-1">{p.description}</p>}
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center gap-1 group"
                  >
                    <FaLink className="group-hover:scale-110 transition-transform" />
                    <span>View Project</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                className="text-red-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-900/30 mt-1"
                onClick={() => removeProject(i)}
                aria-label="Remove Project"
              >
                <FaTrashAlt size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 text-sm italic py-4">No projects added yet.</p>
      )}
      {/* Modal remains the same */}
      {showProjModal && (
        <Modal onClose={() => setShowProjModal(false)} title="Add Project">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Project Name"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={projForm.name}
              onChange={e => setProjForm({ ...projForm, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={projForm.description}
              onChange={e => setProjForm({ ...projForm, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Link (optional, e.g., https://...)"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={projForm.link}
              onChange={e => setProjForm({ ...projForm, link: e.target.value })}
            />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700/50">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-600/80 text-gray-200 font-semibold border border-gray-600/80 transition-all duration-200 text-sm"
                onClick={() => setShowProjModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 disabled:hover:shadow-none disabled:hover:scale-100 text-sm"
                onClick={addProject}
                disabled={!projForm.name.trim()}
              >
                Add Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsList;