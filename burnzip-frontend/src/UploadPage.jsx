import { useState } from 'react';
import { BACKEND_URL } from './config';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const { id } = await res.json();
      const meta = await fetch(`${BACKEND_URL}/api/download/${id}`);
      const { url } = await meta.json();
      setDownloadUrl(url);
      setStatus(url ? 'Ready to download' : 'Link expired');
    } catch (err) {
      setStatus('Upload failed');
    }
  };

  return (
    <div className="App">
      <h2>Upload File</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <p>{status}</p>
      {downloadUrl && <a href={downloadUrl} download>Download File</a>}
    </div>
  );
}

export default UploadPage;
