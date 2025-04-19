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
  // Helper function to create compact stat items
  const StatItem = ({ icon, label, value, title, colorClass = 'text-gray-300' }: { icon: React.ReactNode, label: string, value: string | number | undefined, title: string, colorClass?: string }) => (
    <div className="flex items-center gap-1.5 text-xs sm:text-sm" title={title}>
      {icon}
      <span className={`font-medium ${colorClass}`}>{value ?? 'N/A'}</span>
    </div>
  );

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {leetCodeStats && (
        <div
          className="bg-gradient-to-br from-gray-900/70 to-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/50 hover:border-yellow-500/70 transition-all duration-200 shadow-lg hover:shadow-xl"
          style={{
            boxShadow: "0 6px 20px 0 rgba(0,0,0,0.15), 0 1px 4px 0 rgba(0,0,0,0.08)"
          }}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3">
              <SiLeetcode size={20} className="text-orange-400 drop-shadow" />
              <h3 className="font-semibold text-gray-100 text-lg sm:text-xl tracking-tight">LeetCode</h3>
            </div>
            <button
              type="button"
              onClick={handleRefreshLeetcode}
              disabled={!leetcode || refreshingLeetcode || loading}
              className={`refresh-button-sm transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingLeetcode ? 'animate-spin' : ''}`}
              title="Refresh LeetCode Stats"
            >
              <FaRedo size={14} className="text-yellow-300" />
            </button>
          </div>
          {/* Compacted Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3 mb-3 sm:mb-4">
            <StatItem icon={<FaCheck className="text-green-400" />} label="Solved" value={`${leetCodeStats.totalSolved}/${leetCodeStats.totalQuestions}`} title="Total Solved" colorClass="text-green-300" />
            <StatItem icon={<FaPercentage className="text-blue-400" />} label="Accept" value={`${leetCodeStats.acceptanceRate?.toFixed(1)}%`} title="Acceptance Rate" colorClass="text-blue-300" />
            <StatItem icon={<FaMedal className="text-yellow-400" />} label="Rank" value={leetCodeStats.ranking?.toLocaleString()} title="Ranking" colorClass="text-yellow-300" />
            <StatItem icon={<FaHandPointUp className="text-purple-400" />} label="Contrib" value={leetCodeStats.contributionPoints} title="Contribution Points" colorClass="text-purple-300" />
            <StatItem icon={<FaUserCheck className="text-teal-400" />} label="Rep" value={leetCodeStats.reputation} title="Reputation" colorClass="text-teal-300" />
          </div>
          {/* Compacted Difficulty Breakdown */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm" title="Difficulty Breakdown">
            <span className="font-semibold text-gray-300">Difficulty:</span>
            <span className="text-green-400 bg-green-900/40 px-2 py-0.5 rounded-full font-medium">E: {leetCodeStats.easySolved}/{leetCodeStats.totalEasy}</span>
            <span className="text-orange-400 bg-orange-900/40 px-2 py-0.5 rounded-full font-medium">M: {leetCodeStats.mediumSolved}/{leetCodeStats.totalMedium}</span>
            <span className="text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full font-medium">H: {leetCodeStats.hardSolved}/{leetCodeStats.totalHard}</span>
          </div>
        </div>
      )}

      {gfgStats && (
        <div
          className="bg-gradient-to-br from-gray-900/70 to-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/50 hover:border-green-500/70 transition-all duration-200 shadow-lg hover:shadow-xl"
          style={{
            boxShadow: "0 6px 20px 0 rgba(0,0,0,0.15), 0 1px 4px 0 rgba(0,0,0,0.08)"
          }}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3">
              <SiGeeksforgeeks size={20} className="text-green-400 drop-shadow" />
              <h3 className="font-semibold text-gray-100 text-lg sm:text-xl tracking-tight">GeeksforGeeks</h3>
            </div>
            <button
              type="button"
              onClick={handleRefreshGfg}
              disabled={!gfg || refreshingGfg || loading}
              className={`refresh-button-sm transition-all duration-200 rounded-full p-2 bg-gray-800 hover:bg-gray-700 active:scale-95 shadow-md border border-gray-700/60 ${refreshingGfg ? 'animate-spin' : ''}`}
              title="Refresh GeeksforGeeks Stats"
            >
              <FaRedo size={14} className="text-green-300" />
            </button>
          </div>
          {/* Compacted Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3 mb-3 sm:mb-4">
            <StatItem icon={<FaChartLine className="text-green-400" />} label="Score" value={gfgStats.info.codingScore} title="Coding Score" colorClass="text-green-300" />
            <StatItem icon={<FaTasks className="text-blue-400" />} label="Solved" value={gfgStats.info.totalProblemsSolved} title="Total Problems Solved" colorClass="text-blue-300" />
            <StatItem icon={<FaFire className="text-orange-400" />} label="Streak" value={gfgStats.info.currentStreak} title="Current Streak" colorClass="text-orange-300" />
            <StatItem icon={<FaFire className="text-red-500" />} label="Max" value={gfgStats.info.maxStreak} title="Max Streak" colorClass="text-red-300" />
            <StatItem icon={<FaCalendarAlt className="text-yellow-400" />} label="Monthly" value={gfgStats.info.monthlyScore} title="Monthly Score" colorClass="text-yellow-300" />
            {gfgStats.info.institute && (
              <StatItem icon={<FaUniversity className="text-purple-400" />} label="Inst." value={`${gfgStats.info.instituteRank || 'N/A'}`} title={`Institute: ${gfgStats.info.institute} (Rank)`} colorClass="text-purple-200" />
            )}
          </div>
          {/* Compacted Difficulty Breakdown */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm" title="Difficulty Breakdown">
            <span className="font-semibold flex items-center gap-1 text-gray-300"><FaBrain /> Difficulty:</span>
            <span className="text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded-full font-medium">B: {gfgStats.solvedStats.basic?.count ?? 0}</span>
            <span className="text-green-400 bg-green-900/40 px-2 py-0.5 rounded-full font-medium">E: {gfgStats.solvedStats.easy?.count ?? 0}</span>
            <span className="text-orange-400 bg-orange-900/40 px-2 py-0.5 rounded-full font-medium">M: {gfgStats.solvedStats.medium?.count ?? 0}</span>
            {gfgStats.solvedStats.hard && (
              <span className="text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full font-medium">H: {gfgStats.solvedStats.hard.count}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;
