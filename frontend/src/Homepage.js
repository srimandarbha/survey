import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.search.value.trim();
    alert(`You searched for: ${query}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Welcome to the SRE Maturity Assessment</h1>
      <form onSubmit={handleSearch} className="flex mb-6">
        <input
          type="text"
          name="search"
          placeholder="Search..."
          className="p-2 border border-gray-300 rounded-l focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
        >
          Search
        </button>
      </form>
      <button
        onClick={() => navigate('/survey')}
        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        Take the Survey
      </button>
    </div>
  );
};

export default Homepage;