"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { encode } from "starknet";
import { FaSpinner } from "react-icons/fa";

// Import types and components
import { Certificate, Experience, Project, CPProfile, Skill } from "../../components/profile/types";
import CertificatePreviewModal from "../../components/profile/CertificatePreviewModal";
import ProjectChatbot from "@/components/ProjectChatbot";
import DeveloperWalletConnect from "@/components/DeveloperWalletConnect";

// Import Section Components
import ProfileHeader from "@/components/profile/sections/ProfileHeader";
import EditDetailsForm from "@/components/profile/sections/EditDetailsForm";
import StatsSection from "@/components/profile/sections/StatsSection";
import GithubReposSection from "@/components/profile/sections/GithubReposSection";
import ProjectsSection from "@/components/profile/sections/ProjectsSection";
import SkillsSection from "@/components/profile/sections/SkillsSection";
import CertificatesSection from "@/components/profile/sections/CertificatesSection";
import ExperienceSection from "@/components/profile/sections/ExperienceSection";
import CpProfilesSection from "@/components/profile/sections/CpProfilesSection";
import AddProjectModal from "@/components/profile/sections/AddProjectModal";

// Define types locally or import if defined globally
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
  full_name?: string;
}
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
interface Comment {
  _id: string;
  user: string;
  text: string;
  date: string;
  parentId: string | null;
  userEmail?: string;
}

type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA" | "";

interface DomainScoreData {
  score: number;
  repos?: string[];
  lastUpdated?: Date | string;
}

interface UserProfile {
  _id?: any;
  name?: string;
  email: string;
  photo?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
  gfg?: string;
  certificates?: Certificate[];
  experiences?: Experience[];
  projects?: Project[];
  cpProfiles?: CPProfile[];
  skills?: Skill[];
  githubRepos?: GitHubRepo[];
  leetCodeStats?: LeetCodeStats | null;
  gfgStats?: GfgStats | null;
  scores?: { [key in Domain]?: DomainScoreData | number | null };
}

export default function Profile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const profileEmail = emailParam || session?.user?.email || '';

  const [user, setUser] = useState<UserProfile | null>(null);
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
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
    link: string;
    skills: string[];
    experience: string;
  }>({ name: "", description: "", link: "", skills: [], experience: "" });
  const [projectInteractions, setProjectInteractions] = useState<Record<string, any>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isGeneratingScores, setIsGeneratingScores] = useState(false);
  const [hireBadges, setHireBadges] = useState<{ uri: string; tx: string }[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/signin");
      return;
    }
    if (profileEmail) {
      setLoading(true);
      fetch(`/api/profile?email=${encodeURIComponent(profileEmail)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`)))
        .then((data: UserProfile) => {
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
          if (!data.scores) data.scores = {};
          setLastGithub(data.github || "");
          setLastLeetcode(data.leetcode || "");
          setLastGfg(data.gfg || "");
        })
        .catch((err) => {
          console.error("Failed to fetch profile:", err);
          toast.error("Could not load profile data.");
          setUser(null);
        })
        .finally(() => setLoading(false));
    }

    // --- Fetch Hire NFT Badges ---
    // Only fetch if session and profileEmail match (i.e., viewing own profile)
    if (session?.user?.email && profileEmail && session.user.email === profileEmail) {
      fetch(`/api/applications/user?email=${encodeURIComponent(profileEmail)}`)
        .then(res => res.ok ? res.json() : [])
        .then((apps: any[]) => {
          // Filter for accepted applications with hireNftUri and tx hash
          const badges = (apps || [])
            .filter(app => app.hireNftUri && app.hireNftTxHash)
            .map(app => ({
              uri: app.hireNftUri,
              tx: app.hireNftTxHash,
            }));
          setHireBadges(badges);
        })
        .catch(() => setHireBadges([]));
    }
  }, [session, status, router, profileEmail]);

  const saveProfile = useCallback(
    async (profileData: Partial<UserProfile>) => {
      if (!session?.user?.email) {
        toast.error("Session expired. Please log in again.");
        return;
      }
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profileData, email: session.user.email }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        await update();
        toast.success("Profile updated!");
        setUser((prevUser) => (prevUser ? { ...prevUser, ...profileData } : null));
      } catch (error) {
        console.error("Failed to save profile:", error);
        toast.error(`Failed to save profile: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [session?.user?.email, update]
  );

  const generateAndSaveDomainScore = useCallback(
    async (domainToScore: Domain, allRepos: GitHubRepo[], currentProfileData: UserProfile | null) => {
      if (!currentProfileData || !session?.user?.email || !domainToScore || allRepos.length === 0) {
        console.log(`Skipping score generation for ${domainToScore}: Missing data.`);
        return;
      }

      console.log(`Starting score generation for domain: ${domainToScore}`);

      const payload = {
        selectedRepos: allRepos.map((repo) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          languages: repo.languages,
          topics: repo.topics,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          pushed_at: repo.pushed_at,
          created_at: repo.created_at,
        })),
        leetCodeStats: currentProfileData.leetCodeStats,
        gfgStats: currentProfileData.gfgStats,
        githubUsername: currentProfileData.github,
        leetcodeUsername: currentProfileData.leetcode,
        gfgUsername: currentProfileData.gfg,
        scoringType: "Domain",
        domain: domainToScore,
      };

      try {
        const response = await fetch("/api/score-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Scoring API failed for ${domainToScore}: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedOutput = "";
        let finalScore: number | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulatedOutput += decoder.decode(value, { stream: true });
        }

        const scoreMatch = accumulatedOutput.match(/Overall Score:\s*(\d{1,3})\s*\/\s*100/i);
        if (scoreMatch && scoreMatch[1]) {
          finalScore = Math.min(Math.max(parseInt(scoreMatch[1], 10), 0), 100);
        }

        if (finalScore !== null) {
          console.log(`Score generated for ${domainToScore}: ${finalScore}`);
          const updateResponse = await fetch("/api/update-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              domain: domainToScore,
              score: finalScore,
              repos: [],
            }),
          });

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to save score for ${domainToScore}`);
          }

          setUser((prevUser) => {
            if (!prevUser) return null;
            const newScores = {
              ...(prevUser.scores || {}),
              [domainToScore]: {
                score: finalScore!,
                lastUpdated: new Date().toISOString(),
                repos: [],
              },
            };
            return { ...prevUser, scores: newScores };
          });
          toast.success(`Score for ${domainToScore} updated!`);
        } else {
          console.warn(`Could not parse score for ${domainToScore} from output.`);
          toast.warn(`Could not extract score for ${domainToScore}.`);
        }
      } catch (error) {
        console.error(`Error generating/saving score for ${domainToScore}:`, error);
        toast.error(`Failed to generate/save score for ${domainToScore}.`);
      }
    },
    [session?.user?.email]
  );

  const fetchProjectInteractions = useCallback(async () => {
    if (!profileEmail || !session?.user?.email) return;
    try {
      const res = await fetch(
        `/api/project-interactions?email=${encodeURIComponent(profileEmail)}&viewerEmail=${encodeURIComponent(session.user.email)}`
      );
      if (res.ok) {
        const data = await res.json();
        setProjectInteractions(data);
      } else {
        console.warn('Failed to fetch project interactions');
      }
    } catch (err) {
      console.error('Error fetching project interactions:', err);
    }
  }, [profileEmail, session]);

  useEffect(() => {
    fetchProjectInteractions();
  }, [fetchProjectInteractions]);

  const handleProjectComment = async (
    projectName: string,
    comment: string,
    parentId: string | null
  ) => {
    if (!profileEmail) return;
    try {
      const res = await fetch('/api/project-interactions/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectOwnerEmail: profileEmail, projectName, comment, parentId })
      });
      if (!res.ok) throw new Error('Failed to post comment');
      await fetchProjectInteractions();
    } catch (err) {
      console.error('Error posting project comment:', err);
      toast.error('Could not post comment');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session?.user?.email) {
      toast.error("Session not found. Please log in.");
      return;
    }
    setLoading(true);

    let fetchedGithubRepos = githubRepos;
    let fetchedLeetCodeStats = leetCodeStats;
    let fetchedGfgStats = gfgStats;
    const githubChanged = github !== lastGithub;
    const leetcodeChanged = leetcode !== lastLeetcode;
    const gfgChanged = gfg !== lastGfg;

    const statsCalls: Promise<any>[] = [];

    if (github && (githubChanged || githubRepos.length === 0)) {
      setRefreshingGithub(true);
      statsCalls.push(
        fetch(`http://127.0.0.1:8000/github_stats/${github}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(`GitHub API Error: ${r.status}`)))
          .then((res) => {
            if (res && Array.isArray(res.repos)) {
              fetchedGithubRepos = res.repos.filter((repo: GitHubRepo) => !repo.fork);
              setGithubRepos(fetchedGithubRepos);
              console.log("Fetched GitHub Repos:", fetchedGithubRepos.length);
              return fetchedGithubRepos;
            }
            throw new Error("Invalid GitHub stats format");
          })
          .catch((err) => {
            console.error("GitHub fetch error:", err);
            setGithubRepos([]);
            return [];
          })
          .finally(() => setRefreshingGithub(false))
      );
    } else {
      fetchedGithubRepos = githubRepos.filter((repo: GitHubRepo) => !repo.fork);
    }

    if (leetcode && leetcodeChanged) {
      setRefreshingLeetcode(true);
      statsCalls.push(
        fetch(`http://127.0.0.1:8000/leetcode_stats/${leetcode}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(`LeetCode API Error: ${r.status}`)))
          .then((res) => {
            if (res?.status === "success") {
              fetchedLeetCodeStats = res;
              setLeetCodeStats(res);
              return res;
            }
            throw new Error(res?.message || "Invalid LeetCode stats format");
          })
          .catch((err) => {
            console.error("LeetCode fetch error:", err);
            setLeetCodeStats(null);
            return null;
          })
          .finally(() => setRefreshingLeetcode(false))
      );
    }

    if (gfg && gfgChanged) {
      setRefreshingGfg(true);
      statsCalls.push(
        fetch(`http://127.0.0.1:8000/geeksforgeeks_stats/${gfg}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(`GFG API Error: ${r.status}`)))
          .then((res) => {
            if (res?.status === "success") {
              fetchedGfgStats = res.data;
              setGfgStats(res.data);
              return res.data;
            }
            throw new Error(res?.message || "Invalid GFG stats format");
          })
          .catch((err) => {
            console.error("GFG fetch error:", err);
            setGfgStats(null);
            return null;
          })
          .finally(() => setRefreshingGfg(false))
      );
    }

    try {
      await Promise.allSettled(statsCalls);
      console.log("Stats fetching complete.");

      const profileDataToSave: Partial<UserProfile> = {
        email: session.user.email,
        name,
        bio,
        photo,
        linkedin,
        github,
        leetcode,
        gfg,
        certificates,
        experiences,
        projects,
        cpProfiles,
        skills,
        githubRepos: fetchedGithubRepos,
        leetCodeStats: fetchedLeetCodeStats,
        gfgStats: fetchedGfgStats,
        scores: user?.scores || {},
      };

      await saveProfile(profileDataToSave);

      const targetDomains: Domain[] = ["Frontend", "AI/ML", "Cloud", "DSA"];
      const currentScores = user?.scores || {};
      const needsScoreUpdate = githubChanged || targetDomains.some((d) => !currentScores[d]);

      if (github && fetchedGithubRepos.length > 0 && needsScoreUpdate) {
        setIsGeneratingScores(true);
        toast.info("GitHub profile updated. Generating domain scores in the background...");

        const profileForScoring: UserProfile = {
          ...profileDataToSave,
          email: session.user.email,
          leetCodeStats: fetchedLeetCodeStats,
          gfgStats: fetchedGfgStats,
          githubRepos: fetchedGithubRepos,
        };

        const scorePromises = targetDomains.map((domain) =>
          generateAndSaveDomainScore(domain, fetchedGithubRepos, profileForScoring)
        );

        Promise.allSettled(scorePromises).then(() => {
          setIsGeneratingScores(false);
          toast.success("Background score generation complete.");
          console.log("All background score generations attempted.");
        });
      }

      setLastGithub(github);
      setLastLeetcode(leetcode);
      setLastGfg(gfg);
    } catch (error) {
      console.error("Error during profile save process:", error);
      toast.error("An error occurred while saving profile data.");
    } finally {
      setLoading(false);
    }
  };

  const updateProjectsOnServer = async (updatedProjects: Project[]) => {
    if (!session?.user?.email) return;
    try {
      const payload: any = {
        email: session.user.email,
        name,
        bio,
        photo,
        linkedin,
        github,
        leetcode,
        gfg,
        certificates,
        experiences,
        projects: updatedProjects,
        cpProfiles,
        skills,
        githubRepos,
        leetCodeStats,
        gfgStats,
      };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      toast.success('Projects updated in profile!');
    } catch (err: any) {
      console.error('Error updating projects:', err);
      toast.error(`Could not save projects: ${err.message || err}`);
    }
  };

  const handleAddProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProject.name.trim()) {
      toast.warn('Project name is required');
      return;
    }
    const updated = [...projects, newProject];
    setProjects(updated);
    setNewProject({ name: '', description: '', link: '', skills: [], experience: '' });
    setShowAddProject(false);
    // Persist only projects via full profile payload
    await updateProjectsOnServer(updated);
  };

  const getExplorerUrl = (txHash: string) =>
    txHash ? `https://voyager.online/tx/${txHash}` : "#";

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-lg text-indigo-300">Loading Profile...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-lg text-red-400">Please sign in to view your profile.</div>
      </main>
    );
  }

  return (
    <main className=" ">
      <div className=" shadow-xl rounded-xl  md:p-12 w-full  mx-auto">
        <h2 className="text-3xl font-semibold text-gray-100 mb-12 text-center">
          Developer Profile
        </h2>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <EditDetailsForm
            photo={photo}
            setPhoto={setPhoto}
            name={name}
            setName={setName}
            bio={bio}
            setBio={setBio}
            linkedin={linkedin}
            setLinkedin={setLinkedin}
            github={github}
            setGithub={setGithub}
            leetcode={leetcode}
            setLeetcode={setLeetcode}
            gfg={gfg}
            setGfg={setGfg}
            skills={skills}
            setSkills={setSkills}
            certificates={certificates}
            setCertificates={setCertificates}
            setCertPreview={setCertPreview}
            experiences={experiences}
            setExperiences={setExperiences}
            cpProfiles={cpProfiles}
            setCpProfiles={setCpProfiles}
            handleSave={handleSave}
            handleRefreshGithub={() => {}}
            handleRefreshLeetcode={() => {}}
            handleRefreshGfg={() => {}}
            setShowAddProject={setShowAddProject}
            loading={loading}
            refreshingGithub={refreshingGithub}
            refreshingLeetcode={refreshingLeetcode}
            refreshingGfg={refreshingGfg}
          />
          <div className="w-full flex flex-col items-center lg:items-start gap-10">
            <div className="flex flex-row items-center gap-4 w-full">
              <div className="w-1/3">
                <div className="space-y-4">
                  <ProfileHeader
                    photo={photo}
                    name={name}
                    bio={bio}
                    linkedin={linkedin}
                    github={github}
                    leetcode={leetcode}
                    gfg={gfg}
                    scores={user?.scores}
                    hireBadges={hireBadges}
                  />
                  <DeveloperWalletConnect />
                  {isGeneratingScores && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 text-sm">
                      <FaSpinner className="animate-spin" />
                      <span>Generating domain scores...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-2/3">
                <div className="space-y-6">
                  <StatsSection
                    leetCodeStats={leetCodeStats}
                    gfgStats={gfgStats}
                    leetcode={leetcode}
                    gfg={gfg}
                    handleRefreshLeetcode={() => {}}
                    handleRefreshGfg={() => {}}
                    loading={loading}
                    refreshingLeetcode={refreshingLeetcode}
                    refreshingGfg={refreshingGfg}
                  />
                  <GithubReposSection
                    githubRepos={githubRepos}
                    github={github}
                    handleRefreshGithub={() => {}}
                    loading={loading}
                    refreshingGithub={refreshingGithub}
                  />
                </div>
              </div>
            </div>
            <ProjectsSection
              projects={projects}
              githubRepos={githubRepos}
              projectInteractions={projectInteractions}
              session={session}
              user={user}
              handleProjectLike={async () => { /* TODO: implement likes */ }}
              handleProjectComment={handleProjectComment}
              renderComments={() => {}}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
            />
            {projects.length > 0 && (
              <ProjectChatbot 
                projects={projects.map((p) => {
                  // Find matching GitHub repo
                  const githubRepo = githubRepos?.find(
                    repo => repo.html_url === p.link || repo.name === p.name
                  );
                  
                  return {
                    name: p.name,
                    description: p.description,
                    link: p.link,
                    skills: p.skills,
                    experience: p.experience,
                    // Add GitHub specific details if available
                    repoUrl: githubRepo?.html_url,
                    stars: githubRepo?.stargazers_count,
                    forks: githubRepo?.forks_count,
                    language: githubRepo?.language,
                    topics: githubRepo?.topics,
                    lastUpdate: githubRepo?.updated_at,
                    creation: githubRepo?.created_at,
                  };
                })} 
              />
            )}
            <SkillsSection skills={skills} />
            <CertificatesSection
              certificates={certificates}
              setCertPreview={setCertPreview}
            />
            <ExperienceSection experiences={experiences} />
            <CpProfilesSection cpProfiles={cpProfiles} />
          </div>
        </div>
        <AddProjectModal
          showAddProject={showAddProject}
          setShowAddProject={setShowAddProject}
          newProject={newProject}
          setNewProject={setNewProject}
          githubRepos={githubRepos}
          skills={skills}
          experiences={experiences}
          handleAddProject={handleAddProject}
        />
      </div>
      <CertificatePreviewModal
        open={!!certPreview}
        onClose={() => setCertPreview(null)}
        cert={certPreview}
      />
    </main>
  );
}