import { useState } from "react";
import { encryptString, encryptBytes } from "../crypto";
import { saveItem, clearItem } from "../storage";

export default function HidePanel({ onDone }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

 const [quote, setQuote] = useState(""); // ✅ State for quote

const fetchQuote = async () => {
  try {
    const response = await fetch(
      "https://api.allorigins.win/get?url=" + encodeURIComponent("https://zenquotes.io/api/random")
    );
    const data = await response.json();
    const parsed = JSON.parse(data.contents);

    setText(parsed[0].q + " — " + parsed[0].a); // ✅ directly set textarea value
    console.log("Quote fetched:", parsed[0].q);
  } catch (error) {
    console.error("Failed to fetch quote", error);
  }
};




  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!password) return setError("Please set a password.");

    try {
      setBusy(true);
      if (mode === "text") {
        if (!text.trim()) return setError("Enter some text to hide.");
        const enc = await encryptString(text, password);
        saveItem({ type: "text", enc });
      } else {
        if (!file) return setError("Choose a file first.");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const enc = await encryptBytes(bytes, password);
        saveItem({ type: "file", name: file.name, mime: file.type || "application/octet-stream", enc });
      }
      onDone();
    } catch (e) {
      setError("Encryption failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    clearItem();
    setText("");
    setFile(null);
    setPassword("");
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Hide something</h2>

      <div className="row">
        <label>
          <input type="radio" name="mode" value="text" checked={mode === "text"} onChange={() => setMode("text")} />
          Text
        </label>
        <label>
          <input type="radio" name="mode" value="file" checked={mode === "file"} onChange={() => setMode("file")} />
          File
        </label>
      </div>

      {mode === "text" ? (
        <>
          <textarea
            placeholder="Enter text to hide"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="button" onClick={fetchQuote} disabled={busy} className="secondary">
            {busy ? "Fetching…" : "Fetch random quote"}
          </button>
        </>
      ) : (
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      )}

      <input
        type="password"
        placeholder="Set password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <div className="row">
        <button type="submit" disabled={busy}>{busy ? "Encrypting…" : "Hide"}</button>
        <button type="button" className="ghost" onClick={handleClear}>Reset</button>
      </div>
    </form>
  );
}

