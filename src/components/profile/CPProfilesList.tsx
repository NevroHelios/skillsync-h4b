import React, { useState } from "react";
import { FaTrophy, FaPlus, FaTrashAlt, FaExternalLinkAlt } from "react-icons/fa";
import { CPProfile } from "./types";
import Modal from "./Modal";

type CPProfilesListProps = {
  cpProfiles: CPProfile[];
  setCpProfiles: (cpProfiles: CPProfile[]) => void;
};

const CPProfilesList = ({ cpProfiles, setCpProfiles }: CPProfilesListProps) => {
  const [showCPModal, setShowCPModal] = useState(false);
  const [cpForm, setCpForm] = useState<CPProfile>({ platform: "", handle: "", link: "" });

  const addCP = () => {
    setCpProfiles([...cpProfiles, cpForm]);
    setCpForm({ platform: "", handle: "", link: "" });
    setShowCPModal(false);
  };
  const removeCP = (idx: number) => setCpProfiles(cpProfiles.filter((_, i) => i !== idx));

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
        <span className="font-semibold text-lg text-indigo-300 flex items-center gap-2">
          <FaTrophy /> CP Profiles
        </span>
        <button
          type="button"
          className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-gray-700/50"
          onClick={() => setShowCPModal(true)}
          aria-label="Add CP Profile"
        >
          <FaPlus />
        </button>
      </div>
      {cpProfiles.length > 0 ? (
        <ul className="space-y-3">
          {cpProfiles.map((cp, i) => (
            <li key={i} className="flex items-center justify-between text-sm bg-gray-900/40 rounded-md p-3 border border-gray-700/30 shadow-inner transition-shadow hover:shadow-md">
              <div className="flex-1 mr-3">
                <span className="font-medium text-orange-300 block mb-0.5">{cp.platform}</span>
                <a
                  href={cp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-orange-400 text-xs inline-flex items-center gap-1 group"
                >
                  <span>{cp.handle}</span>
                  <FaExternalLinkAlt size={10} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
              <button
                type="button"
                className="text-red-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-900/30"
                onClick={() => removeCP(i)}
                aria-label="Remove CP Profile"
              >
                <FaTrashAlt size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 text-sm italic py-4">No CP profiles added yet.</p>
      )}
      {showCPModal && (
        <Modal onClose={() => setShowCPModal(false)} title="Add CP Profile">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Platform (e.g., LeetCode, Codeforces)"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={cpForm.platform}
              onChange={e => setCpForm({ ...cpForm, platform: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username / Handle"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={cpForm.handle}
              onChange={e => setCpForm({ ...cpForm, handle: e.target.value })}
            />
            <input
              type="url"
              placeholder="Profile Link (e.g., https://...)"
              className="w-full bg-gray-800/70 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all duration-200"
              value={cpForm.link}
              onChange={e => setCpForm({ ...cpForm, link: e.target.value })}
            />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700/50">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-600/80 text-gray-200 font-semibold border border-gray-600/80 transition-all duration-200 text-sm"
                onClick={() => setShowCPModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 disabled:hover:shadow-none disabled:hover:scale-100 text-sm"
                onClick={addCP}
                disabled={!cpForm.platform.trim() || !cpForm.handle.trim() || !cpForm.link.trim()}
              >
                Add CP Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CPProfilesList;