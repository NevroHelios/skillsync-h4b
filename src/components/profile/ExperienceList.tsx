import React, { useState } from "react";
import { FaBriefcase, FaPlus, FaTrashAlt, FaTags } from "react-icons/fa"; // Added FaTrashAlt, FaTags
import { Experience, Skill } from "./types";
import Modal from "./Modal";

type ExperienceListProps = {
  experiences: Experience[];
  setExperiences: (experiences: Experience[]) => void;
  availableSkills: Skill[];
};

const ExperienceList = ({ experiences, setExperiences, availableSkills }: ExperienceListProps) => {
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState<Experience>({
    company: "",
    years: "",
    skills: [],
  });

  const toggleSkill = (skill: Skill) => {
    setExpForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const addExperience = () => {
    setExperiences([...experiences, expForm]);
    setExpForm({
      company: "",
      years: "",
      skills: [],
    });
    setShowExpModal(false);
  };

  const removeExperience = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 shadow-sm">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
        <span className="font-semibold text-lg text-indigo-300 flex items-center gap-2">
          <FaBriefcase /> Experience
        </span>
        <button
          type="button"
          className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-gray-700/50"
          onClick={() => setShowExpModal(true)}
          aria-label="Add Experience"
        >
          <FaPlus />
        </button>
      </div>
      {/* Enhanced List Styling */}
      {experiences.length > 0 ? (
        <ul className="space-y-3">
          {experiences.map((exp, expIdx) => (
            <li key={expIdx} className="bg-gray-900/40 rounded-md p-3 border border-gray-700/30 shadow-inner transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <span className="font-medium text-gray-100 block">{exp.company}</span>
                  <span className="text-gray-400 text-xs">{exp.years}</span>
                </div>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-900/30"
                  onClick={() => removeExperience(expIdx)}
                  aria-label="Remove Experience"
                >
                  <FaTrashAlt size={14} />
                </button>
              </div>
              {/* Enhanced Skill Tags Display */}
              {exp.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-700/30">
                  <FaTags size={12} className="text-indigo-400 mr-1" />
                  {exp.skills.map((skill, skillIdx) => (
                    <span
                      key={skillIdx}
                      className="bg-indigo-600/70 text-indigo-100 px-2.5 py-0.5 rounded-full text-xs font-medium border border-indigo-500/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 text-sm italic py-4">No experience added yet.</p>
      )}
      {/* Modal remains the same */}
      {showExpModal && (
        <Modal onClose={() => setShowExpModal(false)} title="Add Experience">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Company Name"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={expForm.company}
              onChange={e => setExpForm({ ...expForm, company: e.target.value })}
            />
            <input
              type="text"
              placeholder="Years (e.g. 2020-2023 or 2021-Present)"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={expForm.years}
              onChange={e => setExpForm({ ...expForm, years: e.target.value })}
            />
            <div className="border-t border-gray-700/50 pt-4 mt-2">
              <div className="font-semibold text-sm text-gray-300 mb-2">Select Related Skills</div>
              {availableSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-2 border border-gray-700/50 rounded-lg bg-gray-800/50 max-h-32 overflow-y-auto">
                  {availableSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs transition font-medium ${expForm.skills.includes(skill)
                        ? "bg-blue-600 text-white ring-2 ring-blue-500/50"
                        : "bg-gray-700/80 text-gray-300 hover:bg-gray-600/80 hover:text-gray-100"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Add skills in the main Skills section first to link them here.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700/50">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-600/80 text-gray-200 font-semibold border border-gray-600/80 transition-all duration-200 text-sm"
                onClick={() => setShowExpModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 disabled:hover:shadow-none disabled:hover:scale-100 text-sm"
                onClick={addExperience}
                disabled={!expForm.company.trim() || !expForm.years.trim()}
              >
                Add Experience
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExperienceList;