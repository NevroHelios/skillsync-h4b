import React from 'react';
import { Skill } from "@/components/profile/types";

interface SkillsSectionProps {
  skills: Skill[];
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return null; // Don't render if no skills
  }

  return (
    <div className="w-full mt-0 section-container">
      <div
        className="section-header flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4"
        style={{
          background: "linear-gradient(90deg, rgba(36,37,46,0.95) 0%, rgba(44,48,66,0.85) 100%)",
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)"
        }}
      >
        <span className="text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">Skills</span>
      </div>
      <ul className="flex flex-wrap gap-2 sm:gap-3">
        {skills.map((skill, i) => (
          <li
            key={i}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-br from-blue-900/60 to-indigo-900/60 text-blue-200 border border-blue-500/30 shadow-sm hover:shadow-lg hover:border-blue-400/60 transition-all duration-200 text-sm sm:text-base font-medium tracking-wide cursor-default select-none"
          >
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SkillsSection;
