import React, { useState } from 'react';
import { FaRedo, FaPlus, FaEdit, FaTimes } from "react-icons/fa";
import ProfilePhotoUploader from "@/components/profile/ProfilePhotoUploader";
import SkillsEditor from "@/components/profile/SkillsEditor";
import CertificatesList from "@/components/profile/CertificatesList";
import ExperienceList from "@/components/profile/ExperienceList";
import CPProfilesList from "@/components/profile/CPProfilesList";
import { Certificate, Experience, CPProfile, Skill } from "@/components/profile/types";
import Groq from "groq-sdk"; // Import Groq type

interface EditDetailsFormProps {
  photo: string;
  setPhoto: (photo: string) => void;
  name: string;
  setName: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  linkedin: string;
  setLinkedin: (linkedin: string) => void;
  github: string;
  setGithub: (github: string) => void;
  leetcode: string;
  setLeetcode: (leetcode: string) => void;
  gfg: string;
  setGfg: (gfg: string) => void;
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
  setCertPreview: (cert: Certificate | null) => void;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  cpProfiles: CPProfile[];
  setCpProfiles: React.Dispatch<React.SetStateAction<CPProfile[]>>;
  handleSave: (e: React.FormEvent) => Promise<void>;
  handleRefreshGithub: () => Promise<void>;
  handleRefreshLeetcode: () => Promise<void>;
  handleRefreshGfg: () => Promise<void>;
  setShowAddProject: (show: boolean) => void;
  groqClient: Groq | null; // Add groqClient prop
  loading: boolean;
  refreshingGithub: boolean;
  refreshingLeetcode: boolean;
  refreshingGfg: boolean;
}

const EditDetailsForm: React.FC<EditDetailsFormProps> = ({
  photo, setPhoto, name, setName, bio, setBio, linkedin, setLinkedin, github, setGithub,
  leetcode, setLeetcode, gfg, setGfg, skills, setSkills, certificates, setCertificates,
  setCertPreview, experiences, setExperiences, cpProfiles, setCpProfiles, handleSave,
  handleRefreshGithub, handleRefreshLeetcode, handleRefreshGfg, setShowAddProject,
  loading, refreshingGithub, refreshingLeetcode, refreshingGfg,
  groqClient // Destructure groqClient
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Edit Button (floating, bottom left on mobile, top left on desktop) */}
      {!open && (
        <button
          className="fixed z-50 right-4 bottom-6 p-4 rounded-full bg-red-700/90 hover:bg-red-800 text-white shadow-lg border border-red-900/40 transition-all duration-200"
          onClick={() => setOpen(true)}
          aria-label="Edit Details"
        >
          <FaEdit size={28} />
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Edit Details Drawer/Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-xl lg:w-1/3 flex flex-col gap-7 bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-none lg:rounded-2xl p-4 sm:p-7 border border-gray-700/40 shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
        }}
      >
        {/* Close button */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight border-b border-gray-700/50 pb-3 mb-0">
            Edit Details
          </h3>
          <button
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 transition-all duration-200"
            onClick={() => setOpen(false)}
            aria-label="Close Edit Details"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <ProfilePhotoUploader photo={photo} setPhoto={setPhoto} />

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Name"
            className="input-style bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 text-base sm:text-lg"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <textarea
            placeholder="Short Bio (optional)"
            className="input-style h-20 sm:h-24 resize-none bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 text-base sm:text-lg"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <input
            type="text"
            placeholder="LinkedIn Username (e.g., yourname)"
            className="input-style bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 text-base sm:text-lg"
            value={linkedin}
            onChange={e => setLinkedin(e.target.value)}
          />
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="GitHub Username"
              className="input-style flex-grow bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 text-base sm:text-lg"
              value={github}
              onChange={e => setGithub(e.target.value)}
            />
            <button
              type="button"
              onClick={handleRefreshGithub}
              disabled={!github || refreshingGithub || loading}
              className={`refresh-button transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingGithub ? 'animate-spin' : ''}`}
              title="Refresh GitHub Stats"
            >
              <FaRedo />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="LeetCode Username"
              className="input-style flex-grow bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 text-base sm:text-lg"
              value={leetcode}
              onChange={e => setLeetcode(e.target.value)}
            />
            <button
              type="button"
              onClick={handleRefreshLeetcode}
              disabled={!leetcode || refreshingLeetcode || loading}
              className={`refresh-button transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingLeetcode ? 'animate-spin' : ''}`}
              title="Refresh LeetCode Stats"
            >
              <FaRedo />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="GeeksforGeeks Username"
              className="input-style flex-grow bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200 text-base sm:text-lg"
              value={gfg}
              onChange={e => setGfg(e.target.value)}
            />
            <button
              type="button"
              onClick={handleRefreshGfg}
              disabled={!gfg || refreshingGfg || loading}
              className={`refresh-button transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingGfg ? 'animate-spin' : ''}`}
              title="Refresh GeeksforGeeks Stats"
            >
              <FaRedo />
            </button>
          </div>

          <SkillsEditor skills={skills} setSkills={setSkills} />
          <CertificatesList
            certificates={certificates}
            setCertificates={setCertificates}
            setCertPreview={setCertPreview}
            groqClient={groqClient}
          />
          <ExperienceList experiences={experiences} setExperiences={setExperiences} availableSkills={skills} />
          <CPProfilesList cpProfiles={cpProfiles} setCpProfiles={setCpProfiles} />

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 button-secondary mt-1 bg-blue-900/30 hover:bg-blue-800/40 text-blue-200 font-semibold rounded-lg py-2 transition-all duration-200 shadow-sm border border-blue-500/20"
            onClick={() => setShowAddProject(true)}
          >
            <FaPlus /> Add Project
          </button>

          <button
            type="submit"
            className="w-full button-primary mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 disabled:hover:shadow-none disabled:hover:scale-100"
            disabled={loading || refreshingGithub || refreshingLeetcode || refreshingGfg}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </>
  );
};

export default EditDetailsForm;
