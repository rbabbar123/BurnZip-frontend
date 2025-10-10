import { useState } from 'react';
import { BACKEND_URL } from './config';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: formData });
    const { id } = await res.json();
    const meta = await fetch(`${BACKEND_URL}/api/download/${id}`);
    const { url } = await meta.json();
    setDownloadUrl(url);
  };

  return (
    <div className="App">
      <h2>Upload File</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      {downloadUrl && <a href={downloadUrl} download>Download File</a>}
    </div>
  );
}

export default UploadPage;
