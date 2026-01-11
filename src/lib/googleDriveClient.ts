// Simple Google Drive client loader used across the app
// Ensures the gapi script and Drive v3 client load only once.

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
let driveClientPromise: Promise<typeof window.gapi.client> | null = null;

const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';

/**
 * Load and initialize the Google Drive API client once (singleton).
 */
export async function loadDriveClient(): Promise<typeof window.gapi.client> {
  if (!API_KEY) {
    throw new Error('Google API key missing. Set VITE_GOOGLE_API_KEY.');
  }

  // If already loading/loaded, reuse the same promise
  if (driveClientPromise) return driveClientPromise;

  driveClientPromise = new Promise((resolve, reject) => {
    const onReady = async () => {
      try {
        if (!window.gapi?.client) {
          return reject(new Error('gapi client unavailable after script load'));
        }

        // If Drive is already loaded, resolve immediately
        if (window.gapi.client.drive?.files) {
          return resolve(window.gapi.client);
        }

        await window.gapi.client.init({ apiKey: API_KEY });
        await window.gapi.client.load('drive', 'v3');

        if (!window.gapi.client.drive?.files) {
          return reject(new Error('Google Drive API failed to initialize'));
        }

        resolve(window.gapi.client);
      } catch (err) {
        driveClientPromise = null; // Allow retry on next call
        reject(err);
      }
    };

    // If script already on page, hook its load
    const existingScript = document.querySelector(`script[src="${GAPI_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        onReady();
      } else {
        existingScript.addEventListener('load', () => {
          existingScript.dataset.loaded = 'true';
          onReady();
        });
        existingScript.addEventListener('error', () => {
          driveClientPromise = null;
          reject(new Error('Failed to load Google API script'));
        });
      }
      return;
    }

    // Inject script once
    const script = document.createElement('script');
    script.src = GAPI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.loaded = 'false';
    script.onload = () => {
      script.dataset.loaded = 'true';
      onReady();
    };
    script.onerror = () => {
      driveClientPromise = null;
      reject(new Error('Failed to load Google API script'));
    };
    document.body.appendChild(script);
  });

  return driveClientPromise;
}
