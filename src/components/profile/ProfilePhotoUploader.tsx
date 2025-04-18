import React, { useRef, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";

type ProfilePhotoUploaderProps = {
  photo: string;
  setPhoto: (url: string) => void;
};

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_NAME?.replace(/"/g, "") || "dlrlet9fg";
const CLOUDINARY_UPLOAD_PRESET = "website"; // <-- Set this to your actual unsigned upload preset name

const ProfilePhotoUploader = ({ photo, setPhoto }: ProfilePhotoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setPhoto(data.secure_url);
        toast.success("Photo uploaded!");
      } else if (data.error && data.error.message) {
        toast.error("Image upload failed: " + data.error.message);
      } else {
        toast.error("Image upload failed. Please check your Cloudinary unsigned upload preset and cloud name.");
      }
    } catch (err) {
      toast.error("Image upload error.");
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <img
          src={photo || "/default-avatar.png"}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-indigo-900 shadow"
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handlePhotoUpload}
          disabled={uploading}
        />
        <button
          type="button"
          className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 shadow hover:bg-indigo-700 transition"
          onClick={() => fileInputRef.current?.click()}
          title="Change Photo"
          disabled={uploading}
        >
          <FaUserCircle size={28} />
        </button>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <span className="text-xs text-white">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePhotoUploader;