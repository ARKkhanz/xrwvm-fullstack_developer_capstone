import React, { useState } from "react";
import "./Register.css";
import "../UserManagement.css";

const Register = () => {
  const [form, setForm] = useState({
    userName: "", firstName: "", lastName: "", email: "", password: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const register = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const payload = {
      ...form,
      userName: form.userName.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim()
    };
    if (Object.values(payload).some(value => !value.trim())) {
      setError("Complete all five fields.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/djangoapp/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (!response.ok || json.status !== "Authenticated") {
        throw new Error(json.error || "Registration failed.");
      }
      sessionStorage.setItem("username", json.userName);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/">Back to Home</a>
        <h1>Sign Up</h1>
        <p>Create your Best Cars account.</p>
        <form onSubmit={register}>
          <label htmlFor="username">Username</label>
          <input id="username" name="userName" type="text"
            autoComplete="username" maxLength="150" required
            value={form.userName} onChange={change} disabled={busy} />
          <label htmlFor="first-name">First Name</label>
          <input id="first-name" name="firstName" type="text"
            autoComplete="given-name" maxLength="150" required
            value={form.firstName} onChange={change} disabled={busy} />
          <label htmlFor="last-name">Last Name</label>
          <input id="last-name" name="lastName" type="text"
            autoComplete="family-name" maxLength="150" required
            value={form.lastName} onChange={change} disabled={busy} />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email"
            autoComplete="email" maxLength="254" required
            value={form.email} onChange={change} disabled={busy} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password"
            autoComplete="new-password" required
            value={form.password} onChange={change} disabled={busy} />
          <p className="auth-error" role="alert">{error}</p>
          <button type="submit" disabled={busy}>
            {busy ? "Registering..." : "Register"}
          </button>
        </form>
        <p>Already registered? <a href="/login/">Log in</a></p>
      </section>
    </main>
  );
};

export default Register;
