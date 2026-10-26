const key='padam.preferred-play-mode'
const modes=['solo','host','buzzer']

export function savedPlayMode() {
 try { const mode=localStorage.getItem(key);return modes.includes(mode)?mode:null } catch { return null }
}
export function rememberPlayMode(mode,remember) {
 try { if(remember&&modes.includes(mode))localStorage.setItem(key,mode);else localStorage.removeItem(key) } catch { /* Play remains available if storage is blocked. */ }
}
export function playModeHref(game,soloRoute,mode) {
 return mode==='solo'?`#${soloRoute}?mode=solo`:`#${mode}-game?game=${game}`
}
