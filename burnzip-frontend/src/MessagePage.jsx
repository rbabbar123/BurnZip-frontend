import { useState } from 'react';
import { BACKEND_URL } from './config';

function MessagePage() {
  const [message, setMessage] = useState('');
  const [messageId, setMessageId] = useState(null);

  const handleSend = async () => {
    const res = await fetch(`${BACKEND_URL}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const { id } = await res.json();
    setMessageId(id);
  };

  return (
    <div className="App">
      <h2>Send Encrypted Message</h2>
      <textarea value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
      {messageId && <p>Share this ID: <strong>{messageId}</strong></p>}
    </div>
  );
}

export default MessagePage;
