import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import LifeGraphApp from "./LifeGraphApp.jsx";
import { isConfigured } from "./supabase";
import { useSession, signInWithGoogle, signOut } from "./auth";
import { defaultState, loadLocal, saveLocal, saveGraph, resolveForUser } from "./storage";

function Splash({ text }) {
  return (
    <div className="lg-center">
      <p className="lg-splash">{text || "…"}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

// Pops up on save/export intent for anonymous users. Dismissible — never a wall.
function AuthPrompt({ onClose }) {
  const [busy, setBusy] = React.useState(false);
  const onSignIn = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle(); // full-page redirect; resolves on return
    if (error) setBusy(false);
  };
  return (
    <div className="lg-modal-overlay" onClick={onClose}>
      <div className="lg-login-card" onClick={(e) => e.stopPropagation()}>
        <button className="lg-x lg-modal-x" onClick={onClose} aria-label="close">✕</button>
        <h1 className="lg-login-title">Save your graph</h1>
        <p className="lg-login-sub">sign in to keep it and pick up from any device</p>
        <button className="lg-google" onClick={onSignIn} disabled={busy || !isConfigured}>
          <GoogleIcon />
          {busy ? "Redirecting…" : "Continue with Google"}
        </button>
        {isConfigured ? (
          <p className="lg-login-note">
            Your graph stays private to your account. We’ll bring over everything
            you’ve made so far.
          </p>
        ) : (
          <p className="lg-err">
            Sign-in isn’t configured yet (missing Supabase env vars). Your graph is
            still saved in this browser.
          </p>
        )}
      </div>
    </div>
  );
}

function Root() {
  const { session, loading } = useSession();
  const [data, setData] = React.useState(null);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const userId = session ? session.user.id : null;

  // Load the right graph: account graph if signed in (migrating local on first
  // sign-in), else the anonymous local graph / sample arc.
  React.useEffect(() => {
    let alive = true;
    setData(null);
    const p = userId ? resolveForUser(userId) : Promise.resolve(loadLocal() || defaultState());
    p.then((s) => { if (alive) setData(s); });
    return () => { alive = false; };
  }, [userId]);

  const onPersist = React.useCallback((payload) => {
    if (userId) saveGraph(userId, payload);
    else saveLocal(payload);
  }, [userId]);

  if (loading) return <Splash text="…" />;
  if (!data) return <Splash text="opening your graph…" />;

  const account = session ? { email: session.user.email, onSignOut: signOut } : null;

  return (
    <>
      <LifeGraphApp
        key={userId || "anon"}
        initialState={data}
        account={account}
        onPersist={onPersist}
        onRequestAuth={() => setPromptOpen(true)}
      />
      {promptOpen && !session ? <AuthPrompt onClose={() => setPromptOpen(false)} /> : null}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
