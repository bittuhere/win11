import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changeTheme } from "../../../actions";
import { Image, ToolBar } from "../../../utils/general";
import LangSwitch from "./assets/Langswitch";
import "./assets/settings.scss";
import data from "./assets/settingsData.json";

export const Settings = () => {
  const wnapp = useSelector((state) => state.apps.settings);
  const theme = useSelector((state) => state.setting.person.theme);
  const dispatch = useDispatch();

  const wall = useSelector((state) => state.wallpaper);

  const [page, setPage] = useState("System"); // default System
  const [nav, setNav] = useState("");
  const [updating, setUpdating] = useState(false);
  const [upmodalOpen, setUpmodalOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [query, setQuery] = useState("");
  const [rename, setRename] = useState("");
  const brightness = useSelector((s) => s.setting.system.display.brightness);
  const night = useSelector((s) => s.setting.system.display.nightlight.state);
  const wifi = useSelector((s) => s.setting.network.wifi.state);
  const bt = useSelector((s) => s.setting.devices.bluetooth);
  const saver = useSelector((s) => s.setting.system.power.saver.state);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    const el = document.getElementById("brightoverlay");
    if (el) el.style.opacity = String((100 - (brightness || 100)) / 140);
  }, [brightness]);

  useEffect(() => {
    document.body.dataset.sepia = night ? "true" : "false";
  }, [night]);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(setStorage).catch(() => {});
    }
  }, [page, detail]);

  const themechecker = {
    default: "light",
    dark: "dark",
    ThemeA: "dark",
    ThemeB: "dark",
    ThemeD: "light",
    ThemeC: "light",
  };

  const handleWallAndTheme = (e) => {
    var payload = e.target.dataset.payload;
    var theme_nxt = themechecker[payload.split("/")[0]],
      src = payload;

    if (theme_nxt != theme) {
      changeTheme();
    }

    dispatch({
      type: "WALLSET",
      payload: src,
    });
  };

  const userName = useSelector((state) => state.setting.person.name);

  return (
    <div
      className="settingsApp floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{
        ...(wnapp.size == "cstm" ? wnapp.dim : null),
        zIndex: wnapp.z,
      }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar
        app={wnapp.action}
        icon={wnapp.icon}
        size={wnapp.size}
        name="Settings"
      />
      <div className="windowScreen flex flex-col" data-dock="true">
        <div className="restWindow flex-grow flex flex-col">
          <nav className={nav}>
            <div className="nav_top">
              <div className="account" onClick={() => setPage("Accounts")}>
                <img
                  src="img/settings/defAccount.webp"
                  alt=""
                  height={60}
                  width={60}
                />
                <div>
                  <p>{userName}</p>
                  <p>Local Account</p>
                </div>
              </div>
              <input
                type="text"
                className="search"
                placeholder="Find a setting "
                name="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="nav_bottom win11Scroll">
              {Object.keys(data).map((e) => {
                return (
                  <div
                    key={e}
                    className={`navLink ${e === page ? "selected" : ""}`}
                    onClick={() => {
                      // avoid inline functions
                      setPage(e);
                    }}
                  >
                    <img
                      src={`img/settings/${e}.webp`}
                      alt=""
                      height={16}
                      width={16}
                    />
                    {e}
                  </div>
                );
              })}
              <div className="marker"></div>
            </div>
          </nav>

          {Object.keys(data).map((e) => {
            return (
              page === e && (
                <main key={e}>
                  <h1>{e}</h1>
                  <div className="tilesCont win11Scroll">
                    {data[e].map((e, i) => {
                      switch (e.type) {
                        case "sysTop":
                          return (
                            <div key={i} className={e.type}>
                              <div className="left">
                                <img
                                  src={`img/wallpaper/${wall.src}`}
                                  alt=""
                                  className="device_img"
                                />
                                <div className="column_device">
                                  <p className="device_name">Liber-V</p>
                                  <p className="device_model">NS14A8</p>
                                  <p className="device_rename">Rename</p>
                                </div>
                              </div>
                              <div className="right">
                                <div className="column">
                                  <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/2/25/Microsoft_icon.svg"
                                    height={20}
                                    alt=""
                                  />
                                  <p>
                                    Microsoft 365
                                    <br />
                                    <span className="column_lower">
                                      View benefits
                                    </span>
                                  </p>
                                </div>
                                <div
                                  className="column"
                                  onClick={() => setPage("Windows Update")}
                                >
                                  <img
                                    src="img/settings/Windows Update.webp"
                                    alt=""
                                    height={20}
                                  />
                                  <p>
                                    Windows Update
                                    <br />
                                    <span className="column_lower">
                                      You're up to date
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        case "netTop":
                          return (
                            <div key={i} className="netTop">
                              <div>
                                <img
                                  src="img/settings/wifi.png"
                                  alt=""
                                  height={100}
                                />
                                <div>
                                  <h2 className="font-medium text-lg">WiFi</h2>
                                  <p>Connected, secured</p>
                                </div>
                              </div>
                              <div className="box">
                                <span className="settingsIcon"></span>
                                <div>
                                  <h3>Properties</h3>
                                  <p>Public network 5 Ghz</p>
                                </div>
                              </div>
                              <div className="box">
                                <span className="settingsIcon"></span>
                                <div>
                                  <h3>Data Usage</h3>
                                  <p>
                                    {Math.round(Math.random() * 100)}GB, last 30
                                    days
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        case "personaliseTop":
                          return (
                            <div key={i} className="personaliseTop">
                              <img
                                className="mainImg"
                                src={`img/wallpaper/${wall.src}`}
                                alt=""
                              />
                              <div>
                                <h3>Select a theme to apply</h3>
                                <div className="bgBox">
                                  {wall.themes.map((e, i) => {
                                    return (
                                      <Image
                                        key={i}
                                        className={
                                          wall.src.includes(e) ? "selected" : ""
                                        }
                                        src={`img/wallpaper/${e}/img0.jpg`}
                                        ext
                                        onClick={handleWallAndTheme}
                                        click="WALLSET"
                                        payload={`${e}/img0.jpg`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        case "accountsTop":
                          return (
                            <div key={i} className="accountsTop ">
                              <img
                                src="img/settings/defAccount.webp"
                                alt=""
                                width={90}
                              />
                              <div>
                                <p>{userName.toUpperCase()}</p>
                                <p>Local Account</p>
                                <p>Administrator</p>
                              </div>
                            </div>
                          );
                        case "timeTop":
                          return (
                            <div className="timeTop">
                              <h1>
                                {new Date().toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "numeric",
                                  hour12: true,
                                })}
                              </h1>
                            </div>
                          );
                        case "langSwitcher":
                          return (
                            <div key={i} className="tile langSwitcherTile">
                              <span className="settingsIcon"></span>
                              <div className="tile_content">
                                <p>Windows display language</p>
                                <p className="tile_desc">
                                  Windows features like Settings and File
                                  Explorer will appear in this language
                                </p>
                              </div>
                              <LangSwitch />
                            </div>
                          );
                        case "updateTop":
                          return (
                            <div key={i} className="updateTop">
                              <div className="left">
                                <img
                                  src="img/settings/update.png"
                                  width={90}
                                  alt=""
                                />
                                <div>
                                  <h2>You're up to date</h2>
                                  <p>Last checked: Today</p>
                                </div>
                              </div>
                              <div className="right">
                                <div
                                  className="btn"
                                  onClick={() => {
                                    setUpdating(true);
                                    setTimeout(() => {
                                      setUpdating(false);
                                      setUpmodalOpen(true);
                                    }, Math.random() * 2000);
                                  }}
                                >
                                  {updating
                                    ? "Checking for updates..."
                                    : "Check for updates"}
                                </div>
                              </div>
                            </div>
                          );

                        case "subHeading":
                        case "spacer":
                          return (
                            <div key={i} className={e.type}>
                              {e.name}
                            </div>
                          );
                        case "tile":
                        case "tile square":
                        case "tile thin-blue":
                          return (
                            <div key={e.name} className={e.type}>
                              <span className="settingsIcon">{e.icon}</span>
                              <div>
                                <p>{e.name}</p>
                                <p className="tile_desc">{e.desc}</p>
                              </div>
                            </div>
                          );
                        default:
                          return console.log(
                            `error - type ${e.type} not found`,
                          );
                      }
                    })}
                  </div>
                </main>
              )
            );
          })}

          {detail && (
            <div className="settingsDetail">
              <button type="button" className="sdBack" onClick={() => setDetail(null)}>← Back</button>
              <h1>{detail.name}</h1>
              <p className="tile_desc">{detail.desc}</p>
              <div className="sdBody">
                {detail.name === "Display" && (
                  <label className="sdRow">
                    Brightness
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={brightness}
                      onChange={(e) =>
                        dispatch({ type: "STNGSETV", payload: { path: "system.display.brightness", value: +e.target.value } })
                      }
                    />
                    <span>{brightness}%</span>
                  </label>
                )}
                {detail.name === "Sound" && (
                  <p>Use the speaker icon on the taskbar to change volume. This PC uses your browser audio output.</p>
                )}
                {(detail.name === "Bluetooth" || detail.name === "Bluetooth & devices") && (
                  <label className="sdRow">
                    Bluetooth
                    <input type="checkbox" checked={!!bt} onChange={() => dispatch({ type: "STNGTOGG", payload: "devices.bluetooth" })} />
                  </label>
                )}
                {detail.name === "WiFi" && (
                  <label className="sdRow">
                    Wi‑Fi
                    <input type="checkbox" checked={!!wifi} onChange={() => dispatch({ type: "STNGTOGG", payload: "network.wifi.state" })} />
                  </label>
                )}
                {detail.name === "Flight mode" && (
                  <button type="button" className="sdBtn" onClick={() => dispatch({ type: "TOGGAIRPLNMD" })}>Toggle flight mode</button>
                )}
                {(detail.name === "Colours" || detail.name === "Themes" || detail.name === "Background") && (
                  <button type="button" className="sdBtn" onClick={() => changeTheme()}>
                    Switch to {theme === "light" ? "dark" : "light"} theme
                  </button>
                )}
                {(detail.name === "Night light" || detail.name === "Visual effects") && (
                  <label className="sdRow">
                    Night light
                    <input type="checkbox" checked={!!night} onChange={() => dispatch({ type: "STNGTOGG", payload: "system.display.nightlight.state" })} />
                  </label>
                )}
                {detail.name === "Power & battery" && (
                  <label className="sdRow">
                    Battery saver
                    <input type="checkbox" checked={!!saver} onChange={() => dispatch({ type: "STNGTOGG", payload: "system.power.saver.state" })} />
                  </label>
                )}
                {detail.name === "Storage" && (
                  <p>
                    {storage
                      ? `This browser is using ${Math.round((storage.usage || 0) / 1e6)} MB of about ${Math.round((storage.quota || 0) / 1e6)} MB.`
                      : "Storage lives in IndexedDB on this device."}
                  </p>
                )}
                {(detail.name === "Your info" || detail.name === "Your Microsoft account") && (
                  <label className="sdRow">
                    Account name
                    <input
                      value={rename || userName}
                      onChange={(e) => setRename(e.target.value)}
                      onBlur={() => rename && dispatch({ type: "STNGSETV", payload: { path: "person.name", value: rename } })}
                    />
                  </label>
                )}
                {detail.name === "About" && (
                  <div>
                    <p><b>Device name</b> {userName}-PC</p>
                    <p><b>Processor</b> WebOS virtual CPU</p>
                    <p><b>Installed RAM</b> Browser heap</p>
                    <p><b>System type</b> 64-bit WebOS</p>
                    <p><b>Edition</b> Windows 11 WebOS</p>
                  </div>
                )}
                {detail.name === "Windows Security" && (
                  <button type="button" className="sdBtn" onClick={() => dispatch({ type: "SECURITYAPP", payload: "full" })}>
                    Open Windows Security
                  </button>
                )}
                {detail.name === "Clipboard" && (
                  <button type="button" className="sdBtn" onClick={() => navigator.clipboard?.writeText("")}>
                    Clear clipboard
                  </button>
                )}
                {detail.name === "Recovery" && (
                  <p>Open Terminal and run <code>reset-setup</code>, then reload to run OOBE again.</p>
                )}
                {detail.name === "Date & time" && (
                  <p>{new Date().toLocaleString()}</p>
                )}
                {detail.name === "Notifications" && (
                  <label className="sdRow">
                    Notifications
                    <input type="checkbox" defaultChecked />
                  </label>
                )}
                {!["Display","Sound","Bluetooth","WiFi","Flight mode","Colours","Themes","Background","Night light","Visual effects","Power & battery","Storage","Your info","Your Microsoft account","About","Windows Security","Clipboard","Recovery","Date & time","Notifications"].includes(detail.name) && (
                  <p>This setting is stored on this PC. Changes apply to WebOS immediately where the feature exists.</p>
                )}
              </div>
            </div>
          )}

          {upmodalOpen && (
            <>
              <div className="absolute z-30 bg-black bg-opacity-60 h-full w-full top-0 left-0"></div>

              <div
                className="absolute top-[50%] left-[50%] z-50 rounded"
                style={{
                  transform: `translateX(-50%) translateY(-50%)`,
                  background: `var(--wintheme)`,
                  padding: `1.5rem`,
                }}
              >
                <h1
                  style={{
                    marginBottom: `10px`,
                  }}
                  className="text-2xl font-semibold"
                >
                  Restart required
                </h1>
                <p>
                  Some changes will not take effect until you restart your
                  device.
                </p>

                <div
                  className="flex"
                  style={{
                    marginTop: `14px`,
                  }}
                >
                  <button
                    style={{
                      padding: "10px",
                      backgroundColor: "var(--clrPrm)",
                      color: "var(--alt-txt)",
                      marginRight: "10px",
                    }}
                    onClick={() => {
                      // Clear the cache and reload the page
                      window.location =
                        window.location.href + `?clearCache=${Math.random()}`;
                    }}
                    className="flex-1 rounded border-none hover:opacity-95"
                  >
                    Restart now
                  </button>
                  <button
                    style={{
                      padding: "10px",
                      color: "var(--sat-txt)",
                    }}
                    className="flex-1 rounded border"
                    onClick={() => {
                      setUpmodalOpen(false);
                    }}
                  >
                    Restart later
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="navMenuBtn" onClick={() => setNav(nav ? "" : "open")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 48 48"
              width={24}
              height={24}
            >
              <path d="M5.5 9a1.5 1.5 0 1 0 0 3h37a1.5 1.5 0 1 0 0-3h-37zm0 13.5a1.5 1.5 0 1 0 0 3h37a1.5 1.5 0 1 0 0-3h-37zm0 13.5a1.5 1.5 0 1 0 0 3h37a1.5 1.5 0 1 0 0-3h-37z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
