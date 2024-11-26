import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Homepage from './Homepage';
import QuestionnairePanels from './QuestionnairePanels';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/survey" element={<QuestionnairePanels />} />
      </Routes>
    </Router>
  );
};

export default App;
