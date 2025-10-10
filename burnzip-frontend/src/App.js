import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import UploadPage from './UploadPage';
import MessagePage from './MessagePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/message" element={<MessagePage />} />
      </Routes>
    </Router>
  );
}

export default App;
