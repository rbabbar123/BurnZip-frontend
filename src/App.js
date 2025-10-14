import React, { useState, useRef, useEffect } from "react";

/**
 * BurnZip updated App.js
 * - Improved copy UX for generated share link
 * - Minimal recipient landing view when URL contains #share:<base64>
 *
 * Keep server-side upload / short-ID approach for large payloads in future.
 */

const MAX_EMBED_BYTES = 96 * 1024; // safe embed threshold ~96KB

const Section = ({ title, children }) => (
  <section style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 20, margin: "6px 0" }}>{title}</h2>
    <div style={{ color: "#333", lineHeight: 1.5 }}>{children}</div>
  </section>
);

// ---- Crypto helpers ----
async function deriveKeyFromCode(code, salt) {
  const enc = new TextEncoder();
  const passKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(code),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 200000,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptArrayBuffer(key, plaintextBuffer) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cipher = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBuffer
  );
  const ivBuf = new Uint8Array(iv.buffer);
  const cipherBuf = new Uint8Array(cipher);
  const out = new Uint8Array(ivBuf.length + cipherBuf.length);
  out.set(ivBuf, 0);
  out.set(cipherBuf, ivBuf.length);
  return out;
}

async function decryptArrayBuffer(key, combinedCipher) {
  const iv = combinedCipher.slice(0, 12);
  const cipher = combinedCipher.slice(12);
  const plain = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    cipher
  );
  return new Uint8Array(plain);
}

function u8ToBase64(u8) {
  let CHUNK_SIZE = 0x8000;
  let index = 0;
  let length = u8.length;
  let result = "";
  while (index < length) {
    result += String.fromCharCode.apply(null, u8.subarray(index, Math.min(index + CHUNK_SIZE, length)));
    index += CHUNK_SIZE;
  }
  return btoa(result);
}

function base64ToU8(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

// packaging: [salt(16) | filenameLen(1) | filename(bytes) | encrypted(iv+cipher)]
function packageEncrypted(salt, filename, encryptedU8) {
  const filenameBytes = new TextEncoder().encode(filename);
  const headerLen = 16 + 1 + filenameBytes.length;
  const out = new Uint8Array(headerLen + encryptedU8.length);
  out.set(salt, 0);
  out[16] = filenameBytes.length & 0xff;
  out.set(filenameBytes, 17);
  out.set(encryptedU8, headerLen);
  return out;
}

function unpackageEncrypted(u8) {
  const salt = u8.slice(0, 16);
  const filenameLen = u8[16];
  const filenameBytes = u8.slice(17, 17 + filenameLen);
  const filename = new TextDecoder().decode(filenameBytes);
  const encrypted = u8.slice(17 + filenameLen);
  return { salt, filename, encrypted };
}

// ---- App ----
export default function App() {
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [mode, setMode] = useState("file");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(null);
  const copyInputRef = useRef(null);
  const [copyToast, setCopyToast] = useState("");

  // recipient flow state
  const [incomingShare, setIncomingShare] = useState(null);
  const [incomingCode, setIncomingCode] = useState("");
  const [decryptedPreview, setDecryptedPreview] = useState(null);
  const [downloadReady, setDownloadReady] = useState(null);

  useEffect(() => {
    // detect share fragment of form #share:<base64>
    const frag = window.location.hash || "";
    if (frag.startsWith("#share:")) {
      const payloadB64 = frag.slice(7);
      if (payloadB64 && payloadB64.length > 0) {
        try {
          const u8 = base64ToU8(payloadB64);
          setIncomingShare(u8);
          // remove fragment from visible address bar while keeping payload in memory
          // history.replaceState requires window.history explicitly
          window.history.replaceState(null, "", window.location.pathname);
        } catch (e) {
          setPasteWarning("Malformed share link");
        }
      }
    }
  }, []);

  function randomExampleCode() {
    return Math.random().toString(36).slice(2, 12).toUpperCase();
  }

  function openUploader() {
    setCode(randomExampleCode());
    setMessage("");
    setPreview(null);
    setShareUrl(null);
    setUploaderOpen(true);
    setPasteWarning(null);
  }

  async function handlePrepareAndGenerateLink() {
    if (!code || code.length !== 10) {
      alert("Enter a 10-character code");
      return;
    }
    setBusy(true);
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKeyFromCode(code, salt);
      let plaintextU8;
      let filename = "message.txt";

      if (mode === "file") {
        const f = fileInputRef.current && fileInputRef.current.files[0];
        if (!f) {
          alert("Select a file first");
          setBusy(false);
          return;
        }
        filename = f.name;
        plaintextU8 = new Uint8Array(await f.arrayBuffer());
      } else {
        if (!message || !message.trim()) {
          alert("Enter a message first");
          setBusy(false);
          return;
        }
        plaintextU8 = new TextEncoder().encode(message);
      }

      const encryptedU8 = await encryptArrayBuffer(key, plaintextU8);
      const packaged = packageEncrypted(salt, filename, encryptedU8);
      setPreview(`${filename} → encrypted (${Math.round(packaged.length / 1024)} KB)`);

      if (packaged.length > MAX_EMBED_BYTES) {
        setPasteWarning("Payload exceeds safe embed size. Upload the encrypted blob to your server and share a short ID instead.");
        setShareUrl(null);
        setBusy(false);
        return;
      }

      const b64 = u8ToBase64(packaged);
      const url = `${window.location.origin}${window.location.pathname}#share:${b64}`;
      setShareUrl({ url, code, size: packaged.length, filename });

      // copy to clipboard and show toast
      try {
        await navigator.clipboard.writeText(url);
        setCopyToast("Link copied to clipboard");
        setTimeout(() => setCopyToast(""), 2200);
      } catch (e) {
        // ignore copy failure; UI still shows input for manual copy
      }
    } catch (e) {
      console.error("Encrypt/pack failed", e);
      alert("Encryption failed; check console for details");
    } finally {
      setBusy(false);
    }
  }

  // minimal recipient view: decrypt and produce download
  async function handleDownloadFromShare(u8Payload) {
    try {
      setBusy(true);
      const { salt, filename, encrypted } = unpackageEncrypted(u8Payload);
      if (!incomingCode || incomingCode.length !== 10) {
        alert("Enter the 10-character code to decrypt");
        setBusy(false);
        return;
      }
      const key = await deriveKeyFromCode(incomingCode, salt);
      const decrypted = await decryptArrayBuffer(key, encrypted);

      // detect ASCII text to show preview
      let isText = false;
      try {
        const txt = new TextDecoder().decode(decrypted);
        isText = /^[\x09\x0a\x0d\x20-\x7e]*$/.test(txt.slice(0, 500));
        if (isText) setDecryptedPreview(txt.slice(0, 10000));
      } catch (e) {
        isText = false;
      }

      const blob = new Blob([decrypted], { type: "application/octet-stream" });
      const objectUrl = URL.createObjectURL(blob);
      setDownloadReady({ url: objectUrl, filename, size: blob.size });
    } catch (e) {
      console.error("Decrypt failed", e);
      alert("Decryption failed. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleClearIncoming() {
    setIncomingShare(null);
    setIncomingCode("");
    setDecryptedPreview(null);
    setDownloadReady(null);
    setPasteWarning(null);
    // keep user on same page without fragment
    window.history.replaceState(null, "", window.location.pathname);
  }

  // small helper for copy input select + copy
  async function copyShareInput() {
    if (!copyInputRef.current) return;
    copyInputRef.current.select();
    try {
      await navigator.clipboard.writeText(copyInputRef.current.value);
      setCopyToast("Link copied to clipboard");
      setTimeout(() => setCopyToast(""), 2200);
    } catch (e) {
      setCopyToast("Copy failed");
      setTimeout(() => setCopyToast(""), 2200);
    }
  }

  // If an incoming share exists, render only the minimal recipient UI
  if (incomingShare) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial", padding: 24, maxWidth: 720, margin: "24px auto" }}>
        <h1 style={{ marginTop: 0 }}>BurnZip — Encrypted payload</h1>
        <p>Enter the 10-character code you received to decrypt and download the file or message.</p>

        {pasteWarning && <div style={{ color: "crimson", marginBottom: 12 }}>{pasteWarning}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={incomingCode} onChange={(e) => setIncomingCode(e.target.value.toUpperCase())} maxLength={10} placeholder="Enter 10-character code" style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
          <button onClick={() => handleDownloadFromShare(incomingShare)} disabled={busy} style={{ padding: "10px 14px", borderRadius: 6, background: "#0b63d8", color: "#fff", border: "none" }}>{busy ? "Working…" : "Decrypt & Download"}</button>
        </div>

        {decryptedPreview && <div style={{ background: "#f8f8f8", padding: 10, borderRadius: 6, whiteSpace: "pre-wrap", marginBottom: 8, maxHeight: 260, overflow: "auto" }}>{decryptedPreview}</div>}

        {downloadReady && (
          <div style={{ marginTop: 8 }}>
            <div><strong>Ready:</strong> {downloadReady.filename} ({Math.round(downloadReady.size / 1024)} KB)</div>
            <div style={{ marginTop: 8 }}>
              <a href={downloadReady.url} download={downloadReady.filename} style={{ padding: "8px 12px", background: "#0b63d8", color: "#fff", borderRadius: 6, textDecoration: "none" }}>Download decrypted file</a>
            </div>
            <div style={{ marginTop: 10 }}>
              <button onClick={handleClearIncoming} style={{ background: "#fff", border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6 }}>Close</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
          Tip: This page only asks for the code. The encrypted payload is included in the link you were sent; the server does not see your code.
        </div>
      </div>
    );
  }

  // Otherwise render full landing + uploader
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial", color: "#111", padding: 20, maxWidth: 980, margin: "18px auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>🔐</span><span>Welcome to BurnZip</span></h1>
          <p style={{ margin: "6px 0 0 0", color: "#444", maxWidth: 720 }}>No login. No tracking metadata. No logs. No storage. No footprint. Just trust.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <button onClick={openUploader} style={{ backgroundColor: "#0b63d8", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Get Started</button>
        </div>
      </header>

      <main style={{ marginTop: 18 }}>
        <p style={{ fontSize: 16, color: "#222" }}>A privacy-first, SaaS framework that leverages modular AI to facilitate encrypted file sharing — without compromising user autonomy.</p>

        <div style={{ border: "1px solid #e6e6e6", padding: 16, borderRadius: 10, marginTop: 14, background: "#fafafa" }}>
          <strong>We only generate $ through advertisements, not your data.</strong>
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <Section title="✅ What’s Stored">
              <div><strong>Encrypted file blobs, never raw data.</strong> Stored short-lived cache. Auto-deletes after expiry 24 hours or download.</div>
            </Section>
            <Section title="🧠 Where It’s Stored">
              <div>No persistent disk storage. No database footprint. On third-party infrastructure you control. Short-lived caches only.</div>
            </Section>
            <Section title="Quick Start">
              <div>Click <strong>Get Started</strong> to open the uploader. Choose "File" or "Message", enter a 10-character alphanumeric code, then click Prepare. Share the generated link and code. Auto-deletes after expiry 24 hours or download.</div>
            </Section>
          </div>

          <div style={{ flex: "0 1 320px" }}>
            <Section title="About Ads and Revenue"><div>Ads are the only revenue source; we do not monetise user data. Ads are served via third-party networks and do not change how files are processed or stored.</div></Section>
            <Section title="Save to your home screen"><div><strong>iOS</strong> — Tap the share icon, select "Add to Homescreen"<br/><strong>Android</strong> — Tap the three dot menu, select "Add to homescreen"</div></Section>
            <Section title="Security Notes"><div>All encryption is performed client-side before upload. Keep your 10-character code safe; BurnZip cannot recover it for you.</div></Section>
          </div>
        </div>

        <hr style={{ margin: "26px 0" }} />

        <Section title="Privacy Policy">
          <ol style={{ color: "#333" }}>
            <li><strong>No Accounts, No Tracking</strong> — BurnZip does not require user accounts, logins, or personal identifiers.</li>
            <li><strong>Client-Side Encryption</strong> — Files are encrypted locally before transfer. BurnZip servers never see plaintext content.</li>
            <li><strong>Temporary Metadata</strong> — Non-identifiable metadata may be used to facilitate delivery and deleted automatically.</li>
            <li><strong>No Cookies or Analytics</strong> — BurnZip does not use cookies or trackers.</li>
          </ol>
        </Section>

        <Section title="Contact"><div>Email: <a href="mailto:burnzip33@gmail.com">burnzip33@gmail.com</a></div></Section>
      </main>

      <footer style={{ marginTop: 28, color: "#666", fontSize: 13 }}>© {new Date().getFullYear()} BurnZip</footer>

      {uploaderOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", padding: 18, borderRadius: 10, width: 560, maxWidth: "94%", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Prepare upload</h3>

            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <button onClick={() => setMode("file")} style={{ flex: 1, padding: 8, background: mode === "file" ? "#0b63d8" : "#f2f4f7", color: mode === "file" ? "#fff" : "#111", border: "none", borderRadius: 6 }}>File</button>
              <button onClick={() => setMode("message")} style={{ flex: 1, padding: 8, background: mode === "message" ? "#0b63d8" : "#f2f4f7", color: mode === "message" ? "#fff" : "#111", border: "none", borderRadius: 6 }}>Message</button>
            </div>

            {mode === "file" ? (
              <input ref={fileInputRef} type="file" style={{ display: "block", marginBottom: 10 }} />
            ) : (
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a short message" rows={4} style={{ width: "100%", marginBottom: 10 }} />
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#333" }}>10-character code</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
              <button onClick={() => setCode(randomExampleCode())} style={{ padding: "8px 10px", borderRadius: 6 }}>New</button>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button onClick={() => { setUploaderOpen(false); setPreview(null); setShareUrl(null); }} style={{ background: "#fff", border: "1px solid #ddd", padding: "8px 12px", borderRadius: 8 }}>Close</button>
              <button onClick={handlePrepareAndGenerateLink} disabled={busy} style={{ background: "#0b63d8", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8 }}>{busy ? "Preparing…" : "Prepare"}</button>
            </div>

            {preview && <div style={{ marginTop: 12, color: "#333" }}><strong>Preview:</strong> {preview}</div>}
            {pasteWarning && <div style={{ marginTop: 10, color: "crimson" }}>{pasteWarning}</div>}

            {shareUrl && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><strong>Share link generated</strong></div>
                  <div style={{ color: "#666", fontSize: 13 }}>{Math.round(shareUrl.size / 1024)} KB</div>
                </div>

                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <input ref={copyInputRef} value={shareUrl.url} readOnly style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ddd", wordBreak: "break-all" }} onFocus={(e) => e.target.select()} />
                  <button onClick={copyShareInput} style={{ padding: "8px 12px", borderRadius: 6, background: "#0b63d8", color: "#fff", border: "none" }}>Copy</button>
                </div>

                {copyToast && <div style={{ marginTop: 8, color: "#0b63d8" }}>{copyToast}</div>}

                <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>Share this link and the 10-character code with the recipient. The recipient only needs the code to decrypt.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
