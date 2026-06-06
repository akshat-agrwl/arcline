import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import LifeGraphApp from "./LifeGraphApp.jsx";
import { isConfigured } from "./supabase";
import { useSession, signInWithGoogle, signOut } from "./auth";
import { loadGraph, saveGraph } from "./storage";

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

function LoginScreen() {
  const [busy, setBusy] = React.useState(false);
  const onClick = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) setBusy(false);
  };
  return (
    <div className="lg-center">
      <div className="lg-login-card">
        <h1 className="lg-login-title">ArcLine</h1>
        <p className="lg-login-sub">map how full each chapter felt — the ups and the downs</p>
        <button className="lg-google" onClick={onClick} disabled={busy}>
          <GoogleIcon />
          {busy ? "Redirecting…" : "Continue with Google"}
        </button>
        <p className="lg-login-note">
          Your graph is private to your account and synced to your browser so it’s
          there on every device.
        </p>
      </div>
    </div>
  );
}

function GraphLoader({ session }) {
  const userId = session.user.id;
  const [state, setState] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    setState(null);
    loadGraph(userId).then((s) => { if (alive) setState(s); });
    return () => { alive = false; };
  }, [userId]);

  const onPersist = React.useCallback((payload) => { saveGraph(userId, payload); }, [userId]);

  if (!state) return <Splash text="opening your graph…" />;

  return (
    <LifeGraphApp
      initialState={state}
      account={{ email: session.user.email, onSignOut: signOut }}
      onPersist={onPersist}
    />
  );
}

function Root() {
  const { session, loading } = useSession();

  if (!isConfigured) {
    return (
      <div className="lg-center">
        <p className="lg-splash">Almost there</p>
        <p className="lg-err">
          Supabase isn’t configured. Copy <code>.env.example</code> to <code>.env</code>,
          fill in your project URL and anon key, then restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }
  if (loading) return <Splash text="…" />;
  if (!session) return <LoginScreen />;
  return <GraphLoader session={session} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
