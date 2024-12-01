import React from "react";
import { useNavigate } from "react-router-dom";

const TakeSurveyButton = () => {
  const navigate = useNavigate();

  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-6"
      onClick={() => navigate("/survey")}
    >
      Take SRE Survey
    </button>
  );
};

export default TakeSurveyButton;
