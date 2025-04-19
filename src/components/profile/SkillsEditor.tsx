import React, { useState } from "react";
import { Skill } from "./types";

type SkillsEditorProps = {
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
};

const SkillsEditor = ({ skills, setSkills }: SkillsEditorProps) => {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-indigo-300 flex items-center gap-2">Skills</span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add skill"
            className="border border-gray-700 bg-gray-800 rounded px-2 py-1 text-gray-100"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
            onClick={addSkill}
          >
            Add
          </button>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 mt-2">
        {skills.map((skill, i) => (
          <li key={i} className="bg-indigo-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            {skill}
            <button type="button" className="ml-1 text-red-300" onClick={() => removeSkill(i)}>
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SkillsEditor;