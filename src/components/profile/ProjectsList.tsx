import React, { useState } from "react";
import { FaProjectDiagram, FaPlus } from "react-icons/fa";
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
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-indigo-300 flex items-center gap-2"><FaProjectDiagram /> Projects</span>
        <button type="button" className="text-indigo-400" onClick={() => setShowProjModal(true)}><FaPlus /></button>
      </div>
      <ul className="space-y-1">
        {projects.map((p, i) => (
          <li key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded px-2 py-1">
            <span>
              {p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{p.name}</a> : p.name}
              {" - "}{p.description}
            </span>
            <button type="button" className="text-red-400" onClick={() => removeProject(i)}>Remove</button>
          </li>
        ))}
      </ul>
      {showProjModal && (
        <Modal onClose={() => setShowProjModal(false)} title="Add Project">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Project Name"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={projForm.name}
              onChange={e => setProjForm({ ...projForm, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={projForm.description}
              onChange={e => setProjForm({ ...projForm, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Link (optional)"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={projForm.link}
              onChange={e => setProjForm({ ...projForm, link: e.target.value })}
            />
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition shadow"
              onClick={addProject}
              type="button"
            >
              Add Project
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsList;