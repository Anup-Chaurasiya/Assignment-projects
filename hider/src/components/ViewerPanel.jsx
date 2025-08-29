export default function ViewerPanel({ item, data, onClear }) {
const download = () => {
const blob = new Blob([data], { type: item.mime || "application/octet-stream" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = item.name || "hidden.bin";
a.click();
URL.revokeObjectURL(url);
};


return (
<div className="card">
<h2>Unlocked Content</h2>
{item.type === "text" ? (
<p className="text-view">{data}</p>
) : (
<>
<p><strong>File:</strong> {item.name}</p>
<button onClick={download}>Download file</button>
</>
)}
<button className="ghost" onClick={onClear}>Clear & start over</button>
</div>
);
}