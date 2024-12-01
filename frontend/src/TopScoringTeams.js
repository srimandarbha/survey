import React from "react";

const TopScoringTeams = ({ submissions }) => {
  // Sort the submissions by score in descending order and pick top 10
  const topTeams = submissions
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Function to determine the score color based on the score value
  const getScoreColor = (score) => {
    if (score >= 90) return "text-blue-600"; // Elite
    if (score >= 80) return "text-green-600"; // Advanced
    if (score >= 50) return "text-yellow-600"; // Define
    if (score >= 35) return "text-orange-600"; // Developing
    return "text-red-600"; // Initiation
  };

  return (
    <div className="w-full lg:w-1/3 p-4 border border-gray-300 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">Top 10 Scoring Teams</h2>
      <div className="space-y-4">
        {topTeams.map((submission) => (
          <div
            key={submission.id}
            className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm hover:shadow-lg transition-shadow"
          >
            {/* Team Name in Red */}
            <div className="text-sm text-red-600 font-medium">
              {submission.team}
            </div>

            {/* Score with dynamic color based on value */}
            <div
              className={`text-sm font-bold ${getScoreColor(submission.score)}`}
            >
              {submission.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopScoringTeams;
