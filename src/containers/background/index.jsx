import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Battery from "../../components/shared/Battery";
import { Icon, Image } from "../../utils/general";
import { getUser, verifyPassword } from "../../utils/idb";
import { Win11Logo, ProgressRing } from "../oobe";
import "./back.scss";

export const Background = () => {
  const wall = useSelector((state) => state.wallpaper);

  return (
    <div
      className="background"
      style={{
        backgroundImage: `url(img/wallpaper/${wall.src})`,
      }}
    ></div>
  );
};

export const BootScreen = (props) => {
  const dispatch = useDispatch();
  const wall = useSelector((state) => state.wallpaper);
  const [blackout, setBlackOut] = useState(false);

  useEffect(() => {
    if (props.dir < 0) {
      setTimeout(() => {
        setBlackOut(true);
      }, 4000);
    }
  }, [props.dir]);

  useEffect(() => {
    if (props.dir < 0) {
      if (blackout) {
        if (wall.act == "restart") {
          setTimeout(() => {
            setBlackOut(false);
            setTimeout(() => {
              dispatch({ type: "WALLBOOTED" });
            }, 4000);
          }, 2000);
        }
      }
    }
  }, [blackout]);

  return (
    <div className="bootscreen">
      <div className={blackout ? "hidden" : ""}>
        <Win11Logo fill="#fff" />
        <div className="mt-48" id="loader">
          <ProgressRing />
        </div>
      </div>
    </div>
  );
};

const UserAvatar = ({ name = "User", size = 120 }) => {
  const letter = (name || "U").trim().charAt(0).toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="rounded-full overflow-hidden">
      <defs>
        <linearGradient id="avbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4cc2ff" />
          <stop offset="100%" stopColor="#0067c0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="60" fill="url(#avbg)" />
      <circle cx="60" cy="46" r="20" fill="rgba(255,255,255,0.92)" />
      <path d="M24 108c6-24 22-36 36-36s30 12 36 36" fill="rgba(255,255,255,0.92)" />
      <text x="60" y="118" textAnchor="middle" fontSize="0" fill="transparent">
        {letter}
      </text>
    </svg>
  );
};

export const LockScreen = (props) => {
  const wall = useSelector((state) => state.wallpaper);
  const [lock, setLock] = useState(false);
  const [unlocked, setUnLock] = useState(false);
  const [password, setPass] = useState("");
  const [passType, setType] = useState(1);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [storedName, setStoredName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const dispatch = useDispatch();

  const reduxName = useSelector((state) => state.setting.person.name);
  const userName = storedName || reduxName || "User";

  useEffect(() => {
    getUser().then((u) => {
      if (u?.username) setStoredName(u.username);
    });
  }, []);

  useEffect(() => {
    if (lock) setTimeout(() => inputRef.current?.focus(), 420);
  }, [lock]);

  const action = (e) => {
    var act = e.target.dataset.action,
      payload = e.target.dataset.payload;

    if (act == "splash") setLock(true);
    else if (act == "inpass") {
      setError("");
      var val = e.target.value;
      if (!passType) {
        val = val.substring(0, 4);
        val = !Number(val) ? "" : val;
      }
      setPass(val);
    } else if (act == "pinlock") setType(0);
    else if (act == "passkey") setType(1);

    if (act == "pinlock" || act == "passkey") setPass("");
  };

  const proceed = async () => {
    if (busy) return;
    setBusy(true);
    const user = await getUser();
    if (user && user.passwordHash) {
      const ok = await verifyPassword(password);
      if (!ok) {
        setError("The password is incorrect. Try again.");
        setShaking(true);
        setTimeout(() => setShaking(false), 420);
        setPass("");
        setBusy(false);
        inputRef.current?.focus();
        return;
      }
    }
    setUnLock(true);
    setTimeout(() => {
      dispatch({ type: "WALLUNLOCK" });
    }, 700);
  };

  const action2 = (e) => {
    if (e.key == "Enter") proceed();
  };

  return (
    <div
      className={"lockscreen " + (props.dir == -1 ? "slowfadein" : "")}
      data-unlock={unlocked}
      style={{
        backgroundImage: `url(${`img/wallpaper/lock.jpg`})`,
      }}
      onClick={action}
      data-action="splash"
      data-blur={lock}
    >
      <div className="splashScreen mt-40" data-faded={lock}>
        <div className="text-6xl font-semibold text-gray-100">
          {new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })}
        </div>
        <div className="text-lg font-medium text-gray-200">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
      <div className="fadeinScreen" data-faded={!lock} data-unlock={unlocked}>
        <UserAvatar name={userName} size={120} />
        <div className="mt-4 text-2xl font-medium text-gray-200">{userName}</div>
        <div className={`lockPassRow ${shaking ? "shake" : ""}`}>
          <input
            ref={inputRef}
            type={passType ? "password" : "password"}
            value={password}
            onChange={action}
            data-action="inpass"
            onKeyDown={action2}
            onClick={(e) => e.stopPropagation()}
            placeholder={passType ? "Password" : "PIN"}
            autoComplete="current-password"
          />
          <button
            className="lockGo"
            onClick={(e) => {
              e.stopPropagation();
              proceed();
            }}
            aria-label="Submit"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {error ? <div className="lockErr">{error}</div> : <div className="lockErr spacer" />}
        <div className="text-xs text-gray-300 mt-1">Sign-in options</div>
        <div className="lockOpt flex">
          <Icon src="pinlock" onClick={action} ui width={36} click="pinlock" payload={passType == 0} />
          <Icon src="passkey" onClick={action} ui width={36} click="passkey" payload={passType == 1} />
        </div>
      </div>
      <div className="bottomInfo flex">
        <Icon className="mx-2" src="wifi" ui width={16} invert />
        <Battery invert />
      </div>
    </div>
  );
};
