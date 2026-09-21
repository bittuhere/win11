import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon, Image, ToolBar, LazyComponent } from "../../../utils/general";
import "./assets/store.scss";
import catalog from "./assets/storeCatalog.json";
import { installApp, delApp } from "../../../actions";
import { idb, uid } from "../../../utils/idb";

const StarRow = ({ n = 4, size = 10 }) => (
  <span className="starRow">
    {[1, 2, 3, 4, 5].map((i) => (
      <Icon key={i} className={i <= Math.round(n) ? "bluestar" : ""} fafa="faStar" width={size} />
    ))}
  </span>
);

export const MicroStore = () => {
  const wnapp = useSelector((state) => state.apps.store);
  const appsState = useSelector((state) => state.apps);
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [opapp, setOpapp] = useState(null);
  const [custom, setCustom] = useState([]);
  const dispatch = useDispatch();

  const allApps = useMemo(() => {
    const extra = custom.map((c) => ({ ...c, custom: true }));
    return [...catalog, ...extra];
  }, [custom]);

  useEffect(() => {
    idb.get("store.custom").then((list) => {
      if (Array.isArray(list)) setCustom(list);
    });
  }, [wnapp.hide]);

  const filtered = allApps.filter((a) => {
    if (tab === "apps" && a.type !== "app") return false;
    if (tab === "games" && a.type !== "game") return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.publisher || "").toLowerCase().includes(q) ||
      (a.category || "").toLowerCase().includes(q) ||
      (a.data?.desc || "").toLowerCase().includes(q)
    );
  });

  const installedList = Object.keys(appsState)
    .filter((k) => k !== "hz")
    .map((k) => appsState[k])
    .filter((a) => a && a.pwa);

  return (
    <div
      className="wnstore floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{
        ...(wnapp.size == "cstm" ? wnapp.dim : null),
        zIndex: wnapp.z,
      }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar app={wnapp.action} icon={wnapp.icon} size={wnapp.size} name="Microsoft Store" />
      <div className="windowScreen flex">
        <LazyComponent show={!wnapp.hide}>
          <div className="storeNav h-full w-20 flex flex-col">
            <Icon fafa="faHome" onClick={() => { setTab("home"); setOpapp(null); }} width={20} payload={tab === "home" && !opapp} />
            <Icon fafa="faThLarge" onClick={() => { setTab("apps"); setOpapp(null); }} width={18} payload={tab === "apps" && !opapp} />
            <Icon fafa="faGamepad" onClick={() => { setTab("games"); setOpapp(null); }} width={20} payload={tab === "games" && !opapp} />
            <Icon fafa="faDownload" onClick={() => { setTab("library"); setOpapp(null); }} width={20} payload={tab === "library" && !opapp} />
            <Icon fafa="faPlus" onClick={() => { setTab("add"); setOpapp(null); }} width={18} payload={tab === "add" && !opapp} />
          </div>
          <div className="restWindow msfull win11Scroll">
            {opapp ? (
              <DetailPage
                app={opapp}
                onBack={() => setOpapp(null)}
                installed={!!appsState[opapp.icon]}
              />
            ) : tab === "library" ? (
              <LibraryPage apps={installedList} onOpen={(app) => setOpapp(app)} />
            ) : tab === "add" ? (
              <AddAppPage
                onAdded={async (app) => {
                  const next = [...custom, app];
                  setCustom(next);
                  await idb.set("store.custom", next);
                  setOpapp(app);
                }}
              />
            ) : (
              <BrowsePage
                tab={tab}
                query={query}
                setQuery={setQuery}
                items={filtered}
                featured={allApps.slice(0, 6)}
                onOpen={setOpapp}
              />
            )}
          </div>
        </LazyComponent>
      </div>
    </div>
  );
};

const BrowsePage = ({ tab, query, setQuery, items, featured, onOpen }) => {
  const title = tab === "games" ? "Gaming" : tab === "apps" ? "Apps" : "Home";
  return (
    <div className="pagecont w-full absolute top-0 box-border p-8 storeBrowse">
      <div className="storeTop">
        <div>
          <div className="storeEyebrow">Microsoft Store</div>
          <h2>{title}</h2>
        </div>
        <input
          className="storeSearch"
          placeholder="Search apps, games and more"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {tab === "home" && !query && (
        <div className="storeHero">
          <div>
            <div className="storeEyebrow">Featured</div>
            <h3>Build your WebOS</h3>
            <p>Install real iframe apps from the catalog — Paint, VS Code, Wikipedia, games. They land on your desktop and persist in IndexedDB.</p>
          </div>
        </div>
      )}

      <div className="storeGrid">
        {items.map((item) => (
          <button key={item.id || item.name} className="storeCard" onClick={() => onOpen(item)}>
            <Image className="rounded" w={64} h={64} src={item.icon} ext err="img/icon/store.png" />
            <div className="storeCardMeta">
              <div className="name">{item.name}</div>
              <div className="pub">{item.publisher || item.type}</div>
              <div className="row">
                <StarRow n={item.rating || 4} />
                <span className="price">{item.price || "Free"}</span>
              </div>
            </div>
          </button>
        ))}
        {items.length === 0 && <div className="storeEmpty">No apps match that search.</div>}
      </div>
    </div>
  );
};

const DetailPage = ({ app, onBack, installed }) => {
  const apps = useSelector((state) => state.apps);
  const [dstate, setDown] = useState(installed ? 3 : 0);
  const dispatch = useDispatch();

  useEffect(() => {
    if (apps[app.icon]) setDown(3);
  }, [apps, app.icon]);

  const download = () => {
    setDown(1);
    const payload = {
      name: app.name,
      icon: app.icon,
      type: app.type || "app",
      data: app.data,
    };
    setTimeout(() => {
      installApp(payload);
      setDown(3);
    }, 900);
  };

  const openApp = () => {
    const inst = apps[app.icon];
    if (inst?.action) dispatch({ type: inst.action, payload: "full" });
  };

  const uninstall = () => {
    const inst = apps[app.icon];
    if (!inst) return;
    dispatch({ type: inst.action, payload: "close" });
    dispatch({ type: "DELAPP", payload: app.icon });
    dispatch({ type: "DESKREM", payload: app.name });
    idb.getAll("installed").then(async (list) => {
      const hit = list.find((x) => x.icon === app.icon);
      if (hit) await idb.deleteFrom("installed", app.icon);
    });
    const installedLs = JSON.parse(localStorage.getItem("installed") || "[]").filter((x) => x.icon !== app.icon);
    localStorage.setItem("installed", JSON.stringify(installedLs));
    setDown(0);
  };

  return (
    <div className="detailpage w-full absolute top-0 flex storeDetail">
      <div className="detailcont">
        <button className="storeBack" onClick={onBack}>
          ← Back
        </button>
        <Image className="rounded" ext w={96} h={96} src={app.icon} err="img/icon/store.png" />
        <div className="flex flex-col items-center text-center relative">
          <div className="text-2xl font-semibold mt-6">{app.name}</div>
          <div className="text-xs text-blue-500">{app.publisher || "Community"}</div>
          {dstate === 0 && (
            <div className="instbtn mt-12 mb-8 handcr" onClick={download}>
              Get
            </div>
          )}
          {dstate === 1 && <div className="downbar mt-12 mb-8"></div>}
          {dstate === 3 && (
            <div className="storeBtnRow">
              <div className="instbtn mt-8 mb-4 handcr" onClick={openApp}>
                Open
              </div>
              <button className="storeLink" onClick={uninstall}>
                Uninstall
              </button>
            </div>
          )}
          <div className="flex mt-4">
            <div>
              <div className="flex items-center text-sm font-semibold">
                {app.rating || 4}
                <Icon className="text-orange-600 ml-1" fafa="faStar" width={14} />
              </div>
              <span className="text-xss">Average</span>
            </div>
            <div className="w-px bg-gray-300 mx-4"></div>
            <div>
              <div className="text-sm font-semibold">{Math.round((app.ratingsCount || 1000) / 100) / 10}K</div>
              <div className="text-xss mt-px pt-1">Ratings</div>
            </div>
          </div>
        </div>
      </div>
      <div className="growcont flex flex-col">
        <div className="briefcont py-2 pb-3">
          <div className="text-xs font-semibold">Description</div>
          <div className="text-xs mt-4">
            <pre>{app.data?.desc}</pre>
          </div>
        </div>
        <div className="briefcont py-2 pb-3">
          <div className="text-xs font-semibold">Features</div>
          <div className="text-xs mt-4">
            <pre>{app.data?.feat}</pre>
          </div>
        </div>
        <div className="briefcont py-2 pb-3">
          <div className="text-xs font-semibold">Product details</div>
          <div className="text-xs mt-4 storeFacts">
            <div><b>Category</b> {app.category || app.type}</div>
            <div><b>Price</b> {app.price || "Free"}</div>
            <div><b>Website</b> {app.data?.url}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LibraryPage = ({ apps, onOpen }) => {
  const dispatch = useDispatch();
  return (
    <div className="pagecont w-full absolute top-0 box-border p-8">
      <div className="storeEyebrow">Microsoft Store</div>
      <h2 className="storeH2">Library</h2>
      <p className="storeLead">Apps you installed on this PC. They are saved in IndexedDB so they survive a refresh.</p>
      <div className="storeGrid">
        {apps.map((app) => (
          <div key={app.icon} className="storeCard storeCardWide">
            <Image className="rounded" w={48} h={48} src={app.icon} ext err="img/icon/store.png" />
            <div className="storeCardMeta">
              <div className="name">{app.name}</div>
              <div className="pub">{app.type}</div>
            </div>
            <button
              className="instbtn"
              onClick={() => dispatch({ type: app.action, payload: "full" })}
            >
              Open
            </button>
          </div>
        ))}
        {apps.length === 0 && <div className="storeEmpty">Nothing installed yet. Open Home and press Get.</div>}
      </div>
    </div>
  );
};

const AddAppPage = ({ onAdded }) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [type, setType] = useState("app");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setErr("Name and URL are required.");
      return;
    }
    let href = url.trim();
    if (!/^https?:\/\//i.test(href)) href = "https://" + href;
    const app = {
      id: uid("app"),
      name: name.trim(),
      icon: icon.trim() || "img/icon/store.png",
      publisher: "You",
      type,
      category: "Custom",
      price: "Free",
      rating: 5,
      ratingsCount: 1,
      data: {
        type: "IFrame",
        url: href,
        desc: desc.trim() || `${name} installed from Microsoft Store.`,
        feat: "Custom iframe app",
        gallery: [],
      },
    };
    onAdded(app);
    setName("");
    setUrl("");
    setIcon("");
    setDesc("");
    setErr("");
  };

  return (
    <div className="pagecont w-full absolute top-0 box-border p-8">
      <div className="storeEyebrow">Microsoft Store</div>
      <h2 className="storeH2">Add your own app</h2>
      <p className="storeLead">
        Drop in any website that allows embedding. It is stored in IndexedDB and appears in Home.
        Developers can also edit <code>src/containers/applications/apps/assets/storeCatalog.json</code> — see ADDING_APPS.md.
      </p>
      <form className="storeForm" onSubmit={submit}>
        <label>
          App name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My app" />
        </label>
        <label>
          IFrame URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </label>
        <label>
          Icon URL (optional)
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="https://example.com/favicon.ico" />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="app">App</option>
            <option value="game">Game</option>
          </select>
        </label>
        <label>
          Description
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
        </label>
        {err && <div className="ms-error">{err}</div>}
        <button className="instbtn" type="submit">
          Add to Store
        </button>
      </form>
    </div>
  );
};
