import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <h1>🔐 Welcome to BurnZip</h1>
      <p>No login. No tracking. No logs. No footprint. Just trust.</p>
      <button onClick={() => navigate('/upload')}>Upload File</button>
      <button onClick={() => navigate('/message')}>Send Message</button>
    </div>
  );
}

export default LandingPage;
