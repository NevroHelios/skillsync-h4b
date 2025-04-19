import React, { useState } from "react";
import { FaCertificate, FaCheckCircle, FaPlus, FaTimesCircle, FaUpload, FaBrain, FaSpinner, FaExclamationCircle, FaThumbsUp, FaEdit } from "react-icons/fa";
import { Certificate, ValidationStatus } from "./types";
import Modal from "./Modal";
import { toast } from "react-toastify";
import Groq from "groq-sdk";

type CertificatesListProps = {
  certificates: Certificate[];
  setCertificates: (certificates: Certificate[]) => void;
  setCertPreview: (cert: Certificate | null) => void;
  groqClient: Groq | null;
};

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "dlrlet9fg";
const CLOUDINARY_UPLOAD_PRESET = "website";

const CertificatesList = ({ certificates, setCertificates, setCertPreview, groqClient }: CertificatesListProps) => {
  const [showCertModal, setShowCertModal] = useState(false);
  const initialCertFormState: Certificate = {
    title: "",
    issuer: "",
    year: "",
    fileUrl: undefined,
    verified: undefined,
    status: undefined,
    validationStatus: "pending",
    aiSuggestedIssuer: undefined,
  };
  const [certForm, setCertForm] = useState<Certificate>(initialCertFormState);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingIssuer, setIsEditingIssuer] = useState(false);
  const [editedIssuer, setEditedIssuer] = useState("");

  const resetModal = () => {
    setCertForm(initialCertFormState);
    setCertFile(null);
    setIsUploading(false);
    setIsEditingIssuer(false);
    setEditedIssuer("");
    setShowCertModal(false);
  };

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertFile(e.target.files?.[0] || null);
    setCertForm((prev) => ({
      ...prev,
      fileUrl: undefined,
      validationStatus: "pending",
      aiSuggestedIssuer: undefined,
    }));
  };

  const validateCertificateLocally = async (certificateData: Certificate) => {
    if (!groqClient) {
      toast.error("Validation service not available.");
      setCertForm((prev) => ({ ...prev, validationStatus: "failed" }));
      return;
    }
    if (!certificateData.fileUrl) {
      toast.error("Certificate file URL is missing for validation.");
      setCertForm((prev) => ({ ...prev, validationStatus: "failed" }));
      return;
    }

    setCertForm((prev) => ({ ...prev, validationStatus: "validating" }));

    try {
      const prompt = `Analyze the following certificate details and identify the issuing organization.
Certificate Title: "${certificateData.title}"
Stated Issuer (if any): "${certificateData.issuer || "None"}"
Respond ONLY with the name of the issuing organization. If unsure, respond with "Unknown".`;

      const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192",
        temperature: 0.2,
      });

      const result = completion.choices[0]?.message?.content?.trim() || "Unknown";
      const suggestedIssuer = result === "Unknown" || result === "" ? undefined : result;

      setCertForm((prev) => ({
        ...prev,
        aiSuggestedIssuer: suggestedIssuer,
        validationStatus: suggestedIssuer ? "needs_review" : "failed",
      }));
      if (!suggestedIssuer) {
        toast.warn("AI could not determine the issuer. Please enter manually.");
      }
    } catch (error) {
      console.error("Groq API call failed:", error);
      toast.error("AI validation failed.");
      setCertForm((prev) => ({ ...prev, validationStatus: "failed" }));
    }
  };

  const handleCertUploadAndValidate = async () => {
    if (!certFile || !certForm.title || !certForm.year) {
      toast.warn("Please provide Title, Year, and select a file.");
      return;
    }
    setIsUploading(true);
    setCertForm((prev) => ({ ...prev, validationStatus: "validating" }));

    const formData = new FormData();
    formData.append("file", certFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        const updatedCertForm = { ...certForm, fileUrl: data.secure_url };
        setCertForm(updatedCertForm);
        setIsUploading(false);
        toast.success("File uploaded. Starting AI validation...");
        await validateCertificateLocally(updatedCertForm);
      } else {
        throw new Error(data.error?.message || "Cloudinary upload failed.");
      }
    } catch (error: any) {
      console.error("Upload or Validation Error:", error);
      toast.error(`Error: ${error.message || "Upload/Validation failed."}`);
      setCertForm((prev) => ({ ...prev, validationStatus: "failed" }));
      setIsUploading(false);
    }
  };

  const handleConfirmIssuer = () => {
    if (!certForm.aiSuggestedIssuer) return;
    setCertForm((prev) => ({
      ...prev,
      issuer: prev.aiSuggestedIssuer!,
      validationStatus: "verified",
      aiSuggestedIssuer: undefined,
    }));
    toast.success("Issuer confirmed!");
  };

  const handleEditIssuer = () => {
    setIsEditingIssuer(true);
    setEditedIssuer(certForm.aiSuggestedIssuer || certForm.issuer || "");
  };

  const handleSaveEditedIssuer = () => {
    setCertForm((prev) => ({
      ...prev,
      issuer: editedIssuer,
      validationStatus: "verified",
      aiSuggestedIssuer: undefined,
    }));
    setIsEditingIssuer(false);
    toast.success("Issuer updated and verified!");
  };

  const addCertificate = () => {
    if (
      certForm.validationStatus !== "verified" ||
      !certForm.title ||
      !certForm.issuer ||
      !certForm.year ||
      !certForm.fileUrl
    ) {
      toast.error("Cannot add certificate. Ensure it's verified and all fields (Title, Issuer, Year, File) are present.");
      return;
    }
    const finalCertificate: Certificate = {
      title: certForm.title,
      issuer: certForm.issuer,
      year: certForm.year,
      fileUrl: certForm.fileUrl,
      verified: true,
      status: "verified",
    };
    setCertificates([...certificates, finalCertificate]);
    resetModal();
  };

  const removeCertificate = (idx: number) => {
    setCertificates(certificates.filter((_, i) => i !== idx));
  };

  const canAddCertificate = certForm.validationStatus === "verified";
  const canUploadAndValidate =
    !!certFile &&
    !!certForm.title &&
    !!certForm.year &&
    !isUploading &&
    certForm.validationStatus !== "validating" &&
    certForm.validationStatus !== "verified";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-indigo-300 flex items-center gap-2">
          <FaCertificate /> Certificates
        </span>
        <button type="button" className="text-indigo-400 hover:text-indigo-300" onClick={() => setShowCertModal(true)}>
          <FaPlus />
        </button>
      </div>
      <ul className="space-y-1">
        {certificates.map((c, i) => (
          <li key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded px-2 py-1">
            <span className="truncate mr-2">
              {c.title} - {c.issuer} ({c.year})
              {c.fileUrl && (
                <button
                  onClick={() => setCertPreview(c)}
                  className="ml-2 text-indigo-400 underline inline-flex items-center gap-1 text-xs"
                  title="Preview Certificate"
                >
                  <FaUpload className="inline" /> Preview
                </button>
              )}
            </span>
            <span className="flex items-center gap-2 flex-shrink-0">
              {c.status === "verified" ? (
                <span className="flex items-center text-green-400 text-xs">
                  <FaCheckCircle className="mr-1" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center text-yellow-400 text-xs">
                  <FaExclamationCircle className="mr-1" /> Needs Action
                </span>
              )}
              <button
                type="button"
                className="text-red-500 hover:text-red-400 ml-2 text-xs"
                onClick={() => removeCertificate(i)}
              >
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>

      {showCertModal && (
        <Modal onClose={resetModal} title="Add Certificate">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Certificate Title (e.g., Cloud Practitioner)"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
              value={certForm.title}
              onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
              disabled={isUploading || certForm.validationStatus === "validating"}
            />
            <input
              type="text"
              placeholder="Year Issued (e.g., 2023)"
              className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
              value={certForm.year}
              onChange={(e) => setCertForm({ ...certForm, year: e.target.value })}
              disabled={isUploading || certForm.validationStatus === "validating"}
            />
            <input
              type="file"
              accept="image/*,application/pdf"
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
              onChange={handleCertFileChange}
              disabled={isUploading || certForm.validationStatus === "validating"}
            />

            <button
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition shadow flex items-center justify-center gap-2 ${
                !canUploadAndValidate ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleCertUploadAndValidate}
              disabled={!canUploadAndValidate}
              type="button"
            >
              {isUploading ? <FaSpinner className="animate-spin" /> : <FaBrain />}
              {isUploading
                ? "Uploading..."
                : certForm.validationStatus === "validating"
                ? "Validating..."
                : "Upload & Validate"}
            </button>

            {certForm.validationStatus === "validating" && (
              <div className="text-center text-yellow-400 flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" /> AI Validation in progress...
              </div>
            )}
            {certForm.validationStatus === "failed" && (
              <div className="text-center text-red-500 flex items-center justify-center gap-2">
                <FaTimesCircle /> Validation failed. Please check details or enter Issuer manually below.
              </div>
            )}

            {certForm.validationStatus === "needs_review" && certForm.aiSuggestedIssuer && !isEditingIssuer && (
              <div className="p-3 bg-gray-700 rounded border border-orange-500">
                <p className="text-sm text-orange-300 mb-2 flex items-center gap-2">
                  <FaExclamationCircle /> AI suggests the issuer is:{" "}
                  <strong className="text-orange-200">{certForm.aiSuggestedIssuer}</strong>
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleConfirmIssuer}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                  >
                    <FaThumbsUp /> Confirm
                  </button>
                  <button
                    onClick={handleEditIssuer}
                    className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </button>
                </div>
              </div>
            )}

            {(certForm.validationStatus === "failed" || isEditingIssuer) && (
              <div className="flex flex-col gap-2">
                <label htmlFor="issuerInput" className="text-sm font-medium text-gray-300">
                  {isEditingIssuer ? "Edit Issuer:" : "Enter Issuer Manually:"}
                </label>
                <input
                  id="issuerInput"
                  type="text"
                  placeholder="Issuing Organization (e.g., Amazon Web Services)"
                  className="border border-gray-600 bg-gray-700 rounded px-3 py-2 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                  value={isEditingIssuer ? editedIssuer : certForm.issuer}
                  onChange={(e) => {
                    if (isEditingIssuer) {
                      setEditedIssuer(e.target.value);
                    } else {
                      setCertForm({ ...certForm, issuer: e.target.value });
                    }
                  }}
                />
                {isEditingIssuer && (
                  <button
                    onClick={handleSaveEditedIssuer}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded self-end"
                  >
                    Save Issuer
                  </button>
                )}
                {certForm.validationStatus === "failed" && (
                  <button
                    onClick={() => setCertForm({ ...certForm, validationStatus: "verified" })}
                    disabled={!certForm.issuer}
                    className={`px-3 py-1 text-xs rounded self-end ${
                      !certForm.issuer
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Confirm Manual Issuer
                  </button>
                )}
              </div>
            )}

            <button
              className={`w-full mt-2 font-bold py-2 px-4 rounded transition shadow ${
                canAddCertificate
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              onClick={addCertificate}
              disabled={!canAddCertificate}
              type="button"
            >
              Add Verified Certificate to Profile
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CertificatesList;