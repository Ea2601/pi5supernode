import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Homepage from './pages/Homepage';
import Documentation from './pages/Documentation';
import Troubleshooting from './pages/Troubleshooting';
import Releases from './pages/Releases';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <Header />
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/troubleshooting" element={<Troubleshooting />} />
              <Route path="/releases" element={<Releases />} />
            </Routes>
          </motion.main>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;
