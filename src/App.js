import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import Home from './component/Home';
import About from './component/About';
import AllRecipes from './component/AllRecipes';
import './css/styles.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router>
      <Navbar setSearchTerm={setSearchTerm} />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/recipes' element={<AllRecipes searchTerm={searchTerm} />} />
        <Route path='/about' element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
