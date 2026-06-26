import { useState, useCallback, useEffect } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPE = 'https://www.googleapis.com/auth/drive openid profile email';
const CALLBACK_PATH = '/oauth-callback.html';

export interface DriveUserProfile {
  email: string;
  name: string | null;
  picture: string | null;
}

// Module-level cache survives re-renders
let _cached: { token: string; expiresAt: number } | null = null;
let _profile: DriveUserProfile | null = null;

async function fetchProfile(accessToken: string): Promise<DriveUserProfile | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const d = await res.json();
    return { email: d.email ?? '', name: d.name ?? null, picture: d.picture ?? null };
  } catch {
    return null;
  }
}

function openAuthPopup(): Promise<string> {
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPE,
    prompt: 'select_account',
    state,
  });

  const w = 520, h = 620;
  const left = Math.round(window.screenLeft + (window.outerWidth - w) / 2);
  const top = Math.round(window.screenTop + (window.outerHeight - h) / 2);
  const popup = window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'gdrive_oauth',
    `width=${w},height=${h},left=${left},top=${top},popup=1`,
  );

  return new Promise((resolve, reject) => {
    if (!popup) {
      reject(new Error('Popup was blocked — please allow popups for this site and try again.'));
      return;
    }

    let settled = false;

    function cleanup() {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutId);
      // Never call popup.closed or popup.close() from the parent —
      // Google's COOP header permanently blocks those calls and logs
      // console errors that can't be suppressed. The popup closes itself.
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GDRIVE_OAUTH_SUCCESS') {
        if (event.data.state && event.data.state !== state) {
          settled = true; cleanup(); reject(new Error('State mismatch')); return;
        }
        settled = true; cleanup(); resolve(event.data.token as string);
      } else if (event.data?.type === 'GDRIVE_OAUTH_ERROR') {
        settled = true; cleanup(); reject(new Error(event.data.error ?? 'OAuth failed'));
      }
    }

    window.addEventListener('message', onMessage);

    // Fallback: if the user closes the popup without completing sign-in,
    // no postMessage ever arrives — reject after 5 minutes.
    const timeoutId = setTimeout(() => {
      if (!settled) { settled = true; cleanup(); reject(new Error('Sign-in cancelled or timed out')); }
    }, 300_000);
  });
}

export function useGoogleDriveAuth() {
  const [token, setToken] = useState<string | null>(
    _cached && Date.now() < _cached.expiresAt ? _cached.token : null,
  );
  const [profile, setProfile] = useState<DriveUserProfile | null>(_profile);
  const [loading, setLoading] = useState(false);

  // Auto-fetch profile when token is available but profile is missing
  // (e.g. after a page reload where _profile module-level cache is cleared)
  useEffect(() => {
    if (!token) return;
    if (_profile) { setProfile(_profile); return; }
    fetchProfile(token).then(p => {
      if (p) { _profile = p; setProfile(p); }
    }).catch(() => {});
  }, [token]);

  const getToken = useCallback((): Promise<string> => {
    if (_cached && Date.now() < _cached.expiresAt) {
      setToken(_cached.token);
      setProfile(_profile);
      return Promise.resolve(_cached.token);
    }

    setLoading(true);
    return openAuthPopup()
      .then(t => {
        _cached = { token: t, expiresAt: Date.now() + 55 * 60 * 1000 };
        setToken(t);
        setLoading(false);
        fetchProfile(t).then(p => { _profile = p; setProfile(p); }).catch(() => {});
        return t;
      })
      .catch(e => {
        setLoading(false);
        throw e;
      });
  }, []);

  const signOut = useCallback(() => {
    _cached = null;
    _profile = null;
    setToken(null);
    setProfile(null);
  }, []);

  return { token, profile, loading, getToken, signOut };
}
