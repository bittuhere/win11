import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch, useSelector } from "react-redux";
import "./i18nextConf";
import "./index.css";

import ActMenu from "./components/menu";
import {
  BandPane,
  CalnWid,
  DesktopApp,
  SidePane,
  StartMenu,
  WidPane,
} from "./components/start";
import Taskbar from "./components/taskbar";
import { Background, BootScreen, LockScreen } from "./containers/background";
import OOBE from "./containers/oobe";

import { loadSettings } from "./actions";
import { AboutWin, WINDOW_APPS } from "./containers/applications";
import * as Drafts from "./containers/applications/draft";
import { getUser, seedIfEmpty } from "./utils/idb";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <meta charSet="UTF-8" />
      <title>404 - Page</title>
      <script src="https://win11.blueedge.me/script.js"></script>
      <link rel="stylesheet" href="https://win11.blueedge.me/style.css" />
      <div id="page">
        <div id="container">
          <h1>:(</h1>
          <h2>
            Your PC ran into a problem and needs to restart. We're just
            collecting some error info, and then we'll restart for you.
          </h2>
          <h2>
            <span id="percentage">0</span>% complete
          </h2>
          <div id="details">
            <div id="qr">
              <div id="image">
                <img src="https://win11.blueedge.me/img/qr.png" alt="QR Code" />
              </div>
            </div>
            <div id="stopcode">
              <h4>
                For more information about this issue and possible fixes, visit
                <br />{" "}
                <a href="https://github.com/blueedgetechno/win11React/issues">
                  https://github.com/blueedgetechno/win11React/issues
                </a>{" "}
              </h4>
              <h5>
                If you call a support person, give them this info:
                <br />
                Stop Code: {error.message}
              </h5>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const apps = useSelector((state) => state.apps);
  const wall = useSelector((state) => state.wallpaper);
  const dispatch = useDispatch();
  const [setup, setSetup] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getUser();
      if (user?.setupComplete) await seedIfEmpty();
      if (!alive) return;
      setSetup(!!(user && user.setupComplete));
      if (user?.username) {
        dispatch({
          type: "STNGSETV",
          payload: { path: "person.name", value: user.username },
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const afterMath = (event) => {
    var ess = [
      ["START", "STARTHID"],
      ["BAND", "BANDHIDE"],
      ["PANE", "PANEHIDE"],
      ["WIDG", "WIDGHIDE"],
      ["CALN", "CALNHIDE"],
      ["MENU", "MENUHIDE"],
    ];

    var actionType = "";
    try {
      actionType = event.target.dataset.action || "";
    } catch (err) {}

    var actionType0 = getComputedStyle(event.target).getPropertyValue(
      "--prefix",
    );

    ess.forEach((item, i) => {
      if (!actionType.startsWith(item[0]) && !actionType0.startsWith(item[0])) {
        dispatch({
          type: item[1],
        });
      }
    });
  };

  useEffect(() => {
    const onContext = (e) => {
      afterMath(e);
      e.preventDefault();
      var data = {
        top: e.clientY,
        left: e.clientX,
      };

      if (e.target.dataset.menu != null) {
        data.menu = e.target.dataset.menu;
        data.attr = e.target.attributes;
        data.dataset = e.target.dataset;
        dispatch({
          type: "MENUSHOW",
          payload: data,
        });
      }
    };
    window.addEventListener("click", afterMath);
    window.addEventListener("contextmenu", onContext);
    return () => {
      window.removeEventListener("click", afterMath);
      window.removeEventListener("contextmenu", onContext);
    };
  }, [dispatch]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === "F4" || e.code === "F4")) {
        e.preventDefault();
        const top = Object.keys(apps)
          .filter((k) => k !== "hz")
          .map((k) => apps[k])
          .find((a) => a && a.alive && !a.closing && a.z === apps.hz);
        if (top?.action) dispatch({ type: top.action, payload: "close" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apps, dispatch]);

  useEffect(() => {
    const closing = Object.keys(apps).filter((k) => k !== "hz" && apps[k]?.closing);
    if (!closing.length) return;
    const timers = closing.map((id) =>
      setTimeout(() => dispatch({ type: "APPREAP", payload: id }), 280),
    );
    return () => timers.forEach(clearTimeout);
  }, [apps, dispatch]);

  useEffect(() => {
    if (setup !== true) return;
    const origOpen = window.open.bind(window);
    window.open = function (url, target, feat) {
      if (!url || String(url).startsWith("about:")) {
        return origOpen(url, target, feat);
      }
      dispatch({ type: "EDGELINK", payload: url });
      return null;
    };
    if (!window.onstart) {
      loadSettings();
      window.onstart = setTimeout(() => {
        dispatch({ type: "WALLBOOTED" });
      }, 4200);
    }
    return () => {
      window.open = origOpen;
    };
  }, [setup]);

  const finishOobe = (user) => {
    if (user?.username) {
      dispatch({
        type: "STNGSETV",
        payload: { path: "person.name", value: user.username },
      });
    }
    setSetup(true);
    dispatch({ type: "WALLALOCK" });
    window.onstart = setTimeout(() => {
      dispatch({ type: "WALLBOOTED" });
    }, 4200);
  };

  if (setup === null) {
    return (
      <div className="App">
        <BootScreen dir={0} />
      </div>
    );
  }

  if (setup === false) {
    return (
      <div className="App">
        <OOBE onComplete={finishOobe} />
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {!wall.booted ? <BootScreen dir={wall.dir} /> : null}
        {wall.locked ? <LockScreen dir={wall.dir} /> : null}
        <div className="appwrap">
          <Background />
          <div className="desktop" data-menu="desk">
            <DesktopApp />
            {WINDOW_APPS.map(({ icon, Comp }) => {
              const app = apps[icon];
              if (!app?.alive) return null;
              return <Comp key={icon + "-" + (app.session || 0)} />;
            })}
            {Object.keys(apps)
              .filter((x) => x != "hz")
              .map((key) => apps[key])
              .map((app) => {
                if (app.pwa && app.alive) {
                  var WinApp = Drafts[app.data.type];
                  if (!WinApp) return null;
                  return (
                    <WinApp
                      key={app.icon + "-" + (app.session || 0)}
                      icon={app.icon}
                      {...app.data}
                    />
                  );
                }
                return null;
              })}
            <AboutWin />
            <StartMenu />
            <BandPane />
            <SidePane />
            <WidPane />
            <CalnWid />
          </div>
          <Taskbar />
          <ActMenu />
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default App;
