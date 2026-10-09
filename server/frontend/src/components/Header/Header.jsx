import React, { useState } from "react";
import useSession from "../Dealers/useSession";
import { api } from "../Dealers/api";
import "../Dealers/Dashboard.css";

export default function Header() {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true);
    try {
      await api("/djangoapp/logout");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("firstname");
      sessionStorage.removeItem("lastname");
      window.location.assign("/");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return <header className="bestcars-header">
    <a className="bestcars-brand" href="/">Best Cars</a>
    <nav aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/dealers/">Dealerships</a>
      <a href="/about/">About Us</a>
      <a href="/contact/">Contact Us</a>
    </nav>
    <div className="bestcars-account">
      {session.loading ? <span>Checking session...</span> :
        session.username ? <>
          <strong>{session.username}</strong>
          <button type="button" disabled={busy} onClick={logout}>
            {busy ? "Logging out..." : "Logout"}
          </button>
        </> : <>
          <a href="/login/">Login</a>
          <a href="/register/">Register</a>
        </>}
    </div>
    {error && <p role="alert">{error}</p>}
  </header>;
}
