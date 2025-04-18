import React, { useState } from "react";
import { FaTrophy, FaPlus } from "react-icons/fa";
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
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-indigo-300 flex items-center gap-2"><FaTrophy /> CP Profiles</span>
        <button type="button" className="text-indigo-400" onClick={() => setShowCPModal(true)}><FaPlus /></button>
      </div>
      <ul className="space-y-1">
        {cpProfiles.map((cp, i) => (
          <li key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded px-2 py-1">
            <span>
              <a href={cp.link} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">{cp.platform}</a>
              {" - "}{cp.handle}
            </span>
            <button type="button" className="text-red-400" onClick={() => removeCP(i)}>Remove</button>
          </li>
        ))}
      </ul>
      {showCPModal && (
        <Modal onClose={() => setShowCPModal(false)} title="Add CP Profile">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Platform"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={cpForm.platform}
              onChange={e => setCpForm({ ...cpForm, platform: e.target.value })}
            />
            <input
              type="text"
              placeholder="Handle"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={cpForm.handle}
              onChange={e => setCpForm({ ...cpForm, handle: e.target.value })}
            />
            <input
              type="text"
              placeholder="Profile Link"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
              value={cpForm.link}
              onChange={e => setCpForm({ ...cpForm, link: e.target.value })}
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition shadow"
              onClick={addCP}
              type="button"
            >
              Add CP Profile
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CPProfilesList;