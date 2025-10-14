import React, {useState, useRef} from "react";

/**
 * App.js — BurnZip landing page + simple client-side upload flow
 * - No analytics, no tracking code included
 * - Minimal, privacy-forward UI and explanatory content
 * - "Get Started" opens a small uploader that accepts File or Message mode
 * - The uploader only demonstrates local client-side flow (no network operations)
 */

const Section = ({title, children}) => (
  <section style={{marginBottom:28}}>
    <h2 style={{fontSize:20, margin:"6px 0"}}>{title}</h2>
    <div style={{color:"#333", lineHeight:1.5}}>{children}</div>
  </section>
);

export default function App() {
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [mode, setMode] = useState("file"); // "file" or "message"
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  function randomExampleCode() {
    // generate 10-char alphanumeric sample
    return Math.random().toString(36).slice(2, 12).toUpperCase();
  }

  function openUploader() {
    setCode(randomExampleCode());
    setMessage("");
    setPreview(null);
    setUploaderOpen(true);
  }

  function handlePrepare() {
    if (mode === "file") {
      const f = fileInputRef.current && fileInputRef.current.files[0];
      if (!f) return alert("Select a file first");
      setPreview(`${f.name} (${Math.round(f.size/1024)} KB)`);
      alert(`Prepared for upload: ${f.name}\nID: (share this) ${code}`);
      // Real upload would encrypt client-side and post blob + metadata.
    } else {
      if (!message.trim()) return alert("Enter a message first");
      setPreview(`Message preview: ${message.slice(0,140)}`);
      alert(`Prepared for upload: message\nID: (share this) ${code}`);
    }
  }

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      color:"#111",
      padding:20,
      maxWidth:980,
      margin:"18px auto"
    }}>
      <header style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:16}}>
        <div>
          <h1 style={{margin:0, fontSize:28, display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:20}}>🔐</span>
            <span>Welcome to BurnZip</span>
          </h1>
          <p style={{margin:"6px 0 0 0", color:"#444", maxWidth:720}}>
            No login. No tracking metadata. No logs. No storage. No footprint. Just trust.
          </p>
        </div>

        <div style={{textAlign:"right"}}>
          <button
            onClick={openUploader}
            style={{
              backgroundColor:"#0b63d8",
              color:"#fff",
              border:"none",
              padding:"10px 14px",
              borderRadius:8,
              cursor:"pointer",
              fontWeight:600
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      <main style={{marginTop:18}}>
        <p style={{fontSize:16, color:"#222"}}>
          A privacy-first, SaaS framework that leverages modular AI to facilitate encrypted file sharing — without compromising user autonomy.
        </p>

        <div style={{
          border:"1px solid #e6e6e6", padding:16, borderRadius:10, marginTop:14, background:"#fafafa"
        }}>
          <strong>We only generate $ through advertisements, not your data.</strong>
        </div>

        <div style={{display:"flex", gap:18, marginTop:22, flexWrap:"wrap"}}>
          <div style={{flex:"1 1 320px"}}>
            <Section title="✅ What’s Stored">
              <div>
                <strong>Encrypted file blobs, never raw data.</strong> Stored short-lived cache. Auto-deletes after expiry (24 hours) or download.
              </div>
            </Section>

            <Section title="🧠 Where It’s Stored">
              <div>No persistent disk storage. No database footprint. On third-party infrastructure you control. Short-lived caches only.</div>
            </Section>

            <Section title="Quick Start">
              <div>
                Click <strong>Get Started</strong> to open the uploader. Choose "File" or "Message", enter a 10-character alphanumeric code, then share the ID and code with your recipient. Auto-deletes after expiry (24 hours) or download.
              </div>
            </Section>
          </div>

          <div style={{flex:"0 1 320px"}}>
            <Section title="About Ads and Revenue">
              <div>Ads are the only revenue source; we do not monetise user data. Ads are served via third-party networks and do not change how files are processed or stored.</div>
            </Section>

            <Section title="Save to your home screen">
              <div>
                <strong>iOS</strong> — Tap the share icon, select "Add to Homescreen"<br/>
                <strong>Android</strong> — Tap the three dot menu, select "Add to homescreen"
              </div>
            </Section>

            <Section title="Security Notes">
              <div>All encryption is performed client-side before upload. Keep your 10-character code safe; BurnZip cannot recover it for you.</div>
            </Section>
          </div>
        </div>

        <hr style={{margin:"26px 0"}}/>

        <Section title="Privacy Policy">
          <ol style={{color:"#333"}}>
            <li><strong>No Accounts, No Tracking</strong> — BurnZip does not require user accounts, logins, or personal identifiers. We do not track, profile, or store user behavior.</li>
            <li><strong>Client-Side Encryption</strong> — All files are encrypted locally before transfer. BurnZip servers never see or store plaintext content.</li>
            <li><strong>Temporary Metadata</strong> — We may temporarily process non-identifiable metadata (e.g., file size, transfer timestamp) to facilitate delivery. This data is deleted automatically.</li>
            <li><strong>No Cookies or Analytics</strong> — BurnZip does not use cookies, trackers, or third-party analytics tools.</li>
            <li><strong>Third-Party Services</strong> — If you integrate external services, their policies apply.</li>
            <li><strong>Security Practices</strong> — Industry-standard encryption, rate limiting, tamper detection. No system is 100% secure.</li>
          </ol>
        </Section>

        <Section title="Terms of Use">
          <ol style={{color:"#333"}}>
            <li><strong>Acceptance</strong> — By using BurnZip, you agree to these Terms.</li>
            <li><strong>Use Restrictions</strong> — You may not use BurnZip to share illegal, harmful, or infringing content.</li>
            <li><strong>No Warranty</strong> — BurnZip is provided “as is.”</li>
            <li><strong>Limitation of Liability</strong> — BurnZip is not liable for damages arising from use.</li>
            <li><strong>Intellectual Property</strong> — BurnZip branding and code are privately owned.</li>
            <li><strong>Modifications</strong> — Terms may be updated at any time.</li>
          </ol>
        </Section>

        <Section title="Contact">
          <div>Email: <a href="mailto:burnzip33@gmail.com">burnzip33@gmail.com</a></div>
        </Section>
      </main>

      <footer style={{marginTop:28, color:"#666", fontSize:13}}>
        © {new Date().getFullYear()} BurnZip
      </footer>

      {uploaderOpen && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999
        }}>
          <div style={{background:"#fff", padding:18, borderRadius:10, width:520, maxWidth:"94%", boxShadow:"0 8px 30px rgba(0,0,0,0.25)"}}>
            <h3 style={{margin:"0 0 8px 0"}}>Prepare upload</h3>

            <div style={{display:"flex", gap:12, marginBottom:8}}>
              <button onClick={()=>setMode("file")} style={{flex:1, padding:8, background: mode==="file" ? "#0b63d8": "#f2f4f7", color: mode==="file"?"#fff":"#111", border:"none", borderRadius:6}}>File</button>
              <button onClick={()=>setMode("message")} style={{flex:1, padding:8, background: mode==="message" ? "#0b63d8": "#f2f4f7", color: mode==="message"?"#fff":"#111", border:"none", borderRadius:6}}>Message</button>
            </div>

            {mode === "file" ? (
              <>
                <input ref={fileInputRef} type="file" style={{display:"block", marginBottom:10}} />
              </>
            ) : (
              <>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Type a short message" rows={4} style={{width:"100%", marginBottom:10}} />
              </>
            )}

            <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12}}>
              <label style={{fontSize:13, color:"#333"}}>10-character code</label>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={10} style={{flex:1, padding:8, borderRadius:6, border:"1px solid #ddd"}} />
              <button onClick={()=>setCode(randomExampleCode())} style={{padding:"8px 10px", borderRadius:6}}>New</button>
            </div>

            <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:6}}>
              <button onClick={()=>setUploaderOpen(false)} style={{background:"#fff", border:"1px solid #ddd", padding:"8px 12px", borderRadius:8}}>Close</button>
              <button onClick={handlePrepare} style={{background:"#0b63d8", color:"#fff", border:"none", padding:"8px 12px", borderRadius:8}}>Prepare</button>
            </div>

            {preview && <div style={{marginTop:12, color:"#333"}}><strong>Preview:</strong> {preview}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
