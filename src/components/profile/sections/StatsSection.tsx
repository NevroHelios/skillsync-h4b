import React from 'react';
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import { FaRedo, FaCheck, FaPercentage, FaMedal, FaHandPointUp, FaUserCheck, FaBrain, FaChartLine, FaTasks, FaFire, FaUniversity, FaCalendarAlt, FaStar, FaTrophy } from "react-icons/fa";

// --- Type Definitions ---
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

// --- Helper Components ---

// Compact StatItem
const StatItem: React.FC<{
  icon: React.ReactElement;
  label: string;
  value: string | number | undefined | null;
  tooltip: string;
  valueColorClass?: string;
  className?: string;
}> = ({ icon, label, value, tooltip, valueColorClass = 'text-gray-100', className = '' }) => (
  <div className={`flex flex-col items-center text-center p-1.5 rounded-md hover:bg-gray-700/30 transition-colors duration-200 ${className}`} title={tooltip}>
    <div className="text-lg sm:text-xl mb-0.5 opacity-80"> {/* Reduced size and margin */}
      {React.cloneElement(icon, { size: icon.props.size ? icon.props.size * 0.9 : 18 })} {/* Slightly smaller icon */}
    </div>
    <span className={`text-sm font-semibold tracking-tight ${valueColorClass}`}> {/* Reduced font size */}
      {value ?? <span className="text-xs text-gray-500">N/A</span>}
    </span>
    <span className="text-[11px] text-gray-400 mt-0">{label}</span> {/* Smaller label */}
  </div>
);

// Compact Difficulty Badge Component
const DifficultyBadge: React.FC<{
  level: 'B' | 'E' | 'M' | 'H';
  solved: number | undefined;
  total?: number | undefined;
  colorClass: string;
  bgColorClass: string;
}> = ({ level, solved, total, colorClass, bgColorClass }) => (
  <span className={`flex items-center gap-1 ${colorClass} ${bgColorClass} px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium shadow-sm`}> {/* Reduced padding and font size */}
    <span className="font-bold">{level}:</span>
    <span>{solved ?? 0}{total !== undefined ? `/${total}` : ''}</span>
  </span>
);

// --- Main Component ---

const StatsSection: React.FC<StatsSectionProps> = ({
  leetCodeStats, gfgStats, leetcode, gfg, handleRefreshLeetcode, handleRefreshGfg,
  loading, refreshingLeetcode, refreshingGfg
}) => {

  const renderLeetCodeCard = () => (
    <div
      className="relative bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-gray-700/60 hover:border-orange-500/70 transition-all duration-300 shadow-lg hover:shadow-orange-900/30 flex flex-col h-full"
    >
      {/* Refresh Button - adjusted positioning slightly */}
      <button
        type="button"
        onClick={handleRefreshLeetcode}
        disabled={!leetcode || refreshingLeetcode || loading}
        className={`absolute top-2.5 right-2.5 transition-all duration-200 rounded-full p-1.5 sm:p-2 bg-gray-800/50 hover:bg-gray-700/70 active:scale-90 shadow-md border border-gray-600/80 group disabled:opacity-50 disabled:cursor-not-allowed ${refreshingLeetcode ? 'animate-spin' : ''}`}
        title="Refresh LeetCode Stats"
      >
        <FaRedo size={12} className={`text-orange-400 group-hover:text-orange-300 transition-colors ${refreshingLeetcode ? 'opacity-50' : ''}`} /> {/* Smaller Icon */}
      </button>

      {/* Header - reduced margin mb-3 sm:mb-4 */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <SiLeetcode size={22} className="text-orange-400 drop-shadow-md flex-shrink-0" /> {/* Reduced size */}
        <h3 className="font-semibold text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 tracking-tight">
          LeetCode
        </h3>
      </div>

      {/* Main Stats Grid - reduced gap and margin mb-3 sm:mb-4 */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <StatItem icon={<FaCheck className="text-green-400" />} label="Solved" value={`${leetCodeStats.totalSolved}/${leetCodeStats.totalQuestions}`} tooltip={`Solved ${leetCodeStats.totalSolved} / ${leetCodeStats.totalQuestions}`} valueColorClass="text-green-300" />
        <StatItem icon={<FaPercentage className="text-blue-400" />} label="Accept %" value={`${leetCodeStats.acceptanceRate?.toFixed(1)}%`} tooltip="Acceptance Rate" valueColorClass="text-blue-300" />
        <StatItem icon={<FaMedal className="text-yellow-400" />} label="Rank" value={leetCodeStats.ranking?.toLocaleString()} tooltip="Ranking" valueColorClass="text-yellow-300" />
        <StatItem icon={<FaHandPointUp className="text-purple-400" />} label="Contrib." value={leetCodeStats.contributionPoints} tooltip="Contribution Points" valueColorClass="text-purple-300" />
        <StatItem icon={<FaStar className="text-teal-400" />} label="Rep." value={leetCodeStats.reputation} tooltip="Reputation" valueColorClass="text-teal-300" />
        <StatItem icon={<FaTrophy className="text-gray-400"/>} label="Contests" value={"N/A"} tooltip="Contest Rating (Example)" valueColorClass="text-gray-400"/>
      </div>

      {/* Difficulty Breakdown - reduced padding pt-3, mb-2 */}
      <div className="border-t border-gray-700/40 pt-3 mt-auto"> {/* Use mt-auto to push to bottom */}
        {/* <h4 className="text-xs font-semibold text-gray-400 mb-2 text-center sm:text-left">Difficulty</h4> */}
        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 sm:gap-2">
          <DifficultyBadge level="E" solved={leetCodeStats.easySolved} total={leetCodeStats.totalEasy} colorClass="text-green-400" bgColorClass="bg-green-900/40" />
          <DifficultyBadge level="M" solved={leetCodeStats.mediumSolved} total={leetCodeStats.totalMedium} colorClass="text-orange-400" bgColorClass="bg-orange-900/40" />
          <DifficultyBadge level="H" solved={leetCodeStats.hardSolved} total={leetCodeStats.totalHard} colorClass="text-red-400" bgColorClass="bg-red-900/40" />
        </div>
      </div>
    </div>
  );

  const renderGfgCard = () => (
     <div
      className="relative bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-gray-700/60 hover:border-green-500/70 transition-all duration-300 shadow-lg hover:shadow-green-900/30 flex flex-col h-full"
    >
       {/* Refresh Button - adjusted positioning slightly */}
        <button
            type="button"
            onClick={handleRefreshGfg}
            disabled={!gfg || refreshingGfg || loading}
             className={`absolute top-2.5 right-2.5 transition-all duration-200 rounded-full p-1.5 sm:p-2 bg-gray-800/50 hover:bg-gray-700/70 active:scale-90 shadow-md border border-gray-600/80 group disabled:opacity-50 disabled:cursor-not-allowed ${refreshingGfg ? 'animate-spin' : ''}`}
            title="Refresh GeeksforGeeks Stats"
        >
            <FaRedo size={12} className={`text-green-400 group-hover:text-green-300 transition-colors ${refreshingGfg ? 'opacity-50' : ''}`} /> {/* Smaller Icon */}
        </button>

      {/* Header - reduced margin mb-3 sm:mb-4 */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <SiGeeksforgeeks size={22} className="text-green-400 drop-shadow-md flex-shrink-0" /> {/* Reduced size */}
        <h3 className="font-semibold text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 tracking-tight">
          GeeksforGeeks
        </h3>
      </div>

       {/* Main Stats Grid - reduced gap and margin mb-3 sm:mb-4 */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <StatItem icon={<FaChartLine className="text-emerald-400" />} label="Score" value={gfgStats.info.codingScore} tooltip="Coding Score" valueColorClass="text-emerald-300" />
            <StatItem icon={<FaTasks className="text-blue-400" />} label="Solved" value={gfgStats.info.totalProblemsSolved} tooltip="Total Solved" valueColorClass="text-blue-300" />
            <StatItem icon={<FaFire className="text-orange-400" />} label="Streak" value={gfgStats.info.currentStreak} tooltip="Current Streak" valueColorClass="text-orange-300" />
            <StatItem icon={<FaTrophy className="text-red-500" />} label="Max Stk" value={gfgStats.info.maxStreak} tooltip="Max Streak" valueColorClass="text-red-400" />
            <StatItem icon={<FaCalendarAlt className="text-yellow-400" />} label="Monthly" value={gfgStats.info.monthlyScore} tooltip="Monthly Score" valueColorClass="text-yellow-300" />
             {gfgStats.info.institute && (
                <StatItem icon={<FaUniversity className="text-purple-400" />} label="Inst. Rnk" value={`${gfgStats.info.instituteRank || 'N/A'}`} tooltip={`Institute Rank (${gfgStats.info.institute})`} valueColorClass="text-purple-300" />
            )}
             {!gfgStats.info.institute && ( // Fill empty space if no institute
                 <StatItem icon={<FaBrain className="text-gray-500"/>} label="Skills" value={"N/A"} tooltip="Placeholder" valueColorClass="text-gray-400"/>
             )}
      </div>

       {/* Difficulty Breakdown - reduced padding pt-3, mb-2 */}
       <div className="border-t border-gray-700/40 pt-3 mt-auto"> {/* Use mt-auto */}
            {/* <h4 className="text-xs font-semibold text-gray-400 mb-2 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1"><FaBrain className="inline-block"/> Difficulty</h4> */}
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 sm:gap-2">
               <DifficultyBadge level="B" solved={gfgStats.solvedStats.basic?.count} colorClass="text-gray-400" bgColorClass="bg-gray-700/50" />
                <DifficultyBadge level="E" solved={gfgStats.solvedStats.easy?.count} colorClass="text-green-400" bgColorClass="bg-green-900/40" />
                <DifficultyBadge level="M" solved={gfgStats.solvedStats.medium?.count} colorClass="text-orange-400" bgColorClass="bg-orange-900/40" />
                {gfgStats.solvedStats.hard && (
                     <DifficultyBadge level="H" solved={gfgStats.solvedStats.hard.count} colorClass="text-red-400" bgColorClass="bg-red-900/40" />
                )}
            </div>
       </div>
    </div>
  );


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Render LeetCode Card if data exists */}
      {leetCodeStats ? (
        <div className="min-h-[220px] sm:min-h-[240px]"> {/* Set min-height */}
          {renderLeetCodeCard()}
        </div>
      ) : (
         !loading && <div className="min-h-[220px] sm:min-h-[240px] flex items-center justify-center text-gray-500 p-4 bg-gray-800/30 rounded-xl border border-dashed border-gray-600 text-sm">LeetCode stats not available.</div>
      )}

      {/* Render GFG Card if data exists */}
      {gfgStats ? (
        <div className="min-h-[220px] sm:min-h-[240px]"> {/* Set min-height */}
          {renderGfgCard()}
        </div>
      ) : (
         !loading && <div className="min-h-[220px] sm:min-h-[240px] flex items-center justify-center text-gray-500 p-4 bg-gray-800/30 rounded-xl border border-dashed border-gray-600 text-sm">GeeksforGeeks stats not available.</div>
      )}

       {/* Show Skeleton Loaders during initial load - adjusted height */}
       {loading && (
          <>
            <div className="skeleton-card min-h-[220px] sm:min-h-[240px] bg-gray-800/50 rounded-xl animate-pulse"></div>
            <div className="skeleton-card min-h-[220px] sm:min-h-[240px] bg-gray-800/50 rounded-xl animate-pulse"></div>
          </>
       )}
    </div>
  );
};

export default StatsSection;
