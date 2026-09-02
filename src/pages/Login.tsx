import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-shield">
            <Shield size={30} />
          </div>

          <div>
            <strong>NGAO</strong>
            <span>SENTINEL</span>
          </div>
        </div>

        <div className="login-heading">
          <p>SECURE ACCESS</p>
          <h1>Welcome back</h1>
          <span>Sign in to the NGAO Sentinel operations center.</span>
        </div>

        <form onSubmit={handleLogin}>
          <label>
            Email
            <div className="input-wrap">
              <Mail size={18} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-wrap">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="login-footer">
          NGAO Sentinel · Secure Operations Platform
        </div>
      </div>
    </div>
  );
}

