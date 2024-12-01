import React, { useEffect, useState } from "react";
import TakeSurveyButton from "./TakeSurveyButton";
import TopScoringTeams from "./TopScoringTeams";

const Homepage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/fetch-submissions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }
        return response.json();
      })
      .then((data) => {
        setSubmissions(data);
        setFilteredSubmissions(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = submissions.filter(
      (submission) =>
        submission.team.toLowerCase().includes(query) ||
        JSON.stringify(submission.answers).toLowerCase().includes(query)
    );

    setFilteredSubmissions(filtered);
  };

  const getSreLevel = (score) => {
    if (score >= 0 && score <= 34) {
      return { level: "Initiation", color: "red" };
    } else if (score >= 35 && score <= 49) {
      return { level: "Developing", color: "orange" };
    } else if (score >= 50 && score <= 79) {
      return { level: "Define", color: "yellow" };
    } else if (score >= 80 && score <= 89) {
      return { level: "Advanced", color: "green" };
    } else if (score >= 90 && score <= 100) {
      return { level: "Elite", color: "blue" };
    }
    return { level: "Unknown", color: "gray" };
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="loader"></div>
        <p className="text-gray-500 mt-4">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 py-6 text-center">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header with company logo and user image */}
      <header className="bg-blue-600 text-white rounded-lg p-6 text-center shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Company Logo */}
          <img
            src="/path/to/logo.png"
            alt="Company Logo"
            className="h-10 w-10 rounded-full"
          />
          <h1 className="text-3xl font-bold ">SRE Maturity tracker</h1>
        </div>
        <div>
          {/* User Image */}
          <img
            src="/path/to/user.jpg"
            alt="User"
            className="h-10 w-10 rounded-full border-2 border-white"
          />
        </div>
      </header>

      {/* Search and Survey Button below the header */}
      <div className="flex flex-wrap items-center justify-between mt-6">
        <div className="flex-grow flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by team or answers..."
            value={searchQuery}
            onChange={handleSearch}
            className="flex-grow p-3 border rounded-lg shadow-sm"
          />
          <button
            onClick={() => setFilteredSubmissions(submissions)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 shadow-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Take Survey Button */}
      <div className="mt-4 text-center">
        <TakeSurveyButton />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Left: Submissions */}
        <div className="flex-grow">
          <h2 className="text-xl font-bold mb-4">All Submissions</h2>
          <div className="grid gap-4">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center text-gray-500">
                No submissions match your search criteria.
              </div>
            ) : (
              filteredSubmissions.map((submission) => {
                const { level, color } = getSreLevel(submission.score);
                return (
                  <div
                    key={submission.id}
                    className="border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-bold">{submission.team}</h3>
                    <p className="text-sm text-gray-600">
                      Score: <span className="font-medium">{submission.score}</span>
                      <span
                        className={`ml-2 text-sm text-${color}-500`}
                      >
                        ({level})
                      </span>
                    </p>

                    {/* Bar Graph for Score */}
                    <div className="relative pt-2">
                      <div
                        className={`absolute top-0 left-0 h-full bg-${color}-500`}
                        style={{ width: `${submission.score}%` }}
                      ></div>
                      <div className="absolute top-0 left-0 w-full flex justify-between text-xs text-white px-2">
                        <span>0</span>
                        <span>{submission.score}</span>
                        <span>100</span>
                      </div>
                    </div>

                    <pre className="bg-gray-100 text-sm p-3 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(submission.answers, null, 2)}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Top Scoring Teams */}
        <TopScoringTeams submissions={submissions} />
      </div>
    </div>
  );
};

export default Homepage;
