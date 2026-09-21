import React, { useEffect, useRef, useState } from "react";
import { getUser, saveUser, sha256, initDefaultFS, idb } from "../../utils/idb";
import "./oobe.scss";

export const Win11Logo = ({ className = "", fill = "#fff" }) => (
  <svg className={`win11-logo ${className}`} viewBox="0 0 88 88" aria-hidden>
    <rect x="0" y="0" width="40" height="40" fill={fill} />
    <rect x="48" y="0" width="40" height="40" fill={fill} />
    <rect x="0" y="48" width="40" height="40" fill={fill} />
    <rect x="48" y="48" width="40" height="40" fill={fill} />
  </svg>
);

export const MsSquares = ({ className = "ms-squares" }) => (
  <svg className={className} viewBox="0 0 21 21" aria-hidden>
    <rect x="0" y="0" width="10" height="10" fill="#f25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
    <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
    <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
  </svg>
);

export const ProgressRing = ({ dark = false }) => (
  <svg className="oobe-ring progressRing" height={48} width={48} viewBox="0 0 16 16">
    <circle cx="8px" cy="8px" r="7px" style={dark ? { stroke: "#0067c0" } : undefined} />
  </svg>
);

const IcoShield = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3z" stroke="#fff" strokeWidth="1.6" />
    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoApps = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
  </svg>
);
const IcoGlobe = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6" />
    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" stroke="#fff" strokeWidth="1.4" />
  </svg>
);
const IcoFolder = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none">
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10z" stroke="#fff" strokeWidth="1.6" />
  </svg>
);

const STEPS = {
  WELCOME: 0,
  INFO: 1,
  UNDERSTAND: 2,
  USERNAME: 3,
  PASSWORD: 4,
  WORKING: 5,
};

export default function OOBE({ onComplete }) {
  const [step, setStep] = useState(STEPS.WELCOME);
  const [leaving, setLeaving] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [lockLeft, setLockLeft] = useState(5);
  const userRef = useRef(null);
  const passRef = useRef(null);

  useEffect(() => {
    if (step !== STEPS.UNDERSTAND) return;
    setLockLeft(5);
    const t = setInterval(() => {
      setLockLeft((n) => {
        if (n <= 1) {
          clearInterval(t);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (step === STEPS.USERNAME) setTimeout(() => userRef.current?.focus(), 400);
    if (step === STEPS.PASSWORD) setTimeout(() => passRef.current?.focus(), 400);
  }, [step]);

  useEffect(() => {
    if (step !== STEPS.WORKING) return;
    let cancelled = false;
    (async () => {
      const clean = username.trim() || "User";
      const user = {
        username: clean,
        passwordHash: await sha256(password),
        setupComplete: true,
        createdAt: Date.now(),
      };
      await saveUser(user);
      await idb.set("setting.person.name", clean);
      await initDefaultFS(clean);
      try {
        const sett = JSON.parse(localStorage.getItem("setting") || "{}");
        sett.person = { ...(sett.person || {}), name: clean };
        localStorage.setItem("setting", JSON.stringify(sett));
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 2000));
      if (!cancelled) onComplete(user);
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const go = (next) => {
    setLeaving(true);
    setError("");
    setTimeout(() => {
      setStep(next);
      setLeaving(false);
    }, 240);
  };

  const submitUser = () => {
    const name = username.trim();
    if (!name) {
      setError("Please enter a username.");
      return;
    }
    if (name.length > 20) {
      setError("Username must be 20 characters or fewer.");
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(name)) {
      setError("Use letters, numbers, dots, hyphens or underscores only.");
      return;
    }
    go(STEPS.PASSWORD);
  };

  const submitPass = () => {
    if (!password) {
      setError("Please enter a password. This will lock your PC.");
      return;
    }
    if (password.length < 4) {
      setError("Use at least 4 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match. Try again.");
      return;
    }
    go(STEPS.WORKING);
  };

  const onKey = (e, fn) => {
    if (e.key === "Enter") fn();
  };

  const blue = step === STEPS.WELCOME || step === STEPS.INFO || step === STEPS.UNDERSTAND || step === STEPS.WORKING;

  return (
    <div className={`oobe-root ${blue ? "oobe-blue" : "oobe-mslogin"}`}>
      {blue && <div className="oobe-bloom" />}
      <div className="oobe-stage">
        {step === STEPS.WELCOME && (
          <div className={`oobe-page ${leaving ? "leave" : ""}`}>
            <Win11Logo />
            <div className="oobe-kicker">Windows Setup</div>
            <h1 className="oobe-title">Warm Welcome to this WebOS.</h1>
            <p className="oobe-sub">Please press next to continue</p>
            <div className="oobe-actions">
              <button className="oobe-btn primary" onClick={() => go(STEPS.INFO)}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === STEPS.INFO && (
          <div className={`oobe-page ${leaving ? "leave" : ""}`}>
            <Win11Logo className="sm" />
            <div className="oobe-kicker">Before you start</div>
            <h1 className="oobe-title">A few things you should know</h1>
            <p className="oobe-sub">This is a full Windows 11–style desktop that runs in your browser. Here is what that means.</p>
            <div className="oobe-cards">
              <div className="oobe-card">
                <IcoApps />
                <h3>Real apps, not placeholders</h3>
                <p>Start menu, File Explorer, Store, Browser, Terminal, Calendar, Photos, Mail and more are wired up and usable.</p>
              </div>
              <div className="oobe-card">
                <IcoFolder />
                <h3>Your PC lives in IndexedDB</h3>
                <p>Files, notes, installed apps and your account stay on this device. Closing the tab does not wipe them.</p>
              </div>
              <div className="oobe-card">
                <IcoGlobe />
                <h3>Browser, the Windows way</h3>
                <p>Search the web inside Microsoft Edge. Pop-ups stay in this OS — nothing hijacks a new browser tab.</p>
              </div>
              <div className="oobe-card">
                <IcoShield />
                <h3>A lock only you can open</h3>
                <p>Next you will create a local username and password. That password is what unlocks this PC every time.</p>
              </div>
            </div>
            <div className="oobe-actions">
              <button className="oobe-btn ghost" onClick={() => go(STEPS.WELCOME)}>
                Back
              </button>
              <button className="oobe-btn primary" onClick={() => go(STEPS.UNDERSTAND)}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === STEPS.UNDERSTAND && (
          <div className={`oobe-page ${leaving ? "leave" : ""}`}>
            <Win11Logo />
            <h1 className="oobe-title">Ready when you are</h1>
            <p className="oobe-sub">
              WebOS is a community project inspired by Windows 11. It is not a product of Microsoft.
              Your password never leaves this browser. Take a moment, then continue.
            </p>
            <div className="oobe-lockhint">
              {lockLeft > 0 ? `You can continue in ${lockLeft} second${lockLeft === 1 ? "" : "s"}` : "You can continue"}
            </div>
            <div className="oobe-actions">
              <button className="oobe-btn ghost" onClick={() => go(STEPS.INFO)}>
                Back
              </button>
              <button
                className="oobe-btn primary"
                disabled={lockLeft > 0}
                onClick={() => go(STEPS.USERNAME)}
              >
                OK, I understand
              </button>
            </div>
          </div>
        )}

        {(step === STEPS.USERNAME || step === STEPS.PASSWORD) && (
          <div className="ms-wrap">
            <div className={`ms-card ${leaving ? "leave" : ""}`}>
              <div className="ms-wordmark">
                <MsSquares />
                Microsoft
              </div>
              {step === STEPS.USERNAME ? (
                <>
                  <h1>Sign in</h1>
                  <div className="ms-desc">Please enter a Username</div>
                  <div className="ms-field">
                    <input
                      ref={userRef}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => onKey(e, submitUser)}
                      placeholder="Username"
                      autoComplete="username"
                      spellCheck={false}
                    />
                  </div>
                  {error && <div className="ms-error">{error}</div>}
                  <div className="ms-row">
                    <button className="oobe-btn accent" onClick={submitUser}>
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h1>{username}</h1>
                  <div className="ms-desc">Please enter a password which would be your PC lock</div>
                  <div className="ms-field">
                    <input
                      ref={passRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="ms-field">
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => onKey(e, submitPass)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                  </div>
                  {error && <div className="ms-error">{error}</div>}
                  <div className="ms-row" style={{ justifyContent: "space-between" }}>
                    <button className="oobe-btn ghost" style={{ color: "#0067c0", borderColor: "#d1d1d1", background: "#fff" }} onClick={() => go(STEPS.USERNAME)}>
                      Back
                    </button>
                    <button className="oobe-btn accent" onClick={submitPass}>
                      Sign in
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="ms-footer">
              <span>Terms of use</span>
              <span>Privacy &amp; cookies</span>
              <span>…</span>
            </div>
          </div>
        )}

        {step === STEPS.WORKING && (
          <div className={`oobe-page oobe-working ${leaving ? "leave" : ""}`}>
            <ProgressRing />
            <h1 className="oobe-title">We are working, just wait a moment...</h1>
            <p className="oobe-sub">Setting up your account and preparing this PC</p>
          </div>
        )}
      </div>
    </div>
  );
}

export { getUser };
