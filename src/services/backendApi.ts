import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL as string;

/**
 * fetch() gegen die SerienApi-Backend-Domain. Haengt automatisch das
 * Firebase-ID-Token als `Authorization: Bearer <token>` an (Soft-Auth —
 * das Backend nutzt es als vertrauenswuerdige Identitaet, faellt aber noch
 * auf die im Body gesendete uid/uuid zurueck). `path` beginnt mit '/'.
 */
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const token = await firebase.auth().currentUser?.getIdToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch {
    // ignore — ohne Token faellt das Backend auf die Body-uid zurueck
  }
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}
