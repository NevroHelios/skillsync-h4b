import React from 'react';
import { FaBrain, FaCode, FaServer, FaCloud, FaLaptopCode } from 'react-icons/fa'; // Added FaLaptopCode

// Define the Domain type
type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA" | string; // Add DSA

// Define the structure of the score object stored for each domain
interface DomainScoreData {
  score: number;
  repos?: string[]; // Optional, based on error message
  lastUpdated?: Date | string; // Optional, based on error message
}

interface DomainScoresHeaderProps {
  // Update the scores prop type to expect DomainScoreData objects or null/undefined
  scores: { [key in Domain]?: DomainScoreData | number | null };
}

// Helper to get an icon based on domain name
const getDomainIcon = (domain: Domain) => {
  switch (domain) {
    case "AI/ML": return <FaBrain className="mr-1.5" />;
    case "Frontend": return <FaCode className="mr-1.5" />;
    case "Backend": return <FaServer className="mr-1.5" />;
    case "Cloud": return <FaCloud className="mr-1.5" />;
    case "DSA": return <FaLaptopCode className="mr-1.5" />; // Add DSA icon
    default: return null; // Or a default icon
  }
};

const DomainScoresHeader: React.FC<DomainScoresHeaderProps> = ({ scores }) => {
  // Process scores, extracting the numeric score from objects
  const topScores = Object.entries(scores)
    // Filter out entries where the value is null/undefined or doesn't have a valid score number
    .filter(([, scoreData]) => {
      if (scoreData === null || scoreData === undefined) return false;
      // Check if it's an object with a 'score' property or just a number
      const scoreValue = typeof scoreData === 'object' ? scoreData.score : scoreData;
      return typeof scoreValue === 'number';
    })
    // Sort based on the numeric score
    .sort(([, scoreDataA], [, scoreDataB]) => {
      const scoreA = typeof scoreDataA === 'object' ? scoreDataA?.score ?? 0 : (scoreDataA ?? 0);
      const scoreB = typeof scoreDataB === 'object' ? scoreDataB?.score ?? 0 : (scoreDataB ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, 3)
    // Map to the desired [Domain, number] format for rendering
    .map(([domain, scoreData]) => {
        const scoreValue = typeof scoreData === 'object' ? scoreData.score : scoreData;
        return [domain as Domain, scoreValue as number];
    }) as [Domain, number][];

  return (
    <div className="p-4 bg-gradient-to-r from-gray-800 via-gray-800/80 to-indigo-900/60 rounded-lg border border-gray-700/60 shadow-md mb-6">
      <h3 className="text-sm font-semibold text-indigo-300 mb-3 text-center uppercase tracking-wider">Top Domain Scores</h3>
      {topScores.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {/* Render using the extracted numeric score */}
          {topScores.map(([domain, score]) => (
            <div
              key={domain}
              className="flex flex-col items-center bg-gray-700/50 border border-gray-600/80 rounded-lg px-4 py-2 shadow-sm min-w-[100px] text-center transition hover:bg-gray-700/80"
            >
              <span className="text-xs text-gray-400 font-medium flex items-center mb-1">
                {getDomainIcon(domain)}
                {domain}
              </span>
              <span className="text-xl font-bold text-green-400">
                {score} {/* Now 'score' is guaranteed to be a number */}
                <span className="text-xs text-gray-500">/100</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-sm italic">No domain scores available yet. Use the 'Get Score' feature.</p>
      )}
    </div>
  );
};

export default DomainScoresHeader;
