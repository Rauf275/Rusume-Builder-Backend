// Talks to the backend in server/. The URL is injected at build time via
// Vite's env handling (see .env.example) so the same code works against a
// local server in dev and the deployed one in production, without editing
// source. Falls back to localhost:3001 so `npm run dev` works out of the
// box against a locally-running server.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Creates a brand-new resume record, returns its id.
export async function createResumeInCloud({ resume, sectionOrder, hiddenSections }) {
  const res = await fetch(`${API_URL}/api/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, sectionOrder, hiddenSections }),
  });
  return handleResponse(res);
}

// Overwrites an existing record by id.
export async function updateResumeInCloud(id, { resume, sectionOrder, hiddenSections }) {
  const res = await fetch(`${API_URL}/api/resumes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, sectionOrder, hiddenSections }),
  });
  return handleResponse(res);
}

// Fetches a resume by id. Returns null (rather than throwing) on a 404 so
// callers loading an id from the URL can treat "not found" as "start
// fresh" instead of having to special-case an error.
export async function fetchResumeFromCloud(id) {
  const res = await fetch(`${API_URL}/api/resumes/${id}`);
  if (res.status === 404) return null;
  return handleResponse(res);
}
