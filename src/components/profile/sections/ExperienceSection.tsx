import React from 'react';
import { FaBriefcase } from "react-icons/fa";
import { Experience } from "@/components/profile/types";

interface ExperienceSectionProps {
  experiences: Experience[];
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences }) => {
  if (!experiences || experiences.length === 0) {
    return null; // Don't render if no experiences
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
        <span className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">
          <FaBriefcase size={20} className="sm:size-6" /> Experience
        </span>
      </div>
      <div className="relative pl-5 sm:pl-7">
        <div className="absolute left-2.5 sm:left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-700/60 to-indigo-700/60 rounded-full" />
        <ul className="space-y-6 sm:space-y-8">
          {experiences.map((exp, expIdx) => (
            <li key={expIdx} className="relative group">
              <span className="absolute left-[-7px] sm:left-[-7px] top-2 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-700/80 to-indigo-700/80 border-4 border-gray-900 rounded-full shadow-lg z-10 group-hover:scale-110 transition-transform" />
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl px-4 py-4 sm:px-6 sm:py-5 ml-3 sm:ml-4 border border-gray-700/40 hover:border-blue-500/60 transition-all duration-200 shadow-xl hover:shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <div className="font-semibold text-gray-100 text-base sm:text-lg md:text-xl">{exp.company}</div>
                  <div className="text-blue-300 text-sm sm:text-base font-medium mt-1 sm:mt-0 bg-blue-900/30 px-2 sm:px-3 py-1 rounded-full shadow-sm border border-blue-700/30">
                    {exp.years}
                  </div>
                </div>
                {exp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {exp.skills.map((skill, skillIdx) => (
                      <span
                        key={skillIdx}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-br from-indigo-900/40 to-blue-900/30 text-blue-200 rounded-full border border-blue-500/20 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExperienceSection;
