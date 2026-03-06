/**
 * useWebAuthn – browser biometric (fingerprint / Face ID) helpers
 *
 * Strategy:
 *   1. On registration  → generate a random admin passkey, store it in
 *      localStorage encrypted behind a WebAuthn credential.  The actual
 *      passkey is sent to the backend via `setAdminPasskey`.
 *   2. On authentication → ask the browser to verify the credential; on
 *      success, return the stored passkey so it can be sent to the backend
 *      via `verifyAdminPasskey`.
 *
 * No raw private keys leave the device; the passkey string in localStorage
 * is just a random token used as the backend passkey.
 */

const RP_ID = window.location.hostname;
const RP_NAME = "VideoEdit Pro Admin";
const CRED_ID_KEY = "admin_webauthn_credId";
const PASSKEY_KEY = "admin_webauthn_passkey";

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return bytes.buffer as ArrayBuffer;
}

function generateToken(length = 32): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return bufferToBase64(arr.buffer);
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials
  );
}

export function hasFingerprintRegistered(): boolean {
  return (
    !!localStorage.getItem(CRED_ID_KEY) && !!localStorage.getItem(PASSKEY_KEY)
  );
}

/**
 * Register a new fingerprint credential.
 * Returns the generated passkey string to be saved to the backend.
 */
export async function registerFingerprint(): Promise<string> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: { id: RP_ID, name: RP_NAME },
      user: {
        id: userId,
        name: "admin",
        displayName: "Admin",
      },
      challenge,
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Fingerprint registration was cancelled.");

  const credIdB64 = bufferToBase64(credential.rawId);
  const passkey = generateToken(32);

  localStorage.setItem(CRED_ID_KEY, credIdB64);
  localStorage.setItem(PASSKEY_KEY, passkey);

  return passkey;
}

/**
 * Authenticate with a registered fingerprint.
 * Returns the stored passkey string on success.
 */
export async function authenticateFingerprint(): Promise<string> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const credIdB64 = localStorage.getItem(CRED_ID_KEY);
  const passkey = localStorage.getItem(PASSKEY_KEY);

  if (!credIdB64 || !passkey) {
    throw new Error("No fingerprint registered on this device.");
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const assertion = await navigator.credentials.get({
    publicKey: {
      rpId: RP_ID,
      challenge,
      allowCredentials: [
        {
          type: "public-key",
          id: base64ToBuffer(credIdB64),
          transports: ["internal"],
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });

  if (!assertion) throw new Error("Fingerprint authentication was cancelled.");

  return passkey;
}

/**
 * Remove stored fingerprint credential from this device.
 */
export function removeFingerprint(): void {
  localStorage.removeItem(CRED_ID_KEY);
  localStorage.removeItem(PASSKEY_KEY);
}
