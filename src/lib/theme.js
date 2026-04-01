// Brand theme system
export const DARK = {
  pri:"#3bbffa", priBr:"#69f6b8", sec:"#8b9cc7", acc:"#ff716a", gold:"#fbbf24",
  bg:"#060e20", surface:"#091328", surfaceHi:"#141f38",
  border:"#1a2a4a", borderHi:"#243558",
  bvL:"#1e3060", bvD:"#040a18",
  text:"#dee5ff", textMid:"#7b8bb5", textDim:"#4a5a80",
  inset:"#050c1c", headerGrad:"#0a1530",
  font:"'JetBrains Mono','Consolas',monospace",
  display:"'Space Grotesk',sans-serif",
  sans:"'Inter','Segoe UI',-apple-system,sans-serif",
};

export const LIGHT = {
  pri:"#1a8fd4", priBr:"#2da87a", sec:"#4a5568", acc:"#e05550", gold:"#d97706",
  bg:"#f0f3f8", surface:"#ffffff", surfaceHi:"#edf1f8",
  border:"#c8d0e0", borderHi:"#a0aec0",
  bvL:"#ffffff", bvD:"#b8c4d8",
  text:"#0f172a", textMid:"#475569", textDim:"#64748b",
  inset:"#e4e8f0", headerGrad:"#dce2ee",
  font:"'JetBrains Mono','Consolas',monospace",
  display:"'Space Grotesk',sans-serif",
  sans:"'Inter','Segoe UI',-apple-system,sans-serif",
};

export function getThemePref() {
  try { return localStorage.getItem("bckgeo-theme") || "dark"; } catch { return "dark"; }
}

export function setThemePref(t) {
  try { localStorage.setItem("bckgeo-theme", t); } catch {}
}
