import { useState } from "react";


export default function UnlockPanel({ onUnlock }) {
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [busy, setBusy] = useState(false);


const handle = async (e) => {
e.preventDefault();
setError("");
if (!password) return setError("Enter your password.");
setBusy(true);
try {
await onUnlock(password);
} catch (e) {
setError("Wrong password or corrupted data.");
} finally {
setBusy(false);
}
};


return (
<form onSubmit={handle} className="card">
<h2>Unlock</h2>
<input
type="password"
placeholder="Enter password"
value={password}
onChange={(e) => setPassword(e.target.value)}
/>
{error && <p className="error">{error}</p>}
<button disabled={busy}>{busy ? "Decrypting…" : "Unhide"}</button>
</form>
);
}