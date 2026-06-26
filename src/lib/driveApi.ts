const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;

export const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

export async function listDriveFolder(folderId: string): Promise<DriveItem[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    key: API_KEY,
    fields: 'files(id,name,mimeType,webViewLink,webContentLink,size,createdTime,modifiedTime)',
    orderBy: 'folder,name',
    pageSize: '200',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `Drive API error ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  return (data.files ?? []) as DriveItem[];
}

export function isFolder(item: DriveItem): boolean {
  return item.mimeType === FOLDER_MIME;
}

export function driveFileIcon(mimeType: string): string {
  if (mimeType === FOLDER_MIME) return '📁';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📗';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  return '📄';
}

export function driveFormatSize(bytes?: string): string {
  if (!bytes) return '';
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function drivePreviewUrl(item: DriveItem): string {
  if (item.mimeType.includes('pdf') && item.webContentLink) {
    return item.webContentLink.replace('&export=download', '');
  }
  return item.webViewLink ?? `https://drive.google.com/file/d/${item.id}/view`;
}

// ── Write operations (require OAuth access token) ─────────────────────

export async function uploadFileToDrive(
  folderId: string,
  file: File,
  accessToken: string,
): Promise<DriveItem> {
  const metadata = { name: file.name, parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,webViewLink,webContentLink,size,modifiedTime',
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Upload failed ${res.status}`);
  }
  return res.json() as Promise<DriveItem>;
}

export async function deleteFromDrive(fileId: string, accessToken: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Delete failed ${res.status}`);
  }
}

export async function createDriveFolder(
  parentId: string,
  name: string,
  accessToken: string,
): Promise<DriveItem> {
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,mimeType',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Create folder failed ${res.status}`);
  }
  return res.json() as Promise<DriveItem>;
}
