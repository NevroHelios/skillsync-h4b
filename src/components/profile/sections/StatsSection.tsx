import React from 'react';
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import { FaRedo, FaCheck, FaPercentage, FaMedal, FaHandPointUp, FaUserCheck, FaBrain, FaChartLine, FaTasks, FaFire, FaUniversity, FaCalendarAlt } from "react-icons/fa";

// Define types locally or import if defined globally
interface GfgSolvedStatsDetail {
  count: number;
  questions: { question: string; questionUrl: string }[];
}
interface GfgStats {
  info: { userName: string; fullName: string; profilePicture: string; institute: string; instituteRank: string; currentStreak: string; maxStreak: string; codingScore: number; monthlyScore: number; totalProblemsSolved: number; };
  solvedStats: { basic: GfgSolvedStatsDetail; easy: GfgSolvedStatsDetail; medium: GfgSolvedStatsDetail; hard?: GfgSolvedStatsDetail; };
}
interface LeetCodeStats {
  status: string; message?: string; totalSolved: number; totalQuestions: number; easySolved: number; totalEasy: number; mediumSolved: number; totalMedium: number; hardSolved: number; totalHard: number; acceptanceRate: number; ranking: number; contributionPoints: number; reputation: number; submissionCalendar?: Record<string, number>;
}

interface StatsSectionProps {
  leetCodeStats: LeetCodeStats | null;
  gfgStats: GfgStats | null;
  leetcode: string;
  gfg: string;
  handleRefreshLeetcode: () => Promise<void>;
  handleRefreshGfg: () => Promise<void>;
  loading: boolean;
  refreshingLeetcode: boolean;
  refreshingGfg: boolean;
}

const StatsSection: React.FC<StatsSectionProps> = ({
  leetCodeStats, gfgStats, leetcode, gfg, handleRefreshLeetcode, handleRefreshGfg,
  loading, refreshingLeetcode, refreshingGfg
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {leetCodeStats && (
        <div
          className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl p-5 sm:p-7 border border-gray-700/40 hover:border-yellow-500/60 transition-all duration-200 shadow-xl hover:shadow-2xl"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
          }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <SiLeetcode size={24} className="sm:size-7 text-orange-400 drop-shadow" />
              <h3 className="font-semibold text-gray-100 text-xl sm:text-2xl tracking-tight">LeetCode</h3>
            </div>
            <button
              type="button"
              onClick={handleRefreshLeetcode}
              disabled={!leetcode || refreshingLeetcode || loading}
              className={`refresh-button-sm transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingLeetcode ? 'animate-spin' : ''}`}
              title="Refresh LeetCode Stats"
            >
              <FaRedo size={16} className="text-yellow-300" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-gray-200" title="Total Solved">
              <FaCheck className="text-green-400" /> <span>Solved:</span>
              <span className="font-bold text-yellow-300">{leetCodeStats.totalSolved} / {leetCodeStats.totalQuestions}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200" title="Acceptance Rate">
              <FaPercentage className="text-blue-400" /> <span>Acceptance:</span>
              <span className="font-bold text-blue-300">{leetCodeStats.acceptanceRate?.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200" title="Ranking">
              <FaMedal className="text-yellow-400" /> <span>Ranking:</span>
              <span className="font-bold text-yellow-200">{leetCodeStats.ranking?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200" title="Contribution Points">
              <FaHandPointUp className="text-purple-400" /> <span>Contribution:</span>
              <span className="font-bold text-purple-300">{leetCodeStats.contributionPoints}</span>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-gray-200" title="Reputation">
              <FaUserCheck className="text-teal-400" /> <span>Reputation:</span>
              <span className="font-bold text-teal-300">{leetCodeStats.reputation}</span>
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-4 mt-2" title="Difficulty Breakdown">
              <span className="font-semibold text-gray-300">Difficulty:</span>
              <span className="text-green-400 bg-green-900/30 px-3 py-1 rounded-full font-medium">Easy: {leetCodeStats.easySolved}/{leetCodeStats.totalEasy}</span>
              <span className="text-orange-400 bg-orange-900/30 px-3 py-1 rounded-full font-medium">Medium: {leetCodeStats.mediumSolved}/{leetCodeStats.totalMedium}</span>
              <span className="text-red-400 bg-red-900/30 px-3 py-1 rounded-full font-medium">Hard: {leetCodeStats.hardSolved}/{leetCodeStats.totalHard}</span>
            </div>
          </div>
        </div>
      )}

      {gfgStats && (
        <div
          className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl p-5 sm:p-7 border border-gray-700/40 hover:border-green-500/60 transition-all duration-200 shadow-xl hover:shadow-2xl"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
          }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <SiGeeksforgeeks size={24} className="sm:size-7 text-green-400 drop-shadow" />
              <h3 className="font-semibold text-gray-100 text-xl sm:text-2xl tracking-tight">GeeksforGeeks</h3>
            </div>
            <button
              type="button"
              onClick={handleRefreshGfg}
              disabled={!gfg || refreshingGfg || loading}
              className={`refresh-button-sm transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingGfg ? 'animate-spin' : ''}`}
              title="Refresh GeeksforGeeks Stats"
            >
              <FaRedo size={16} className="text-green-300" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-gray-200" title="Coding Score">
              <FaChartLine className="text-green-400" /> <span>Score:</span>
              <span className="font-bold text-green-300">{gfgStats.info.codingScore}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200" title="Total Problems Solved">
              <FaTasks className="text-blue-400" /> <span>Solved:</span>
              <span className="font-bold text-blue-300">{gfgStats.info.totalProblemsSolved}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200" title="Current Streak">
              <FaFire className="text-orange-400" /> <span>Current Streak:</span>
              <span className="font-bold text-orange-300">{gfgStats.info.currentStreak}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200" title="Max Streak">
              <FaFire className="text-red-500" /> <span>Max Streak:</span>
              <span className="font-bold text-red-300">{gfgStats.info.maxStreak}</span>
            </div>
            {gfgStats.info.institute && (
              <div className="col-span-2 flex items-center gap-2 text-gray-200" title="Institute">
                <FaUniversity className="text-purple-400" /> <span>Institute:</span>
                <span className="font-bold text-purple-200 truncate">{gfgStats.info.institute} (Rank: {gfgStats.info.instituteRank || 'N/A'})</span>
              </div>
            )}
            <div className="col-span-2 flex items-center gap-2 text-gray-200" title="Monthly Score">
              <FaCalendarAlt className="text-yellow-400" /> <span>Monthly Score:</span>
              <span className="font-bold text-yellow-300">{gfgStats.info.monthlyScore}</span>
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-4 mt-2" title="Difficulty Breakdown">
              <span className="font-semibold flex items-center gap-1 text-gray-300"><FaBrain /> Difficulty:</span>
              <span className="text-gray-400 bg-gray-800/40 px-3 py-1 rounded-full font-medium">Basic: {gfgStats.solvedStats.basic?.count ?? 0}</span>
              <span className="text-green-400 bg-green-900/30 px-3 py-1 rounded-full font-medium">Easy: {gfgStats.solvedStats.easy?.count ?? 0}</span>
              <span className="text-orange-400 bg-orange-900/30 px-3 py-1 rounded-full font-medium">Medium: {gfgStats.solvedStats.medium?.count ?? 0}</span>
              {gfgStats.solvedStats.hard && (
                <span className="text-red-400 bg-red-900/30 px-3 py-1 rounded-full font-medium">Hard: {gfgStats.solvedStats.hard.count}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;
