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
    dots: true, infinite: false, speed: 500, slidesToShow: 2, slidesToScroll: 2, arrows: true, autoplay: true, autoplaySpeed: 3000,
    responsive: [{ breakpoint: 1024, settings: { slidesToShow: 1, slidesToScroll: 1 } }]
  };

  if (!githubRepos || githubRepos.length === 0) {
    return null; // Don't render if no repos
  }

  return (
    <div className="w-full mt-0 section-container">
      <div
        className="section-header flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4"
        style={{
          background: "linear-gradient(90deg, rgba(36,37,46,0.95) 0%, rgba(44,48,66,0.85) 100%)",
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)"
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
            <div key={i} className="px-2 sm:px-3 py-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-2xl group"
                tabIndex={0}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-700/40 hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between h-full min-h-[250px] sm:min-h-[290px] shadow-xl hover:shadow-2xl group"
                  style={{
                    boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className="text-blue-300 group-hover:text-blue-400 group-hover:underline font-bold block truncate flex-1 mr-2 text-xl transition-colors duration-150"
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
                    <p className="text-gray-300 text-base mb-4 line-clamp-2 min-h-[2.8em] font-light">
                      {repo.description || <span className="italic text-gray-500">No description provided.</span>}
                    </p>
                    {repo.language && (
                      <p className="text-sm text-gray-400 mb-2">
                        <span className="font-medium text-gray-200">Primary:</span>
                        <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 text-xs font-semibold shadow-sm">
                          {repo.language}
                        </span>
                      </p>
                    )}
                    {languagePercentages.length > 0 && (
                      <div className="mt-2 mb-3.5">
                        <p className="text-sm font-medium text-gray-200 mb-1">Languages:</p>
                        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                          {languagePercentages.slice(0, 3).map(lang => (
                            <span key={lang.name}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-200 font-semibold shadow-sm"
                            >
                              {lang.name}: <span className="text-blue-200">{lang.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {repo.topics.slice(0, 4).map(topic => (
                          <span key={topic}
                            className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-800/60 to-blue-600/60 text-blue-100 font-semibold shadow-sm"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-700/40 pt-4 mt-auto text-sm text-gray-400">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5 hover:text-yellow-300 transition" title="Stars">
                          <FaStar className="text-yellow-400" /> {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-blue-300 transition" title="Forks">
                          <FaCodeBranch className="text-blue-400" /> {repo.forks_count}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5" title={`Updated: ${new Date(repo.updated_at).toLocaleDateString()}`}>
                        <FaHistory /> <span className="font-medium">{new Date(repo.updated_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </a>
              {/* Divider for mobile */}
              <div className="block md:hidden h-4" />
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default GithubReposSection;
