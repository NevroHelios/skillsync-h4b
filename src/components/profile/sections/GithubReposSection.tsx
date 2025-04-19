import React from 'react';
import Slider from "react-slick";
import { FaGithub, FaRedo, FaStar, FaCodeBranch, FaHistory } from "react-icons/fa";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Define type locally or import
interface GitHubRepo {
  name: string; html_url: string; stargazers_count: number; watchers_count: number; forks_count: number; open_issues_count: number; pushed_at: string; created_at: string; updated_at: string; description: string | null; language: string | null; languages: Record<string, number>; license: { name: string } | null; topics: string[]; fork: boolean; full_name?: string; // Add full_name if used
}

interface GithubReposSectionProps {
  githubRepos: GitHubRepo[];
  github: string;
  handleRefreshGithub: () => Promise<void>;
  loading: boolean;
  refreshingGithub: boolean;
}

const GithubReposSection: React.FC<GithubReposSectionProps> = ({
  githubRepos, github, handleRefreshGithub, loading, refreshingGithub
}) => {
  const sliderSettings = {
    dots: true,
    infinite: githubRepos.length > 2, // Only infinite if enough slides
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 2,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4000, // Slightly slower autoplay
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024, // Medium screens and up
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: githubRepos.length > 2,
        }
      },
      {
        breakpoint: 768, // Small screens
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: githubRepos.length > 1,
          arrows: false, // Hide arrows on small screens
        }
      }
    ]
  };

  if (!githubRepos || githubRepos.length === 0) {
    return null; // Don't render if no repos
  }

  return (
    <div className="w-full mt-0 section-container">
      <div
        className="section-header flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg mb-3" // Reduced padding and margin
        style={{
          background: "linear-gradient(90deg, rgba(36,37,46,0.9) 0%, rgba(44,48,66,0.8) 100%)",
          boxShadow: "0 3px 15px 0 rgba(0,0,0,0.08)" // Reduced shadow
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">
          <FaGithub size={20} className="sm:size-6" /> <span>GitHub Repositories</span>
        </div>
        <button
          type="button"
          onClick={handleRefreshGithub}
          disabled={!github || refreshingGithub || loading}
          className={`refresh-button-sm transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingGithub ? 'animate-spin' : ''}`}
          title="Refresh GitHub Stats"
        >
          <FaRedo size={16} className="text-blue-300" />
        </button>
      </div>
      <Slider {...sliderSettings}>
        {githubRepos.map((repo, i) => {
          const totalBytes = Object.values(repo.languages || {}).reduce((sum, bytes) => sum + bytes, 0);
          const languagePercentages = totalBytes > 0
            ? Object.entries(repo.languages || {})
                .map(([lang, bytes]) => ({ name: lang, percentage: ((bytes / totalBytes) * 100).toFixed(1) }))
                .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
            : [];
          return (
            <div key={i} className="px-1.5 sm:px-2 py-1"> {/* Reduced padding */}
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-2xl group"
                tabIndex={0}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="bg-gradient-to-br from-gray-900/75 to-gray-800/65 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-blue-500/70 transition-all duration-200 flex flex-col justify-between h-full min-h-[220px] sm:min-h-[240px] shadow-lg hover:shadow-xl group" // Reduced min-height and padding
                  style={{
                    boxShadow: "0 6px 20px 0 rgba(0,0,0,0.15), 0 1px 4px 0 rgba(0,0,0,0.08)" // Adjusted shadow
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2"> {/* Reduced margin */}
                      <span
                        className="text-blue-300 group-hover:text-blue-400 group-hover:underline font-bold block truncate flex-1 mr-2 text-lg sm:text-xl transition-colors duration-150" // Slightly smaller text
                        title={repo.name}
                      >
                        {repo.name}
                      </span>
                      {repo.fork && (
                        <span className="text-xs text-gray-200 bg-blue-700/80 px-2 py-0.5 rounded-full font-semibold shadow-sm ml-2">
                          Fork
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm sm:text-base mb-2.5 line-clamp-2 min-h-[2.5em] font-light"> {/* Reduced margin and min-height */}
                      {repo.description || <span className="italic text-gray-500 text-sm">No description.</span>}
                    </p>
                    {repo.language && (
                      <p className="text-xs sm:text-sm text-gray-400 mb-1.5"> {/* Reduced margin */}
                        <span className="font-medium text-gray-200">Primary:</span>
                        <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 text-xs font-semibold shadow-sm">
                          {repo.language}
                        </span>
                      </p>
                    )}
                    {languagePercentages.length > 0 && (
                      <div className="mt-1.5 mb-2.5"> {/* Reduced margins */}
                        <p className="text-xs sm:text-sm font-medium text-gray-200 mb-1">Languages:</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-1"> {/* Reduced gap */}
                          {languagePercentages.slice(0, 2).map(lang => ( // Show only top 2
                            <span key={lang.name}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700/70 text-gray-200 font-semibold shadow-sm" // Reduced padding
                            >
                              {lang.name}: <span className="text-blue-200">{lang.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5"> {/* Reduced gap and margin */}
                        {repo.topics.slice(0, 3).map(topic => ( // Show only top 3
                          <span key={topic}
                            className="text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-800/70 to-blue-600/70 text-blue-100 font-semibold shadow-sm" // Smaller text, reduced padding
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-700/50 pt-2.5 mt-auto text-xs sm:text-sm text-gray-400"> {/* Reduced padding */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 sm:gap-5"> {/* Reduced gap */}
                        <span className="flex items-center gap-1 hover:text-yellow-300 transition" title="Stars">
                          <FaStar className="text-yellow-400" size={14} /> {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1 hover:text-blue-300 transition" title="Forks">
                          <FaCodeBranch className="text-blue-400" size={14} /> {repo.forks_count}
                        </span>
                      </div>
                      <span className="flex items-center gap-1" title={`Updated: ${new Date(repo.updated_at).toLocaleDateString()}`}>
                        <FaHistory size={13} /> <span className="font-medium">{new Date(repo.updated_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </a>
              {/* Divider for mobile */}
              <div className="block md:hidden h-3" /> {/* Reduced height */}
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default GithubReposSection;
