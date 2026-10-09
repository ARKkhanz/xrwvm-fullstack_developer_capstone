// Shared JSON request handling.
export async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });
  const data = await response.json();
  if (!response.ok || (data.status && data.status !== 200)) {
    throw new Error(data.message || data.error || "Request failed. Please retry.");
  }
  return data;
}
