import React, { useState } from "react";
import "../UserManagement.css";

export default function LoginPanel() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!userName.trim() || !password.trim()) {
      setError("Enter your username and password.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/djangoapp/login", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userName.trim(), password })
      });
      const json = await response.json();
      if (!response.ok || json.status !== "Authenticated") {
        throw new Error(json.error || "Login failed.");
      }
      sessionStorage.setItem("username", json.userName);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/">Back to Home</a>
        <h1>Login</h1>
        <form onSubmit={signIn}>
          <label htmlFor="login-name">Username</label>
          <input id="login-name" type="text" autoComplete="username"
            required value={userName} disabled={busy}
            onChange={e => setUserName(e.target.value)} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password"
            autoComplete="current-password" required
            value={password} disabled={busy}
            onChange={e => setPassword(e.target.value)} />
          <p className="auth-error" role="alert">{error}</p>
          <button type="submit" disabled={busy}>
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>
        <p>New customer? <a href="/register/">Register</a></p>
      </section>
    </main>
  );
}
