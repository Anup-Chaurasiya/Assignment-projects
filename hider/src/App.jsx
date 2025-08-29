import { useMemo, useState } from "react";
import HidePanel from "./components/HidePanel";
import UnlockPanel from "./components/UnlockPanel";
import ViewerPanel from "./components/ViewerPanel";
import { loadItem, clearItem } from "./storage";
import { decryptString, decryptBytes } from "./crypto";



export default function App() {
const [stage, setStage] = useState("initial"); // initial | locked | open
const [item, setItem] = useState(() => loadItem());
const [data, setData] = useState(null);


useMemo(() => {
if (!item) setStage("initial");
else setStage("locked");
}, [item]);


const onDone = () => {
setItem(loadItem());
};


const onUnlock = async (password) => {
if (!item) throw new Error("no item");
if (item.type === "text") {
const plain = await decryptString(item.enc, password);
setData(plain);
} else {
const bytes = await decryptBytes(item.enc, password);
setData(bytes);
}
setStage("open");
};


const onClear = () => {
clearItem();
setItem(null);
setData(null);
setStage("initial");
};


return (
<div className="page">
<header>
<h1>🔒 Hider</h1>
<p className="muted">Password‑protected hide/unhide • LocalStorage • AES‑GCM</p>
</header>


{stage === "initial" && <HidePanel onDone={onDone} />}
{stage === "locked" && <UnlockPanel onUnlock={onUnlock} />}
{stage === "open" && item && data !== null && (
<ViewerPanel item={item} data={data} onClear={onClear} />
)}


<footer>
<p>
Built with React, Web Crypto, LocalStorage. Quotes by
{" "}
<a href="https://api.quotable.io/" target="_blank" rel="noreferrer">Quotable</a>.
</p>
</footer>
</div>
);
}

