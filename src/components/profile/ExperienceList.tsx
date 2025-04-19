import React, { useState } from "react";
import { FaBriefcase, FaPlus, FaTrashAlt, FaTags } from "react-icons/fa"; // Added FaTrashAlt, FaTags
import { Experience, Skill } from "./types";
import Modal from "./Modal";

type ExperienceListProps = {
  experiences: Experience[];
  setExperiences: (experiences: Experience[]) => void;
  availableSkills: Skill[]; // Add available skills from the main state
};

const ExperienceList = ({ experiences, setExperiences, availableSkills }: ExperienceListProps) => {
  const [showExpModal, setShowExpModal] = useState(false);
  // Update expForm state to match the new Experience type
  const [expForm, setExpForm] = useState<Experience>({
    company: "",
    years: "",
    skills: [], // Initialize skills array
  });

  // Function to toggle skills in the form
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
    // Reset form
    setExpForm({
      company: "",
      years: "",
      skills: [],
    });
    setShowExpModal(false);
  };

  const removeExperience = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-indigo-300 flex items-center gap-2"><FaBriefcase /> Experience</span>
        <button type="button" className="text-indigo-400" onClick={() => setShowExpModal(true)}><FaPlus /></button>
      </div>
      <ul className="space-y-2">
        {experiences.map((exp, expIdx) => (
          <li key={expIdx} className="bg-gray-800 rounded px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-bold text-indigo-200 block">{exp.company}</span>
                <span className="text-gray-400 text-xs">{exp.years}</span>
              </div>
              <button type="button" className="text-red-400 ml-2" onClick={() => removeExperience(expIdx)}>Remove</button>
            </div>
            {/* Display skills as tags */}
            {exp.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {exp.skills.map((skill, skillIdx) => (
                  <span key={skillIdx} className="bg-indigo-700 text-white px-2 py-0.5 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {showExpModal && (
        <Modal onClose={() => setShowExpModal(false)} title="Add Experience">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Company"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={expForm.company}
              onChange={e => setExpForm({ ...expForm, company: e.target.value })}
            />
            <input
              type="text"
              placeholder="Years (e.g. 2020-2023)"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={expForm.years}
              onChange={e => setExpForm({ ...expForm, years: e.target.value })}
            />
            {/* Skills Selection */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="font-semibold text-indigo-300 mb-2">Select Skills</div>
              {availableSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2 py-1 rounded text-xs transition ${expForm.skills.includes(skill)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Add skills in the main Skills section first.</p>
              )}
            </div>
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition shadow mt-2"
              onClick={addExperience}
              type="button"
              disabled={!expForm.company || !expForm.years} // Basic validation
            >
              Add Experience
            </button>
          </div>
        </Modal>
      )}
      {/* Removed Project Modal */}
    </div>
  );
};

export default ExperienceList;