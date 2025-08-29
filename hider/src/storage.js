const KEY = "hider:v1";


export function saveItem(item) {
localStorage.setItem(KEY, JSON.stringify(item));
}


export function loadItem() {
const raw = localStorage.getItem(KEY);
if (!raw) return null;
try {
return JSON.parse(raw);
} catch (_) {
return null;
}
}


export function clearItem() {
localStorage.removeItem(KEY);
}
