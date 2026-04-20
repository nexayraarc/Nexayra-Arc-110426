import { auth } from "./firebase";

export async function apiCall<T = any>(
  url: string,
  options: { method?: string; body?: any } = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in.");

  const token = await user.getIdToken();
  const { method = "GET", body } = options;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Non-JSON response:", text);
    throw new Error("Server returned an unexpected response. Check your API routes and Firebase Admin setup.");
  }

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.message || `API error (${res.status})`);
  }

  return data;
}
