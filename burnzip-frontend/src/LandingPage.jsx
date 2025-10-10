import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const adZone = document.querySelector('.ad-zone');
    if (adZone && adZone.offsetHeight === 0) {
      console.log('Ad blocker detected');
      // Optional: show fallback message
    }
  }, []);

  return (
    <div className="App">
      <h1>🔐 Welcome to BurnZip</h1>
      <p>No login. No tracking. No logs. No footprint. Just trust.</p>
      <button onClick={() => navigate('/upload')}>Upload File</button>
      <button onClick={() => navigate('/message')}>Send Message</button>
      <div className="ad-zone" style={{ minHeight: '90px' }}></div>
    </div>
  );
}

export default LandingPage;
