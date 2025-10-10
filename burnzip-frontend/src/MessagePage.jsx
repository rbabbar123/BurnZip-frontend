import { useState } from 'react';
import { BACKEND_URL } from './config';

function MessagePage() {
  const [message, setMessage] = useState('');
  const [messageId, setMessageId] = useState(null);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!message) return;
    setStatus('Sending...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const { id } = await res.json();
      setMessageId(id);
      setStatus('Message sent');
    } catch (err) {
      setStatus('Send failed');
    }
  };

  const handleRetrieve = async () => {
    if (!messageId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/message/${messageId}`);
      const data = await res.json();
      setMessage(data.message || 'Message expired or not found');
    } catch {
      setMessage('Message expired or not found');
    }
  };

  return (
    <div className="App">
      <h2>Send Encrypted Message</h2>
      <textarea value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
      <p>{status}</p>
      {messageId && (
        <>
          <p>Share this ID: <strong>{messageId}</strong></p>
          <button onClick={handleRetrieve}>Retrieve Message</button>
        </>
      )}
    </div>
  );
}

export default MessagePage;
