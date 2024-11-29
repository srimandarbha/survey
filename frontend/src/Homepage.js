import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch submissions from the database
  const fetchSubmissions = () => {
    setLoading(true);
    fetch("/api/fetch-submissions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }
        return response.json();
      })
      .then((data) => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching submissions:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSearch = () => {
    // Implement search functionality across multiple fields
    const filteredSubmissions = submissions.filter((submission) =>
      submission.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(submission.answers)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setSubmissions(filteredSubmissions);
  };

  const handleEdit = (submission) => {
    setEditingId(submission.id);
    // Create a deep clone of the submission for editing
    setEditingSubmission({ ...submission });
  };

  const handleSave = () => {
    if (!editingId) return;

    try {
      fetch("/api/update-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          answers: editingSubmission.answers,
          team: editingSubmission.team,
          score: editingSubmission.score,
          previous_score: editingSubmission.previous_score,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to update submission");
          }
          return response.json();
        })
        .then(() => {
          // Reset editing state and refresh submissions
          setEditingId(null);
          setEditingSubmission({});
          fetchSubmissions();
        })
        .catch((error) => {
          console.error("Error updating submission:", error);
          alert(`Update failed: ${error.message}`);
        });
    } catch (parseError) {
      alert("Invalid submission data. Please check your input.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingSubmission({});
  };

  const redirectToSurvey = (id) => {
    navigate(`/survey?id=${id}`);
  };

  if (loading) {
    return <div className="text-center p-4">Loading submissions...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex mb-6 space-x-2">
        <input
          type="text"
          placeholder="Search by team or answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      <div className="grid gap-4">
        {submissions.length === 0 ? (
          <p className="text-center text-gray-500">No submissions found</p>
        ) : (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="border rounded p-4 bg-white shadow-sm"
            >
              {editingId === submission.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Team</label>
                    <input
                      type="text"
                      value={editingSubmission.team || ''}
                      onChange={(e) => setEditingSubmission(prev => ({ ...prev, team: e.target.value }))}
                      className="mt-1 block w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Answers</label>
                    <textarea
                      value={JSON.stringify(editingSubmission.answers, null, 2)}
                      onChange={(e) => {
                        try {
                          setEditingSubmission(prev => ({
                            ...prev, 
                            answers: JSON.parse(e.target.value)
                          }));
                        } catch {
                          // Optional: handle parsing errors
                        }
                      }}
                      className="mt-1 block w-full p-2 border rounded"
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Score</label>
                    <input
                      type="text"
                      value={editingSubmission.score || ''}
                      onChange={(e) => setEditingSubmission(prev => ({ ...prev, score: e.target.value }))}
                      className="mt-1 block w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous Score</label>
                    <input
                      type="number"
                      value={editingSubmission.previous_score || 0}
                      onChange={(e) => setEditingSubmission(prev => ({ ...prev, previous_score: parseInt(e.target.value) }))}
                      className="mt-1 block w-full p-2 border rounded"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2">
                    Submission #{submission.id}
                  </h2>
                  <div className="mb-4">
                    <strong>Team:</strong> {submission.team}
                  </div>
                  <pre className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto">
                    {JSON.stringify(submission.answers, null, 2)}
                  </pre>
                  <div className="text-sm text-gray-500 mb-2">
                    <div>Submitted: {new Date(submission.timestamp).toLocaleString()}</div>
                    <div>Score: {submission.score}</div>
                    <div>  
                      <span>Version: {submission.version}</span>
                      {submission.previousScore && (
                      <span>Previous Score: {submission.previousScore}</span>)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(submission)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit Submission
                    </button>
                    <button
                      onClick={() => redirectToSurvey(submission.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Go to Survey
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
