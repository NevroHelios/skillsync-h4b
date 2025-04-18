"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaLinkedin, FaGithub, FaCertificate, FaBriefcase, FaProjectDiagram, FaTrophy, FaCheckCircle, FaTimesCircle, FaUpload, FaStar, FaEye, FaCodeBranch, FaExclamationCircle, FaCalendarAlt, FaSyncAlt, FaBalanceScale, FaHistory, FaUniversity, FaChartLine, FaFire, FaTasks, FaCheck, FaPercentage, FaMedal, FaHandPointUp, FaUserCheck, FaBrain, FaRedo, FaReply } from "react-icons/fa";
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import { toast } from "react-toastify";
import { connect, disconnect } from "get-starknet";
import WalletConnectButton from "@/components/WalletConnectButton";
import { encode } from "starknet";
import Slider from "react-slick"; // Import Slider
import "slick-carousel/slick/slick.css"; // Import slick css
import "slick-carousel/slick/slick-theme.css"; // Import slick theme css

// Import types and components
import { Certificate, Experience, Project, CPProfile, Skill } from "../../components/profile/types";
import Modal from "../../components/profile/Modal";
import CertificatePreviewModal from "../../components/profile/CertificatePreviewModal";
import ProfilePhotoUploader from "../../components/profile/ProfilePhotoUploader";
import SkillsEditor from "../../components/profile/SkillsEditor";
import CertificatesList from "../../components/profile/CertificatesList";
import ExperienceList from "../../components/profile/ExperienceList";
import ProjectsList from "../../components/profile/ProjectsList";
import CPProfilesList from "../../components/profile/CPProfilesList";

// Define a type for GitHub Repos
interface GitHubRepo {
  name: string;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>;
  license: { name: string } | null;
  topics: string[];
  fork: boolean;
}

// Define a type for GFG Stats (Updated Structure)
interface GfgSolvedStatsDetail {
  count: number;
  questions: { question: string; questionUrl: string }[];
}

interface GfgStats {
  info: {
    userName: string;
    fullName: string;
    profilePicture: string;
    institute: string;
    instituteRank: string;
    currentStreak: string;
    maxStreak: string;
    codingScore: number;
    monthlyScore: number;
    totalProblemsSolved: number;
  };
  solvedStats: {
    basic: GfgSolvedStatsDetail;
    easy: GfgSolvedStatsDetail;
    medium: GfgSolvedStatsDetail;
    hard?: GfgSolvedStatsDetail;
  };
}

// Define a type for LeetCode Stats
interface LeetCodeStats {
  status: string;
  message?: string;
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  acceptanceRate: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;
  submissionCalendar?: Record<string, number>;
}

// Update comment type in project interactions state
interface Comment {
  _id: string; // Add comment ID
  user: string;
  text: string;
  date: string;
  parentId: string | null; // Add parent ID
}

export default function Profile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [gfg, setGfg] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [cpProfiles, setCpProfiles] = useState<CPProfile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [certPreview, setCertPreview] = useState<Certificate | null>(null);
  const [lastGithub, setLastGithub] = useState("");
  const [lastLeetcode, setLastLeetcode] = useState("");
  const [lastGfg, setLastGfg] = useState("");
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [gfgStats, setGfgStats] = useState<GfgStats | null>(null);
  const [leetCodeStats, setLeetCodeStats] = useState<LeetCodeStats | null>(null);
  const [refreshingGithub, setRefreshingGithub] = useState(false);
  const [refreshingLeetcode, setRefreshingLeetcode] = useState(false);
  const [refreshingGfg, setRefreshingGfg] = useState(false);

  // Modal state for selecting a repo to add as a project
  const [showRepoPicker, setShowRepoPicker] = useState(false);

  // For controlled project add form
  const [newProject, setNewProject] = useState<{ name: string; description: string; link: string; skills: string[]; experience: string }>({
    name: "",
    description: "",
    link: "",
    skills: [],
    experience: "",
  });
  const [showAddProject, setShowAddProject] = useState(false);

  // Settings for the react-slick carousel
  const sliderSettings = {
    dots: true, // Ensure dots are enabled
    infinite: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 2,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  // New state for project interactions (update comment type)
  const [projectInteractions, setProjectInteractions] = useState<Record<string, {
    likes: number;
    dislikes: number;
    userLike: "like" | "dislike" | null;
    comments: Comment[]; // Use updated Comment interface
  }>>({});

  // For comment input per project
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  // State to track which comment is being replied to { projectId: commentId }
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  // State for reply input values { projectId_commentId: replyText }
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Helper to check if a link is a GitHub repo
  const getGithubRepoFromLink = (link: string) => {
    const match = link.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
    if (match) return { owner: match[1], repo: match[2] };
    return null;
  };

  // Helper to get repoData for a project
  const getRepoDataForProject = (p: Project) => {
    const githubInfo = getGithubRepoFromLink(p.link || "");
    if (!githubInfo) return null;
    // Check if githubRepos is defined and is an array before using find
    if (!Array.isArray(githubRepos)) {
        console.warn("githubRepos is not an array yet in getRepoDataForProject");
        return null;
    }
    return githubRepos.find(r =>
      // Ensure r.full_name exists before calling toLowerCase
      r.full_name && r.full_name.toLowerCase() === `${githubInfo.owner}/${githubInfo.repo}`.toLowerCase()
    );
  };

  // Fetch project interactions from backend
  useEffect(() => {
    // Ensure we have the profile owner's email (user.email) and the viewer's email (session.user.email)
    if (!user?.email || !session?.user?.email) return;
    if (projects.length === 0) {
        setProjectInteractions({}); // Reset if no projects
        return;
    };

    // Pass both the profile owner's email and the viewer's email
    const ownerEmail = encodeURIComponent(user.email);
    const viewerEmail = encodeURIComponent(session.user.email);

    fetch(`/api/project-interactions?email=${ownerEmail}&viewerEmail=${viewerEmail}`)
      .then(res => {
          if (!res.ok) {
              throw new Error(`HTTP error ${res.status}`);
          }
          return res.json();
      })
      .then(data => {
          console.log("Fetched Interactions:", data); // Debug log
          setProjectInteractions(data || {});
      })
      .catch((err) => {
          console.error("Failed to fetch project interactions:", err);
          setProjectInteractions({}); // Reset on error
      });
  }, [projects, user?.email, session?.user?.email]); // Depend on user.email and session.user.email

  // Handler for like/dislike
  const handleProjectLike = async (projectName: string, action: "like" | "dislike") => {
    // Ensure we have the profile owner's email and the current session user's email
    if (!session?.user?.email || !user?.email) {
        toast.error("You must be logged in to interact.");
        return;
    }
    if (session.user.email === user.email) {
        toast.info("You cannot like/dislike your own project.");
        return;
    }

    const likerEmail = session.user.email;
    const projectOwnerEmail = user.email;

    // Optimistically update UI first
    const originalInteractions = { ...projectInteractions }; // Backup for rollback
    let optimisticUpdate: typeof projectInteractions = {};
    setProjectInteractions(prev => {
        const prevData = prev[projectName] || { likes: 0, dislikes: 0, userLike: null, comments: [] };
        let likes = prevData.likes;
        let dislikes = prevData.dislikes;
        let newUserLike: "like" | "dislike" | null = action;

        // If clicking the same action again, undo it
        if (prevData.userLike === action) {
            newUserLike = null; // Undo the action
            if (action === "like") likes -= 1;
            else dislikes -= 1;
        } else {
            // Apply the new action
            if (action === "like") likes += 1;
            else dislikes += 1;
            // If there was a previous opposite action, remove it
            if (prevData.userLike === "like") likes -= 1;
            if (prevData.userLike === "dislike") dislikes -= 1;
        }

        optimisticUpdate = {
            ...prev,
            [projectName]: { ...prevData, likes: Math.max(0, likes), dislikes: Math.max(0, dislikes), userLike: newUserLike }
        };
        return optimisticUpdate;
    });


    try {
        const response = await fetch("/api/project-interactions/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              projectOwnerEmail,
              projectName,
              action,
              likerEmail // Send the email of the user performing the action
          }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        // Optional: Update counts based on server response if needed,
        // but optimistic update is usually sufficient for likes/dislikes
        // const result = await response.json();
        // if (result.success) {
        //   // Potentially update counts if they differ significantly, though unlikely here
        // }

    } catch (error) {
        console.error("Failed to update like status:", error);
        toast.error("Failed to update reaction.");
        // Rollback UI on error
        setProjectInteractions(originalInteractions);
    }
  };

  // Update Handler for adding a comment or reply
  const handleProjectComment = async (projectName: string, comment: string, parentId: string | null = null) => {
    if (!session?.user?.email || !user?.email || !comment.trim()) return;

    const commenterEmail = session.user.email;
    const projectOwnerEmail = user.email;
    const trimmedComment = comment.trim();

    // Backup state for potential rollback
    const originalInteractions = { ...projectInteractions };
    const originalCommentInputs = { ...commentInputs };
    const originalReplyInputs = { ...replyInputs };

    // Optimistic UI update
    const optimisticCommenterName = session.user.name || session.user.email || "User";
    // Generate a temporary ID for optimistic update (simple approach)
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempComment: Comment = {
        _id: tempId, // Temporary ID
        user: optimisticCommenterName,
        text: trimmedComment,
        date: new Date().toISOString(),
        parentId: parentId, // Include parentId
    };

    setProjectInteractions(prev => {
        const prevData = prev[projectName] || { likes: 0, dislikes: 0, userLike: null, comments: [] };
        return {
            ...prev,
            [projectName]: {
                ...prevData,
                comments: [...prevData.comments, tempComment] // Add the new comment/reply
            }
        };
    });

    // Clear the correct input field
    if (parentId) {
        setReplyInputs(inputs => ({ ...inputs, [`${projectName}_${parentId}`]: "" }));
        setReplyingTo(prev => ({ ...prev, [projectName]: null })); // Close reply input after submitting
    } else {
        setCommentInputs(inputs => ({ ...inputs, [projectName]: "" })); // Clear main comment input
    }


    try {
        const response = await fetch("/api/project-interactions/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              projectOwnerEmail,
              projectName,
              comment: trimmedComment,
              commenterEmail,
              parentId, // Send parentId to the API
          }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        // Replace temp comment with server-confirmed one
        const result = await response.json();
        if (result.success && result.comment) {
            setProjectInteractions(prev => {
                const prevData = prev[projectName];
                if (!prevData) return prev;

                // Filter out the temporary comment using its tempId
                const existingComments = prevData.comments.filter(c => c._id !== tempId);

                const confirmedComment: Comment = {
                    _id: result.comment._id, // Use confirmed ID
                    user: result.comment.commenterName,
                    text: result.comment.text,
                    date: result.comment.timestamp,
                    parentId: result.comment.parentId, // Use confirmed parentId
                };

                // Add the confirmed comment
                existingComments.push(confirmedComment);

                return {
                    ...prev,
                    [projectName]: {
                        ...prevData,
                        // Sort comments again after adding confirmed one (optional, depends on desired order)
                        comments: existingComments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    }
                };
            });
        } else if (!result.success) {
             throw new Error(result.error || "Failed to save comment on server.");
        }

    } catch (error: any) {
        console.error("Failed to add comment/reply:", error);
        toast.error(`Failed to add comment/reply: ${error.message || "Unknown error"}`);
        // Rollback UI on error
        setProjectInteractions(originalInteractions);
        if (parentId) {
            setReplyInputs(originalReplyInputs); // Restore reply input
        } else {
            setCommentInputs(originalCommentInputs); // Restore main comment input
        }
        // Optionally reopen the reply input if rollback occurs
        // setReplyingTo(prev => ({ ...prev, [projectName]: parentId }));
    }
  };

  // Helper function to render comments recursively
  const renderComments = (projectId: string, comments: Comment[], parentId: string | null = null, level = 0) => {
    const children = comments.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <ul className={`space-y-2 ${level > 0 ? 'ml-4 pl-4 border-l border-gray-700' : ''}`}>
        {children.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((c) => {
          const isReplying = replyingTo[projectId] === c._id;
          const replyInputKey = `${projectId}_${c._id}`;
          const replyInputValue = replyInputs[replyInputKey] || "";

          return (
            <li key={c._id} className="text-gray-300 text-xs">
              <div>
                <span className="font-bold">{c.user}:</span> {c.text}
                <span className="text-gray-500 ml-2 text-[10px]">{new Date(c.date).toLocaleString()}</span>
                {/* Reply Button */}
                <button
                  onClick={() => setReplyingTo(prev => ({ ...prev, [projectId]: prev[projectId] === c._id ? null : c._id }))}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 text-[10px] font-semibold"
                  title="Reply"
                >
                  <FaReply className="inline mr-0.5" /> {isReplying ? 'Cancel' : 'Reply'}
                </button>
              </div>

              {/* Reply Input Form */}
              {isReplying && (
                <form
                  className="flex gap-1 mt-1 ml-4" // Indent reply form
                  onSubmit={e => {
                    e.preventDefault();
                    handleProjectComment(projectId, replyInputValue, c._id); // Pass comment ID as parentId
                  }}
                >
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 rounded bg-gray-700 text-xs text-gray-100 border border-gray-600"
                    placeholder={`Reply to ${c.user}...`}
                    value={replyInputValue}
                    onChange={e => setReplyInputs(inputs => ({ ...inputs, [replyInputKey]: e.target.value }))}
                    autoFocus // Focus the input when it appears
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-semibold">Post</button>
                </form>
              )}

              {/* Render Replies Recursively */}
              {renderComments(projectId, comments, c._id, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  // Fetch initial LeetCode stats if username exists
  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/profile?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setName(data.name || "");
          setBio(data.bio || "");
          setPhoto(data.photo || "");
          setLinkedin(data.linkedin || "");
          setGithub(data.github || "");
          setLeetcode(data.leetcode || "");
          setGfg(data.gfg || "");
          setCertificates(data.certificates || []);
          setExperiences(data.experiences || []);
          setProjects(data.projects || []);
          setCpProfiles(data.cpProfiles || []);
          setSkills(data.skills || []);
          setGithubRepos(data.githubRepos || []);
          setGfgStats(data.gfgStats || null);
          setLeetCodeStats(data.leetCodeStats || null);

          // Fetch initial LeetCode stats if username exists
          if (data.leetcode) {
            fetch(`http://127.0.0.1:8000/leetcode_stats/${data.leetcode}`)
              .then(r => {
                if (!r.ok) {
                  console.error(`Initial LeetCode stats fetch failed with status: ${r.status}`);
                  return r.text().then(text => {
                    console.error("LeetCode Response body:", text);
                    throw new Error(`HTTP error ${r.status}`);
                  });
                }
                return r.json();
              })
              .then(res => {
                if (res && res.status === "success" && typeof res.totalSolved === 'number') {
                  setLeetCodeStats(res);
                } else {
                  console.error("Failed to fetch initial LeetCode stats or invalid format:", res?.message || res);
                  setLeetCodeStats(null);
                }
              })
              .catch(err => {
                console.error("Initial LeetCode stats fetch/processing error", err);
                setLeetCodeStats(null);
              });
          } else {
            setLeetCodeStats(null);
          }
        });
    }
  }, [session, status, router]);

  const saveProfile = useCallback(async (profileData: any) => {
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      await update();
      toast.success("Profile updated!");
      setLastGithub(profileData.github);
      setLastLeetcode(profileData.leetcode);
      setLastGfg(profileData.gfg);
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile.");
    }
  }, [update]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let fetchedGithubRepos = githubRepos;
    let fetchedLeetCodeStats = leetCodeStats;
    let fetchedGfgStats = gfgStats;

    const statsCalls: Promise<any>[] = [];

    if (github) {
      statsCalls.push(
        fetch(`http://127.0.0.1:8000/github_stats/${github}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(res => {
            if (res && typeof res === "object" && Array.isArray(res.repos)) {
              setGithubRepos(res.repos);
              return res.repos;
            }
            setGithubRepos([]); return [];
          })
          .catch(err => { console.error("github_stats fetch error", err); setGithubRepos([]); return []; })
      );
    } else {
      setGithubRepos([]);
      fetchedGithubRepos = [];
    }

    if (leetcode) {
      statsCalls.push(
        fetch(`http://127.0.0.1:8000/leetcode_stats/${leetcode}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(res => {
            if (res && res.status === "success" && typeof res.totalSolved === 'number') {
              setLeetCodeStats(res);
              return res;
            }
            setLeetCodeStats(null); return null;
          })
          .catch(err => { console.error("leetcode_stats fetch error", err); setLeetCodeStats(null); return null; })
      );
    } else {
      setLeetCodeStats(null);
      fetchedLeetCodeStats = null;
    }

    if (gfg) {
      statsCalls.push(
        fetch(`http://127.0.0.1:8000/geeksforgeeks_stats/${encodeURIComponent(gfg)}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(res => {
            if (res && res.status === "success" && res.data?.info && res.data?.solvedStats) {
              setGfgStats(res.data);
              return res.data;
            }
            setGfgStats(null); return null;
          })
          .catch(err => { console.error("gfg_stats fetch error", err); setGfgStats(null); return null; })
      );
    } else {
      setGfgStats(null);
      fetchedGfgStats = null;
    }

    const results = await Promise.allSettled(statsCalls);

    let githubIndex = -1, leetcodeIndex = -1, gfgIndex = -1;
    let currentIndex = 0;
    if (github) githubIndex = currentIndex++;
    if (leetcode) leetcodeIndex = currentIndex++;
    if (gfg) gfgIndex = currentIndex++;

    if (githubIndex !== -1 && results[githubIndex]?.status === 'fulfilled') fetchedGithubRepos = results[githubIndex].value;
    if (leetcodeIndex !== -1 && results[leetcodeIndex]?.status === 'fulfilled') fetchedLeetCodeStats = results[leetcodeIndex].value;
    if (gfgIndex !== -1 && results[gfgIndex]?.status === 'fulfilled') fetchedGfgStats = results[gfgIndex].value;

    await saveProfile({
      email: session?.user?.email, name, bio, photo, linkedin, github, leetcode, gfg,
      certificates, experiences, projects, cpProfiles, skills,
      githubRepos: fetchedGithubRepos, leetCodeStats: fetchedLeetCodeStats, gfgStats: fetchedGfgStats,
    });

    setLoading(false);
  };

  const handleRefreshGithub = async () => {
    if (!github || refreshingGithub) return;
    setRefreshingGithub(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/github_stats/${github}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const res = await response.json();
      let updatedRepos = githubRepos;
      if (res && typeof res === "object" && Array.isArray(res.repos)) {
        setGithubRepos(res.repos);
        updatedRepos = res.repos;
      } else {
        console.error("Failed to fetch GitHub stats or invalid format:", res);
        setGithubRepos([]);
        updatedRepos = [];
      }
      await saveProfile({
        email: session?.user?.email, name, bio, photo, linkedin, github, leetcode, gfg,
        certificates, experiences, projects, cpProfiles, skills,
        githubRepos: updatedRepos,
        leetCodeStats, gfgStats,
      });
    } catch (error) {
      console.error("GitHub refresh/save error:", error);
      toast.error("Failed to refresh GitHub stats.");
    } finally {
      setRefreshingGithub(false);
    }
  };

  const handleRefreshLeetcode = async () => {
    if (!leetcode || refreshingLeetcode) return;
    setRefreshingLeetcode(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/leetcode_stats/${leetcode}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const res = await response.json();
      let updatedStats = leetCodeStats;
      if (res && res.status === "success" && typeof res.totalSolved === 'number') {
        setLeetCodeStats(res);
        updatedStats = res;
      } else {
        console.error("Failed to fetch LeetCode stats or invalid format:", res?.message || res);
        setLeetCodeStats(null);
        updatedStats = null;
      }
      await saveProfile({
        email: session?.user?.email, name, bio, photo, linkedin, github, leetcode, gfg,
        certificates, experiences, projects, cpProfiles, skills,
        githubRepos,
        leetCodeStats: updatedStats,
        gfgStats,
      });
    } catch (error) {
      console.error("LeetCode refresh/save error:", error);
      toast.error("Failed to refresh LeetCode stats.");
    } finally {
      setRefreshingLeetcode(false);
    }
  };

  const handleRefreshGfg = async () => {
    if (!gfg || refreshingGfg) return;
    setRefreshingGfg(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/geeksforgeeks_stats/${encodeURIComponent(gfg)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const res = await response.json();
      let updatedStats = gfgStats;
      if (res && res.status === "success" && res.data?.info && res.data?.solvedStats) {
        setGfgStats(res.data);
        updatedStats = res.data;
      } else {
        console.error("Failed to fetch GFG stats or invalid format:", res?.message || res);
        setGfgStats(null);
        updatedStats = null;
      }
      await saveProfile({
        email: session?.user?.email, name, bio, photo, linkedin, github, leetcode, gfg,
        certificates, experiences, projects, cpProfiles, skills,
        githubRepos, leetCodeStats,
        gfgStats: updatedStats,
      });
    } catch (error) {
      console.error("GFG refresh/save error:", error);
      toast.error("Failed to refresh GFG stats.");
    } finally {
      setRefreshingGfg(false);
    }
  };

  // Helper: Add repo as project, skills, and experience
  const handleAddRepoAsProject = (repo: GitHubRepo) => {
    // Add to projects if not already present
    setProjects(prev => {
      if (prev.some(p => p.name === repo.name)) return prev;
      return [
        ...prev,
        {
          name: repo.name,
          description: repo.description || "",
          link: repo.html_url,
        }
      ];
    });

    // Add repo languages as skills
    if (repo.languages) {
      setSkills(prev => {
        const langs = Object.keys(repo.languages);
        const newSkills = langs.filter(lang => !prev.includes(lang));
        return [...prev, ...newSkills];
      });
    } else if (repo.language && !skills.includes(repo.language)) {
      setSkills(prev => [...prev, repo.language!]);
    }

    // Add experience (company = repo owner, years = repo creation year)
    const owner = repo.full_name ? repo.full_name.split("/")[0] : github;
    const year = repo.created_at ? new Date(repo.created_at).getFullYear().toString() : "";
    setExperiences(prev => {
      if (prev.some(exp => exp.company === owner && exp.years === year)) return prev;
      return [
        ...prev,
        {
          company: owner,
          years: year,
          skills: repo.languages ? Object.keys(repo.languages) : (repo.language ? [repo.language] : []),
        }
      ];
    });

    setShowRepoPicker(false);
  };

  // Add new project handler
  const handleAddProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProject.name.trim()) return;

    // Prepare the project object to be added, including skills and experience
    const projectToAdd: Project = { // Ensure type safety
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      link: newProject.link.trim() || undefined, // Use undefined if empty
      skills: newProject.skills, // Add selected skills
      experience: newProject.experience || undefined, // Add selected experience link
    };

    // Compute the new projects array BEFORE updating state
    const updatedProjects = [...projects, projectToAdd];

    // Save the entire profile (including the new projects array) to MongoDB
    // The saveProfile function handles the API call to the backend
    try {
      setLoading(true); // Indicate loading state
      await saveProfile({
        email: session?.user?.email,
        name,
        bio,
        photo,
        linkedin,
        github,
        leetcode,
        gfg,
        certificates,
        experiences,
        projects: updatedProjects, // Pass the updated array with the new project
        cpProfiles,
        skills,
        // Pass existing fetched stats
        githubRepos,
        leetCodeStats,
        gfgStats,
      });

      // Update local state only after successful DB save
      setProjects(updatedProjects);
      // Reset the form for adding a new project
      setNewProject({ name: "", description: "", link: "", skills: [], experience: "" });
      setShowAddProject(false); // Close the modal
      toast.success("Project added successfully!"); // User feedback
    } catch (error) {
      console.error("Failed to add project:", error);
      toast.error("Failed to add project.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please sign in to view your profile.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950">
      <div className="bg-gray-900/90 shadow-2xl rounded-2xl p-10 w-full max-w-5xl text-gray-100">
        <h2 className="text-3xl font-bold text-indigo-300 mb-8 text-center md:text-left">
          Edit Profile
        </h2>
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left: Edit & Upload */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 border-r border-gray-800 pr-0 md:pr-8">
            <ProfilePhotoUploader photo={photo} setPhoto={setPhoto} />

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Name"
                className="border border-gray-700 bg-gray-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                type="text"
                placeholder="LinkedIn ID"
                className="border border-gray-700 bg-gray-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-100"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="GitHub ID"
                  className="flex-grow border border-gray-700 bg-gray-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700 text-gray-100"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRefreshGithub}
                  disabled={!github || refreshingGithub || loading}
                  className={`p-2 rounded ${refreshingGithub ? 'animate-spin' : ''} ${!github || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                  title="Refresh GitHub Stats"
                >
                  <FaRedo />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="LeetCode ID"
                  className="flex-grow border border-gray-700 bg-gray-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-100"
                  value={leetcode}
                  onChange={e => setLeetcode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRefreshLeetcode}
                  disabled={!leetcode || refreshingLeetcode || loading}
                  className={`p-2 rounded ${refreshingLeetcode ? 'animate-spin' : ''} ${!leetcode || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                  title="Refresh LeetCode Stats"
                >
                  <FaRedo />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="GeeksforGeeks ID"
                  className="flex-grow border border-gray-700 bg-gray-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-100"
                  value={gfg}
                  onChange={e => setGfg(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRefreshGfg}
                  disabled={!gfg || refreshingGfg || loading}
                  className={`p-2 rounded ${refreshingGfg ? 'animate-spin' : ''} ${!gfg || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                  title="Refresh GeeksforGeeks Stats"
                >
                  <FaRedo />
                </button>
              </div>

              <SkillsEditor skills={skills} setSkills={setSkills} />
              <CertificatesList certificates={certificates} setCertificates={setCertificates} setCertPreview={setCertPreview} />
              <ExperienceList experiences={experiences} setExperiences={setExperiences} availableSkills={skills} />
              <ProjectsList projects={projects} setProjects={setProjects} />

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition shadow mt-2 disabled:opacity-50"
                disabled={loading || refreshingGithub || refreshingLeetcode || refreshingGfg}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </form>
            {/* Add Project Button - Moved outside the form but still in the left column */}
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                className="bg-gray-700 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs font-semibold transition"
                onClick={() => setShowAddProject(true)}
              >
                + Add Project
              </button>
            </div>
          </div>

          {/* Right: Profile Preview */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-start gap-6 pl-0 md:pl-8 pt-8 md:pt-0">
            <div className="flex flex-col items-center gap-2 text-center">
              <img
                src={photo || "/default-avatar.png"}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover border-2 border-indigo-900 shadow"
              />
              <div className="font-semibold text-2xl mt-2">{name}</div>
              <div className="text-gray-400 text-base mb-2 max-w-xs">{bio}</div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {linkedin && (
                  <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline text-base" title="LinkedIn">
                    <FaLinkedin size={20} /> {linkedin}
                  </a>
                )}
                {github && (
                  <a href={`https://github.com/${github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-100 hover:underline text-base" title="GitHub">
                    <FaGithub size={20} /> {github}
                  </a>
                )}
                {leetcode && (
                  <a href={`https://leetcode.com/${leetcode}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-400 hover:underline text-base" title="LeetCode">
                    <SiLeetcode size={20} /> {leetcode}
                  </a>
                )}
                {gfg && (
                  <a href={`https://geeksforgeeks.org/${gfg}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-yellow-400 hover:underline text-base" title="GeeksforGeeks">
                    <FaTrophy size={20} /> {gfg}
                  </a>
                )}
              </div>
              <div className="mt-4">
                <WalletConnectButton />
              </div>
            </div>

            {/* LeetCode Stats Card */}
            {leetCodeStats && (
              <div className="w-full mt-4 bg-gray-800 rounded p-4 border border-gray-700">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <SiLeetcode size={24} className="text-orange-500" />
                    <h3 className="font-semibold text-indigo-300 text-lg">LeetCode Stats</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshLeetcode}
                    disabled={!leetcode || refreshingLeetcode || loading}
                    className={`p-1 rounded text-gray-400 ${refreshingLeetcode ? 'animate-spin' : ''} ${!leetcode || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white'}`}
                    title="Refresh LeetCode Stats"
                  >
                    <FaRedo size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300" title="Total Solved">
                    <FaCheck className="text-green-400" /> Solved: <span className="font-medium text-white">{leetCodeStats.totalSolved} / {leetCodeStats.totalQuestions}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300" title="Acceptance Rate">
                    <FaPercentage className="text-blue-400" /> Acceptance: <span className="font-medium text-white">{leetCodeStats.acceptanceRate?.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300" title="Ranking">
                    <FaMedal className="text-yellow-400" /> Ranking: <span className="font-medium text-white">{leetCodeStats.ranking?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300" title="Contribution Points">
                    <FaHandPointUp className="text-purple-400" /> Contribution: <span className="font-medium text-white">{leetCodeStats.contributionPoints}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-gray-300" title="Reputation">
                    <FaUserCheck className="text-teal-400" /> Reputation: <span className="font-medium text-white">{leetCodeStats.reputation}</span>
                  </div>
                  <div className="col-span-2 text-gray-300" title="Difficulty Breakdown">
                    <span className="font-semibold">Difficulty:</span>
                    <span className="ml-2 text-green-400">Easy: <span className="font-medium text-white">{leetCodeStats.easySolved}/{leetCodeStats.totalEasy}</span></span>
                    <span className="ml-2 text-orange-400">Medium: <span className="font-medium text-white">{leetCodeStats.mediumSolved}/{leetCodeStats.totalMedium}</span></span>
                    <span className="ml-2 text-red-500">Hard: <span className="font-medium text-white">{leetCodeStats.hardSolved}/{leetCodeStats.totalHard}</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* GFG Stats Card (Updated) */}
            {gfgStats && (
              <div className="w-full mt-4 bg-gray-800 rounded p-4 border border-gray-700">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <SiGeeksforgeeks size={24} className="text-green-500" />
                    <h3 className="font-semibold text-indigo-300 text-lg">GeeksforGeeks Stats</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshGfg}
                    disabled={!gfg || refreshingGfg || loading}
                    className={`p-1 rounded text-gray-400 ${refreshingGfg ? 'animate-spin' : ''} ${!gfg || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white'}`}
                    title="Refresh GeeksforGeeks Stats"
                  >
                    <FaRedo size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300" title="Coding Score">
                    <FaChartLine className="text-green-400" /> Score: <span className="font-medium text-white">{gfgStats.info.codingScore}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300" title="Total Problems Solved">
                    <FaTasks className="text-blue-400" /> Solved: <span className="font-medium text-white">{gfgStats.info.totalProblemsSolved}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300" title="Current Streak">
                    <FaFire className="text-orange-400" /> Current Streak: <span className="font-medium text-white">{gfgStats.info.currentStreak}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300" title="Max Streak">
                    <FaFire className="text-red-500" /> Max Streak: <span className="font-medium text-white">{gfgStats.info.maxStreak}</span>
                  </div>
                  {gfgStats.info.institute && (
                    <div className="col-span-2 flex items-center gap-2 text-gray-300" title="Institute">
                      <FaUniversity className="text-purple-400" /> Institute: <span className="font-medium text-white truncate">{gfgStats.info.institute} (Rank: {gfgStats.info.instituteRank || 'N/A'})</span>
                    </div>
                  )}
                  <div className="col-span-2 flex items-center gap-2 text-gray-300" title="Monthly Score">
                    <FaCalendarAlt className="text-yellow-400" /> Monthly Score: <span className="font-medium text-white">{gfgStats.info.monthlyScore}</span>
                  </div>
                  {/* Difficulty Breakdown */}
                  <div className="col-span-2 text-gray-300 mt-1" title="Difficulty Breakdown">
                    <span className="font-semibold flex items-center gap-1"><FaBrain /> Difficulty:</span>
                    <span className="ml-2 text-gray-400">Basic: <span className="font-medium text-white">{gfgStats.solvedStats.basic?.count ?? 0}</span></span>
                    <span className="ml-2 text-green-400">Easy: <span className="font-medium text-white">{gfgStats.solvedStats.easy?.count ?? 0}</span></span>
                    <span className="ml-2 text-orange-400">Medium: <span className="font-medium text-white">{gfgStats.solvedStats.medium?.count ?? 0}</span></span>
                    {gfgStats.solvedStats.hard && (
                      <span className="ml-2 text-red-500">Hard: <span className="font-medium text-white">{gfgStats.solvedStats.hard.count}</span></span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GitHub Repos Section */}
            {githubRepos.length > 0 && (
              <div className="w-full mt-4">
                <div className="flex items-center justify-between font-semibold text-indigo-300 mb-2">
                  <div className="flex items-center gap-2">
                    <FaGithub /> GitHub Repositories
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshGithub}
                    disabled={!github || refreshingGithub || loading}
                    className={`p-1 rounded text-gray-400 ${refreshingGithub ? 'animate-spin' : ''} ${!github || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white'}`}
                    title="Refresh GitHub Stats"
                  >
                    <FaRedo size={14} />
                  </button>
                </div>
                {/* Use Slider component */}
                <Slider {...sliderSettings}>
                  {githubRepos.map((repo, i) => {
                    const totalBytes = Object.values(repo.languages || {}).reduce((sum, bytes) => sum + bytes, 0);
                    const languagePercentages = totalBytes > 0
                      ? Object.entries(repo.languages || {})
                          .map(([lang, bytes]) => ({
                            name: lang,
                            percentage: ((bytes / totalBytes) * 100).toFixed(1),
                          }))
                          .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
                      : [];

                    return (
                      <div key={i} className="px-1.5"> {/* Add padding between slides */}
                        <div className="bg-gray-800 rounded p-3 border border-gray-700 hover:border-indigo-600 transition flex flex-col justify-between h-full"> {/* Ensure consistent height */}
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold block truncate flex-1 mr-2" title={repo.name}>
                                {repo.name}
                              </a>
                              {repo.fork && <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">Fork</span>}
                            </div>
                            <p className="text-gray-400 text-xs mb-2 line-clamp-2 min-h-[2.5em]">
                              {repo.description || <span className="italic">No description provided.</span>}
                            </p>
                            {repo.language && (
                              <p className="text-xs text-gray-400 mb-1">
                                <span className="font-semibold text-gray-300">Primary Language:</span> {repo.language}
                              </p>
                            )}
                            {languagePercentages.length > 0 && (
                              <div className="mt-1 mb-2">
                                <p className="text-xs font-semibold text-gray-300 mb-0.5">Languages:</p>
                                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                  {languagePercentages.map(lang => (
                                    <span key={lang.name} className="text-xs text-gray-400">
                                      {lang.name}: <span className="text-gray-300">{lang.percentage}%</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {repo.license && (
                              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <FaBalanceScale /> {repo.license.name}
                              </p>
                            )}
                            {repo.topics && repo.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                {repo.topics.slice(0, 3).map(topic => (
                                  <span key={topic} className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded text-xs">
                                    #{topic}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="border-t border-gray-700 pt-2 mt-2 text-xs text-gray-500">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1" title="Stars">
                                  <FaStar className="text-yellow-400" /> {repo.stargazers_count}
                                </span>
                                <span className="flex items-center gap-1" title="Watchers">
                                  <FaEye className="text-gray-400" /> {repo.watchers_count}
                                </span>
                                <span className="flex items-center gap-1" title="Forks">
                                  <FaCodeBranch className="text-blue-400" /> {repo.forks_count}
                                </span>
                                <span className="flex items-center gap-1" title="Open Issues">
                                  <FaExclamationCircle className="text-red-400" /> {repo.open_issues_count}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-between items-center text-xs gap-x-3 gap-y-1">
                              <span className="flex items-center gap-1" title={`Created: ${new Date(repo.created_at).toLocaleDateString()}`}>
                                <FaCalendarAlt /> {new Date(repo.created_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1" title={`Updated: ${new Date(repo.updated_at).toLocaleDateString()}`}>
                                <FaHistory /> {new Date(repo.updated_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1" title={`Last push: ${new Date(repo.pushed_at).toLocaleDateString()}`}>
                                <FaSyncAlt /> {new Date(repo.pushed_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Slider>
              </div>
            )}

            {projects.length > 0 && (
              <div className="w-full mt-4">
                <div className="font-semibold text-indigo-300 flex items-center gap-2 mb-2"><FaProjectDiagram /> Projects</div>
                <ul className="space-y-3">
                  {projects.map((p, i) => {
                    const repoData = getRepoDataForProject(p);
                    const interaction = projectInteractions[p.name] || { likes: 0, dislikes: 0, userLike: null, comments: [] };
                    const commentInput = commentInputs[p.name] || "";
                    return (
                      <li key={i} className="bg-gray-800 rounded px-4 py-3 text-sm border border-gray-700">
                        <div className="mb-1">
                          <span className="font-semibold text-indigo-200 text-base">{p.name}</span>
                        </div>
                        {p.description && (
                          <p className="text-gray-400 text-xs mb-2">{p.description}</p>
                        )}
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold text-xs mb-2 block">
                            {p.link}
                          </a>
                        )}
                        {/* Display Project Skills */}
                        {p.skills && p.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-2">
                            {p.skills.map((skill, skillIdx) => (
                              <span key={skillIdx} className="bg-indigo-700 text-white px-2 py-0.5 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Display Linked Experience */}
                        {p.experience && (
                           <p className="text-xs text-gray-400 mb-1">
                             <span className="font-semibold text-gray-300">Related Experience:</span> {p.experience}
                           </p>
                        )}
                        {/* GitHub repo preview card */}
                        {repoData && (
                          <div className="bg-gray-900 rounded p-3 border border-gray-700 my-2">
                            <div className="flex justify-between items-center mb-1">
                              <a href={repoData.html_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold block truncate flex-1 mr-2" title={repoData.name}>
                                {repoData.name}
                              </a>
                              {repoData.fork && <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">Fork</span>}
                            </div>
                            <p className="text-gray-400 text-xs mb-2 line-clamp-2 min-h-[2.5em]">
                              {repoData.description || <span className="italic">No description provided.</span>}
                            </p>
                            <div className="flex gap-4 text-xs text-gray-400 mb-1">
                              <span><FaStar className="inline mr-1 text-yellow-400" />{repoData.stargazers_count}</span>
                              <span><FaEye className="inline mr-1" />{repoData.watchers_count}</span>
                              <span><FaCodeBranch className="inline mr-1 text-blue-400" />{repoData.forks_count}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span><FaCalendarAlt className="inline mr-1" />{new Date(repoData.created_at).toLocaleDateString()}</span>
                              <span><FaHistory className="inline mr-1" />{new Date(repoData.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                        {/* Like/Dislike/Comment UI */}
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            className={`px-2 py-1 rounded text-xs font-semibold ${interaction.userLike === "like" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-200"}`}
                            onClick={() => handleProjectLike(p.name, "like")}
                          >
                            👍 {interaction.likes}
                          </button>
                          <button
                            className={`px-2 py-1 rounded text-xs font-semibold ${interaction.userLike === "dislike" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-200"}`}
                            onClick={() => handleProjectLike(p.name, "dislike")}
                          >
                            👎 {interaction.dislikes}
                          </button>
                        </div>
                        {/* Comments Section */}
                        <div className="mt-3 pt-2 border-t border-gray-700">
                          <div className="font-semibold text-xs text-indigo-300 mb-2">Comments</div>
                          {/* Render top-level comments using the helper */}
                          <div className="max-h-48 overflow-y-auto pr-2"> {/* Added scroll */}
                             {renderComments(p.name, interaction.comments)}
                          </div>

                          {/* Main Comment Input Form */}
                          <form
                            className="flex gap-1 mt-3"
                            onSubmit={e => {
                              e.preventDefault();
                              handleProjectComment(p.name, commentInput, null); // Pass null for parentId (top-level)
                            }}
                          >
                            <input
                              type="text"
                              className="flex-1 px-2 py-1 rounded bg-gray-700 text-xs text-gray-100 border border-gray-600"
                              placeholder="Add a comment..."
                              value={commentInput}
                              onChange={e => setCommentInputs(inputs => ({ ...inputs, [p.name]: e.target.value }))}
                            />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-semibold">Post</button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {skills.length > 0 && (
              <div className="w-full mt-4">
                <div className="font-semibold text-indigo-300 flex items-center gap-2 mb-2">Skills</div>
                <ul className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <li
                      key={i}
                      className="bg-gradient-to-r from-indigo-500 via-indigo-700 to-indigo-900 text-white px-3 py-1 rounded-full text-xs font-semibold shadow hover:scale-105 transition-transform border border-indigo-400"
                      style={{ letterSpacing: "0.04em", boxShadow: "0 2px 8px 0 rgba(80,80,180,0.10)" }}
                    >
                      #{skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {certificates.length > 0 && (
              <div className="w-full mt-4">
                <div className="font-semibold text-indigo-300 flex items-center gap-2 mb-2"><FaCertificate /> Certificates</div>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-1 bg-indigo-800/40 rounded-full" />
                  <ul className="space-y-6">
                    {certificates.map((c, i) => (
                      <li key={i} className="relative flex gap-4 items-center">
                        <span className="absolute left-0 top-2 w-4 h-4 bg-indigo-400 border-2 border-indigo-900 rounded-full shadow" />
                        <div className="flex flex-col md:flex-row md:items-center gap-2 bg-gray-800 rounded px-3 py-2 w-full ml-2">
                          <div className="flex-1">
                            <div className="font-semibold text-indigo-200">{c.title}</div>
                            <div className="text-gray-400 text-sm">{c.issuer} &middot; {c.year}</div>
                            {c.fileUrl && (
                              <div className="mt-2 flex items-center gap-3">
                                <button
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow flex items-center gap-2 transition text-xs"
                                  onClick={() => setCertPreview(c)}
                                >
                                  <FaUpload /> Preview
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {c.status === "pending" && (
                              <span className="flex items-center text-yellow-400">
                                <svg className="animate-spin mr-1 h-3 w-3" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Pending
                              </span>
                            )}
                            {c.status === "verified" && (
                              <span className="flex items-center text-green-400"><FaCheckCircle className="mr-1" />Verified</span>
                            )}
                            {!c.status && (
                              <span className="flex items-center text-red-400"><FaTimesCircle className="mr-1" />Not Verified</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {experiences.length > 0 && (
              <div className="w-full mt-4">
                <div className="font-semibold text-indigo-300 flex items-center gap-2 mb-2"><FaBriefcase /> Experience</div>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-1 bg-indigo-800/40 rounded-full" />
                  <ul className="space-y-6">
                    {experiences.map((exp, expIdx) => (
                      <li key={expIdx} className="relative">
                        <span className="absolute left-0 top-2 w-4 h-4 bg-indigo-400 border-2 border-indigo-900 rounded-full shadow" />
                        <div className="bg-gray-800 rounded px-3 py-2 ml-2">
                          <div className="font-bold text-indigo-200">{exp.company}</div>
                          <div className="text-gray-400 text-xs mb-1">{exp.years}</div>
                          {exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {exp.skills.map((skill, skillIdx) => (
                                <span key={skillIdx} className="bg-indigo-700 text-white px-2 py-0.5 rounded text-xs">
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
            )}

            {cpProfiles.length > 0 && (
              <div className="w-full mt-4">
                <div className="font-semibold text-indigo-300 flex items-center gap-2 mb-2"><FaTrophy /> CP Profiles</div>
                <ul className="space-y-1">
                  {cpProfiles.map((cp, i) => (
                    <li key={i} className="bg-gray-800 rounded px-3 py-1 text-sm">
                      <a href={cp.link} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline font-semibold">{cp.platform}</a>
                      <span className="text-gray-400"> - {cp.handle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div> {/* End of flex flex-col md:flex-row */}

        {/* Add Project Modal - Moved outside the main form and columns */}
        {showAddProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="font-bold text-indigo-300 text-lg">Add Project</div>
                <button onClick={() => setShowAddProject(false)} className="text-gray-400 hover:text-red-400 text-xl">&times;</button>
              </div>
              {/* Prevent Next.js hydration error: only render modal on client */}
              {typeof window !== "undefined" && (
                <form
                  onSubmit={handleAddProject} // Ensure this points to the correct handler
                  className="flex flex-col gap-3"
                >
                  {/* GitHub Repo Picker Option */}
                  {githubRepos.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Import from GitHub:</div>
                      <select
                        className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100 w-full"
                        value=""
                        onChange={e => {
                          const repo = githubRepos.find(r => r.html_url === e.target.value);
                          if (repo) {
                            setNewProject({
                              name: repo.name,
                              description: repo.description || "",
                              link: repo.html_url,
                              skills: [],
                              experience: "",
                            });
                          }
                        }}
                      >
                        <option value="">-- Select a GitHub Repo (optional) --</option>
                        {githubRepos.map((repo, idx) => (
                          <option key={repo.html_url} value={repo.html_url}>
                            {repo.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Project Name"
                    className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
                    value={newProject.name}
                    onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
                    value={newProject.description}
                    onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                  />
                  <input
                    type="text"
                    placeholder="Project Link (optional)"
                    className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100"
                    value={newProject.link}
                    onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))}
                  />
                  {/* Skills Tag Selector */}
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Skills (select multiple):</div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => (
                        <label key={skill} className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newProject.skills.includes(skill)}
                            onChange={e => {
                              setNewProject(p => ({
                                ...p,
                                skills: e.target.checked
                                  ? [...p.skills, skill]
                                  : p.skills.filter(s => s !== skill)
                              }));
                            }}
                          />
                          <span className="bg-indigo-700 text-white px-2 py-0.5 rounded">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Experience Selector */}
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Experience (optional):</div>
                    <select
                      className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-gray-100 w-full"
                      value={newProject.experience}
                      onChange={e => setNewProject(p => ({ ...p, experience: e.target.value }))}
                    >
                      <option value="">-- Select Experience --</option>
                      {experiences.map((exp, idx) => (
                        <option key={idx} value={exp.company + " (" + exp.years + ")"}>
                          {exp.company} ({exp.years})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => setShowAddProject(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" // Ensure this is type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-semibold"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div> {/* End of bg-gray-900/90 container */}

      <CertificatePreviewModal open={!!certPreview} onClose={() => setCertPreview(null)} cert={certPreview} />
    </main>
  );
}
