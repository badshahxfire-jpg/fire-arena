import { auth } from "../firebase";

export const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://fire-baadshah-arena-backend.onrender.com";

/**
 * Fetch helper to call backend secure API with Auth token
 */
export async function secureFetch(endpoint, data = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not logged in");
  }

  // Get the Firebase ID Token
  const token = await currentUser.getIdToken(true);

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || "Request failed");
  }

  return resData;
}
