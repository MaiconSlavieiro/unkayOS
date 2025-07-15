// Utilitários PKCE para AuthSystem

export function dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
}

export function generateCodeVerifier() {
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join('');
}

export function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

export function base64urlencode(a) {
    let str = "";
    const bytes = new Uint8Array(a);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export async function generateCodeChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64urlencode(hashed);
} 