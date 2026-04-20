import { auth } from "./firebase";

export async function apiCall<T = any>(
  url: string,
  options: { method?: string; body?: any } = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to make API requests.");
  }

  let token: string;
  try {
    // Force token refresh to ensure it's valid
    token = await user.getIdToken(true);
  } catch (tokenErr: any) {
    console.error("Failed to get ID token:", tokenErr.message);
    throw new Error("Authentication failed. Please sign in again.");
  }

  const { method = "GET", body } = options;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // Try to parse as JSON first
    let data: any;
    try {
      data = await res.json();
    } catch (e) {
      // If JSON parsing fails, get the raw text for debugging
      const text = await res.text();
      console.error(`Failed to parse JSON response from ${method} ${url}:`, {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        body: text.substring(0, 500), // First 500 chars
      });
      throw new Error(`API request to ${url} failed: ${res.status} ${res.statusText}. Response was not JSON. Check server logs.`);
    }

    if (!res.ok) {
      console.error(`API Error - ${method} ${url}:`, {
        status: res.status,
        message: data.message,
        data,
      });
      throw new Error(data.message || `API error: ${res.status} ${res.statusText}`);
    }

    if (data.ok === false) {
      console.error(`API returned ok: false - ${method} ${url}:`, data);
      throw new Error(data.message || "API returned ok: false");
    }

    return data;
  } catch (err: any) {
    // Re-throw with more context
    if (err.message.includes("Failed to parse JSON") || err.message.includes("API error")) {
      throw err; // Already formatted
    }
    console.error(`Network or parsing error - ${method} ${url}:`, err);
    throw new Error(`Failed to complete API request: ${err.message}`);
  }
}
