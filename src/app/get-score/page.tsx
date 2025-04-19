"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaGithub, FaSpinner, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaBrain, FaSearch } from "react-icons/fa";
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import { toast } from "react-toastify";
import DomainScoresHeader from "@/components/profile/DomainScoresHeader"; // Import DomainScoresHeader

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

// Define a type for GFG Stats
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

type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA" | ""; // Add DSA
type ScoringType = "Domain" | "General"; // Add scoring type

// Define the structure of the score object stored for each domain
interface DomainScoreData {
  score: number;
  repos?: string[];
  lastUpdated?: Date | string;
}

// Define a type for the user profile data fetched
interface UserProfile {
  name?: string;
  email: string;
  photo?: string;
  github?: string;
  leetcode?: string;
  gfg?: string;
  githubRepos?: GitHubRepo[];
  leetCodeStats?: LeetCodeStats | null;
  gfgStats?: GfgStats | null;
  scores?: { [key in Domain]?: DomainScoreData | number | null }; // Ensure Domain includes DSA
}

export default function GetScorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For the scoring API call
  const [isFetchingProfile, setIsFetchingProfile] = useState(true); // For initial profile load
  const [scoreResult, setScoreResult] = useState<{ score: number | null; output: string | null; error?: string | null }>({ score: null, output: null, error: null });
  const [isStreaming, setIsStreaming] = useState(false); // Add state to track streaming
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [selectedDomain, setSelectedDomain] = useState<Domain>(""); // State for selected domain
  const [scoringType, setScoringType] = useState<ScoringType>("Domain"); // State for scoring type

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/signin");
      return;
    }
    if (session?.user?.email) {
      setIsFetchingProfile(true);
      fetch(`/api/profile?email=${session.user.email}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch profile: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          // Ensure scores is initialized correctly if missing
          if (!data.scores) data.scores = {}; // Initialize scores if missing
          setProfile(data); // Set the fetched profile data
        })
        .catch((err) => {
          console.error("Error fetching profile:", err);
          toast.error("Could not load your profile data.");
          setProfile(null); // Set profile to null on error
        })
        .finally(() => {
          setIsFetchingProfile(false);
        });
    } else {
      setIsFetchingProfile(false); // No email, stop fetching
    }
  }, [session, status, router]);

  const handleRepoSelection = (repo: GitHubRepo) => {
    setSelectedRepos((prevSelected) => {
      const isSelected = prevSelected.some((r) => r.html_url === repo.html_url);
      if (isSelected) {
        return prevSelected.filter((r) => r.html_url !== repo.html_url);
      } else {
        return [...prevSelected, repo];
      }
    });
  };

  const parseScoreFromOutput = (text: string): number | null => {
    const scoreMatch = text.match(/Overall Score:\s*(\d{1,3})\s*\/\s*100/i);
    if (scoreMatch && scoreMatch[1]) {
      const score = parseInt(scoreMatch[1], 10);
      return Math.min(Math.max(score, 0), 100); // Clamp score
    }
    return null;
  };

  const updateProfileScore = async (domain: Domain, score: number, repoUrls: string[]) => {
    if (!session?.user?.email || !domain || score === null) return;

    try {
      const response = await fetch("/api/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          domain,
          score,
          repos: repoUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update profile score: ${response.status}`);
      }
      toast.info(`Score for ${domain} saved to your profile.`);
    } catch (error) {
      console.error("Error updating profile score:", error);
      toast.error(`Could not save score to profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGetScore = async () => {
    if (!profile || selectedRepos.length === 0) {
      toast.error("Please select at least one repository.");
      return;
    }
    // Require domain only if scoring type is "Domain"
    if (scoringType === "Domain" && !selectedDomain) {
      toast.error("Please select a domain to score against.");
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setScoreResult({ score: null, output: "", error: null });

    const payload = {
      selectedRepos: selectedRepos.map((repo) => ({
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
      leetCodeStats: profile.leetCodeStats,
      gfgStats: profile.gfgStats,
      githubUsername: profile.github,
      leetcodeUsername: profile.leetcode,
      gfgUsername: profile.gfg,
      scoringType: scoringType, // Add scoring type to payload
      // Conditionally add domain based on scoring type
      ...(scoringType === "Domain" && { domain: selectedDomain }),
    };

    try {
      const response = await fetch("/api/score-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `API request failed: ${response.status}` }));
        console.error("Scoring API Error Response:", errorData);
        throw new Error(errorData.error || `Scoring API failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedOutput = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream finished.");
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        accumulatedOutput += chunk;
        setScoreResult((prev) => ({
          ...prev,
          output: accumulatedOutput,
          score: parseScoreFromOutput(accumulatedOutput),
        }));
      }

      const finalScore = parseScoreFromOutput(accumulatedOutput);
      setScoreResult((prev) => ({ ...prev, score: finalScore }));

      // Only update profile score if a specific domain was targeted
      if (scoringType === "Domain" && selectedDomain && finalScore !== null) {
        toast.success(`Analysis complete for ${selectedDomain}!`);
        const repoUrls = selectedRepos.map((r) => r.html_url);
        await updateProfileScore(selectedDomain, finalScore, repoUrls);

        // Optimistically update profile state
        setProfile((prevProfile) =>
          prevProfile
            ? {
                ...prevProfile,
                scores: {
                  ...prevProfile.scores,
                  [selectedDomain]: {
                    score: finalScore,
                    repos: repoUrls,
                    lastUpdated: new Date().toISOString(),
                  },
                },
              }
            : null
        );
      } else if (finalScore !== null) {
        toast.success("General analysis complete!");
        // Handle general score display if needed, but don't save to domain-specific profile scores
      } else {
        toast.warn("Analysis complete, but score could not be extracted.");
      }
    } catch (error) {
      console.error("Error getting score:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to get score: ${errorMessage}`);
      setScoreResult({ score: null, output: null, error: `Error occurred during scoring: ${errorMessage}` });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const filteredRepos = profile?.githubRepos
    ?.filter((repo) => !repo.fork)
    .filter((repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (repo.topics && repo.topics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase())))
    ) ?? [];

  if (status === "loading" || isFetchingProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <FaSpinner className="animate-spin text-4xl text-indigo-400" />
        <span className="ml-3 text-lg text-gray-300">Loading Profile...</span>
      </main>
    );
  }

  if (!session || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <div className="text-lg text-red-400">Could not load profile data.</div>
          <div className="text-sm text-gray-500 mt-2">Please ensure you are signed in and try refreshing the page.</div>
        </div>
      </main>
    );
  }

  // Profile is guaranteed non-null here
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gray-900/90 shadow-2xl rounded-2xl p-8 text-gray-100">
          <h1 className="text-3xl font-bold text-indigo-300 mb-2 text-center">Get Your AI Profile Score</h1>
          <p className="text-center text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
            Select relevant GitHub repositories. We'll combine this with your LeetCode/GFG stats (if available) and use AI to generate an analysis and score. Choose 'Score Specific Domain' to target a domain or 'General Repo Analysis' for a broader overview.
          </p>

          <div className="flex items-center gap-4 mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
            <img
              src={profile.photo || "/default-avatar.png"}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-900"
            />
            <div>
              <h2 className="text-xl font-semibold">{profile.name || profile.email}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                {profile.github && (
                  <span className="flex items-center gap-1">
                    <FaGithub /> {profile.github}
                  </span>
                )}
                {profile.leetcode && (
                  <span className="flex items-center gap-1">
                    <SiLeetcode /> {profile.leetcode}
                  </span>
                )}
                {profile.gfg && (
                  <span className="flex items-center gap-1">
                    <SiGeeksforgeeks /> {profile.gfg}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Display Current Scores - Pass the potentially mixed scores object */}
          {profile && profile.scores && Object.keys(profile.scores).length > 0 && (
            <div className="mb-8">
              <DomainScoresHeader scores={profile.scores} />
            </div>
          )}

          {/* Select Scoring Type Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-indigo-400 mb-4">Select Analysis Type</h3>
            <div className="flex flex-wrap gap-3">
              {(["Domain", "General"] as ScoringType[]).map((type) => (
                <label
                  key={type}
                  className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition duration-200 ${
                    scoringType === type
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-gray-800 border-gray-700 hover:border-indigo-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="scoringType"
                    value={type}
                    checked={scoringType === type}
                    onChange={() => setScoringType(type)}
                    className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500 mr-2"
                  />
                  <span className="text-sm font-medium">{type === "Domain" ? "Score Specific Domain" : "General Repo Analysis"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Select Domain Section (Conditional) */}
          {scoringType === "Domain" && (
            <div className="mb-8 transition-opacity duration-300 ease-in-out">
              <h3 className="text-xl font-semibold text-indigo-400 mb-4">Select Scoring Domain</h3>
              <div className="flex flex-wrap gap-3">
                {/* Add DSA to the list of selectable domains */}
                {(["AI/ML", "Frontend", "Backend", "Cloud", "DSA"] as Domain[]).map((domain) => (
                  <label
                    key={domain}
                    className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition duration-200 ${
                      selectedDomain === domain
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-800 border-gray-700 hover:border-indigo-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="domain"
                      value={domain}
                      checked={selectedDomain === domain}
                      onChange={() => setSelectedDomain(domain)}
                      className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500 mr-2"
                    />
                    <span className="text-sm font-medium">{domain}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-indigo-400 mb-4">Select GitHub Repositories</h3>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search repositories by name, description, language, topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-700 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>

            {profile.githubRepos && profile.githubRepos.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 border border-gray-700 rounded-lg p-4 bg-gray-800/50 custom-scrollbar">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo) => (
                    <div
                      key={repo.html_url}
                      className="flex items-start gap-3 p-3 bg-gray-800 rounded-md border border-gray-700 hover:border-indigo-600 transition duration-200"
                    >
                      <input
                        type="checkbox"
                        id={repo.html_url}
                        checked={selectedRepos.some((r) => r.html_url === repo.html_url)}
                        onChange={() => handleRepoSelection(repo)}
                        className="mt-1 form-checkbox h-5 w-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor={repo.html_url} className="flex-1 cursor-pointer">
                        <p className="font-medium text-indigo-300">{repo.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                          {repo.description || <span className="italic">No description</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {repo.language && `Lang: ${repo.language} | `}Stars: {repo.stargazers_count} | Updated:{" "}
                          {new Date(repo.pushed_at).toLocaleDateString()}
                        </p>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 px-4 text-gray-500 italic">
                    No repositories match your search term "{searchTerm}".
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 px-4 border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
                <FaGithub className="text-4xl text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 italic">
                  No non-forked repositories found for {profile.github || "your profile"}.
                </p>
                <p className="text-xs text-gray-600 mt-1">Make sure your GitHub username is correct in your profile.</p>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-2 text-right">Selected {selectedRepos.length} repositories.</p>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={handleGetScore}
              disabled={isLoading || selectedRepos.length === 0 || (scoringType === 'Domain' && !selectedDomain)} // Update disabled condition
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto text-lg"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <FaBrain className="mr-1" />
                  {/* Adjust button text based on scoring type */}
                  {scoringType === "Domain"
                    ? `Get AI Score for ${selectedDomain || "Domain"}`
                    : "Get General Analysis"}
                </>
              )}
            </button>
          </div>

          {(scoreResult.output || scoreResult.error || isLoading) && (
            <div className="mt-10 p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-inner">
              <h3 className="text-2xl font-semibold text-indigo-400 mb-5 text-center">
                {/* Adjust results header text */}
                AI Analysis Result {scoringType === "Domain" && selectedDomain && `for ${selectedDomain}`}
              </h3>

              {scoreResult.error && !isLoading && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <FaTimesCircle /> Scoring Error
                  </p>
                  <p>{scoreResult.error}</p>
                </div>
              )}

              {scoreResult.score !== null && (
                <div className="text-center mb-6">
                  <p className="text-lg text-gray-300 mb-1">Overall Score:</p>
                  <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
                    {scoreResult.score} <span className="text-3xl text-gray-500">/ 100</span>
                  </p>
                </div>
              )}

              {(isLoading || scoreResult.output) && !scoreResult.error && (
                <>
                  <h4 className="text-lg font-medium mb-2 text-gray-300">
                    Model Analysis:
                    {isStreaming ? <span className="text-sm text-gray-400 ml-2">(Streaming...)</span> : ""}
                  </h4>
                  <div className="bg-gray-900 p-4 rounded text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto border border-gray-700 min-h-[100px] max-h-[400px] custom-scrollbar">
                    {scoreResult.output}
                    {isStreaming && <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1"></span>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #2d3748; /* gray-800 */
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #4a5568; /* gray-600 */
            border-radius: 10px;
            border: 2px solid #2d3748; /* gray-800 */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #718096; /* gray-500 */
          }
          @keyframes blink {
            50% {
              opacity: 0;
            }
          }
          .animate-pulse {
            animation: blink 1s step-end infinite;
          }
        `}</style>
      </main>
    </>
  );
}
