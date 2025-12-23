import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import Home from './pages/Home';
import Reading from './pages/Reading';
import Result from './pages/Result';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reading/:spreadType" element={<Reading />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
