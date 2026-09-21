import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon, ToolBar } from "../../../utils/general";
import { idb, uid } from "../../../utils/idb";
import { bingSearchUrl, bingSuggest, decodeBingHref, favicon, webosSearch } from "../../../utils/websearch";

const HOME = "about:home";
const GOOGLE = "https://www.google.com/webhp?igu=1";
const YT_SAFE = "https://www.bing.com/videos/search?q=nature+wildlife+documentary";

const bookmarks = [
  { name: "New tab", url: HOME },
  { name: "Google", url: GOOGLE },
  { name: "Bing", url: "https://www.bing.com/search?q=web" },
  { name: "Videos", url: YT_SAFE },
  { name: "Wikipedia", url: "https://www.wikipedia.org" },
];

const isValidURL = (string) => {
  var res = String(string || "").match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
  );
  return res !== null;
};

function normalizeBrowseUrl(raw) {
  if (!raw) return HOME;
  let qry = String(raw).trim();
  if (!qry) return HOME;
  if (qry === HOME || qry === "about:blank" || qry === "edge://newtab") return HOME;
  if (/^search:/i.test(qry)) return qry;
  qry = decodeBingHref(qry);

  const bare = qry.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

  if (/^(https?:\/\/)?(www\.)?google\.com(\/|$|\?)/i.test(qry) || bare === "google.com") {
    return GOOGLE;
  }
  if (/^(https?:\/\/)?(www\.)?bing\.com\/?$/i.test(qry) || bare === "bing.com") {
    return "https://www.bing.com/search?q=web";
  }
  if (/(youtube\.com|youtu\.be)/i.test(qry)) {
    return YT_SAFE;
  }
  return qry;
}

function classifyInput(input) {
  let qry = String(input || "").trim();
  if (!qry) return { kind: "home", url: HOME };
  if (qry === HOME) return { kind: "home", url: HOME };
  if (/^search:/i.test(qry)) {
    return { kind: "search", url: qry, q: qry.replace(/^search:/i, "").trim() };
  }
  const mapped = normalizeBrowseUrl(qry);
  if (mapped !== qry) {
    if (/^search:/i.test(mapped)) return { kind: "search", url: mapped, q: mapped.replace(/^search:/i, "").trim() };
    return { kind: "web", url: mapped };
  }
  if (isValidURL(qry)) {
    if (!/^https?:\/\//i.test(qry)) qry = "https://" + qry;
    return { kind: "web", url: normalizeBrowseUrl(qry) };
  }
  return { kind: "search", url: "search:" + qry, q: qry };
}

function hostOf(u) {
  try {
    if (!u || u === HOME) return "home";
    if (/^search:/i.test(u)) return "search";
    return new URL(u).host;
  } catch {
    return "";
  }
}

function blankTab() {
  return {
    id: uid("tab"),
    title: "New tab",
    kind: "home",
    url: HOME,
    q: "",
    results: null,
    featured: null,
    bingUrl: "",
    iframeOnly: false,
    loading: false,
  };
}

const NewTab = ({ onGo }) => {
  const [q, setQ] = useState("");
  const [hints, setHints] = useState([]);
  useEffect(() => {
    if (!q.trim()) { setHints([]); return; }
    const t = setTimeout(() => bingSuggest(q).then(setHints).catch(() => {}), 160);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="edgeHome">
      <div className="edgeHomeInner">
        <svg className="edgeHomeLogo" viewBox="0 0 64 64" width="72" height="72">
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#50e6ff" />
              <stop offset="55%" stopColor="#0078d4" />
              <stop offset="100%" stopColor="#32d4fa" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#eg)" />
          <path d="M18 34c8-14 28-16 32-6-10-2-18 2-22 10 8-2 16 0 22 6-10 8-28 6-32-10z" fill="#fff" opacity="0.95" />
        </svg>
        <div className="edgeHomeBrand">Search with Bing</div>
        <form className="edgeHomeSearch" onSubmit={(e) => { e.preventDefault(); onGo(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the web or type a URL" autoComplete="off" autoFocus />
          <button type="submit">Search</button>
        </form>
        {hints.length > 0 && (
          <div className="wosHints">
            {hints.slice(0, 8).map((h) => (
              <button type="button" key={h} onClick={() => onGo(h)}>{h}</button>
            ))}
          </div>
        )}
        <div className="edgeQuick">
          {bookmarks.filter((b) => b.url !== HOME).map((b) => (
            <button key={b.url} type="button" onClick={() => onGo(b.url)}>
              <span className="eqFav">{b.name.charAt(0)}</span>
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SearchPage = ({ tab, onOpen, onSearch, onBing }) => {
  const [q, setQ] = useState(tab.q || "");
  useEffect(() => setQ(tab.q || ""), [tab.q]);

  if (tab.iframeOnly && tab.bingUrl) {
    return (
      <iframe
        title="bing"
        src={tab.bingUrl}
        className="w-full h-full bingFrame"
        style={{ border: 0, width: "100%", height: "100%", flex: 1, minHeight: 0 }}
        sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-downloads"
      />
    );
  }

  return (
    <div className="wosSearch">
      <form className="wosSearchBar" onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Bing" autoComplete="off" />
        <button type="submit">Search</button>
      </form>

      {tab.loading && <div className="wosLoading"><div className="wosSpin" /> Searching Bing…</div>}

      {!tab.loading && (tab.featured || (tab.results && tab.results.length > 0)) && (
        <div className="wosCount">Bing results for “{tab.q}”</div>
      )}

      {tab.featured && !tab.loading && (
        <button className="wosFeature" type="button" onClick={() => onOpen(tab.featured)}>
          <img className="wosFav" src={tab.featured.favicon || favicon(tab.featured.url)} alt="" />
          <div>
            <div className="wosKicker">{tab.featured.source}</div>
            <h3>{tab.featured.title}</h3>
            <p>{tab.featured.snippet}</p>
            <span className="wosUrl">{tab.featured.url}</span>
          </div>
        </button>
      )}

      <div className="wosList">
        {(tab.results || []).map((r) => (
          <button key={r.url + r.title} className="wosHit" type="button" onClick={() => onOpen(r)}>
            <img className="wosFav" src={r.favicon || favicon(r.url)} alt="" />
            <div>
              <div className="wosSrc">{r.source}</div>
              <div className="wosTitle">{r.title}</div>
              <div className="wosUrl">{r.url}</div>
              <p>{r.snippet}</p>
            </div>
          </button>
        ))}
      </div>

      {tab.bingUrl && !tab.loading && (
        <button type="button" className="wosBingLink" onClick={onBing}>
          Open this search on Bing
        </button>
      )}
    </div>
  );
};

export const EdgeMenu = () => {
  const wnapp = useSelector((state) => state.apps.edge);
  const [tabs, setTabs] = useState([blankTab()]);
  const [ti, setTi] = useState(0);
  const [pending, setPending] = useState(null);
  const [isTyping, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const iframeRef = useRef(null);
  const dispatch = useDispatch();
  const tab = tabs[ti] || tabs[0];

  const patchTab = (id, partial) => {
    setTabs((list) => list.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  };

  const runSearch = async (tabId, q) => {
    const query = String(q || "").trim();
    if (!query) return;
    patchTab(tabId, {
      kind: "search",
      url: "search:" + query,
      q: query,
      title: query,
      loading: true,
      iframeOnly: false,
      bingUrl: bingSearchUrl(query),
    });
    try {
      const data = await webosSearch(query);
      patchTab(tabId, {
        loading: false,
        results: data.results,
        featured: data.featured,
        bingUrl: data.bingUrl,
        iframeOnly: !!data.iframeOnly,
        title: query,
      });
    } catch (e) {
      patchTab(tabId, { loading: false, iframeOnly: true, bingUrl: bingSearchUrl(query) });
    }
    idb.put("history", { id: uid("hist"), url: "search:" + query, at: Date.now() }).catch(() => {});
  };

  const navigate = (raw, { confirm = false, tabId } = {}) => {
    const id = tabId || tab.id;
    const next = classifyInput(raw);
    if (confirm && tab.kind === "web" && next.kind === "web" && hostOf(next.url) && hostOf(tab.url) && hostOf(next.url) !== hostOf(tab.url)) {
      setPending(next.url);
      return;
    }
    setPending(null);
    setTyping(false);
    if (next.kind === "home") {
      patchTab(id, { ...blankTab(), id, title: "New tab" });
      return;
    }
    if (next.kind === "search") {
      runSearch(id, next.q);
      return;
    }
    patchTab(id, {
      kind: "web",
      url: next.url,
      title: hostOf(next.url) || "Tab",
      q: "",
      loading: false,
      iframeOnly: false,
    });
    idb.put("history", { id: uid("hist"), url: next.url, at: Date.now() }).catch(() => {});
  };

  const openResult = (hit) => {
    const href = decodeBingHref(hit.url);
    const mapped = normalizeBrowseUrl(href);
    patchTab(tab.id, {
      kind: "web",
      url: mapped.startsWith("search:") ? href : mapped,
      title: hit.title || hostOf(href),
    });
  };

  const barValue = isTyping
    ? typed
    : tab.kind === "home"
      ? ""
      : tab.kind === "search"
        ? tab.q
        : tab.url;

  const action = (e) => {
    var x = e.target && e.target.dataset.payload;
    if (x == 0) {
      if (tab.kind === "search") runSearch(tab.id, tab.q);
      else if (iframeRef.current && tab.kind === "web") iframeRef.current.src = tab.url;
    } else if (x == 1) navigate(HOME);
    else if (x == 2) navigate(GOOGLE);
    else if (x == 3) {
      if (e.key === "Enter") navigate(e.target.value);
    } else if (x == 6) navigate(e.currentTarget.dataset.url);
  };

  useEffect(() => {
    if (wnapp.url) {
      navigate(wnapp.url, { tabId: tab.id });
      dispatch({ type: "EDGELINK" });
    }
  }, [wnapp.url]);

  const addTab = () => {
    const t = blankTab();
    setTabs((list) => [...list, t]);
    setTi(tabs.length);
  };

  const closeTab = (id, ev) => {
    ev?.stopPropagation();
    setTabs((list) => {
      const next = list.filter((t) => t.id !== id);
      return next.length ? next : [blankTab()];
    });
    setTi((i) => Math.max(0, i - 1));
  };

  return (
    <div
      className="edgeBrowser floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{ ...(wnapp.size == "cstm" ? wnapp.dim : null), zIndex: wnapp.z }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar app={wnapp.action} icon={wnapp.icon} size={wnapp.size} name="Microsoft Edge" float />
      <div className="windowScreen flex flex-col">
        <div className="overTool flex">
          <Icon src={wnapp.icon} width={14} margin="0 6px" />
          <div className="edgeTabs">
            {tabs.map((t, i) => (
              <div key={t.id} className={"btab " + (i === ti ? "on" : "")} onClick={() => setTi(i)}>
                <div>{t.title}</div>
                <span className="edgeTabX" onClick={(e) => closeTab(t.id, e)} role="button">×</span>
              </div>
            ))}
            <button type="button" className="edgeTabAdd" onClick={addTab} title="New tab">+</button>
          </div>
        </div>
        <div className="restWindow flex-grow flex flex-col">
          <div className="addressBar w-full h-10 flex items-center">
            <Icon className="edgenavicon" src="left" onClick={() => navigate(HOME)} payload={4} width={14} ui margin="0 8px" />
            <Icon fafa="faRedo" onClick={action} payload={0} width={14} margin="0 8px" />
            <Icon fafa="faHome" onClick={action} payload={1} width={18} margin="0 16px" />
            <div className="addCont relative flex items-center">
              <input
                className="w-full h-6 px-4"
                onKeyDown={action}
                onChange={(e) => { setTyping(true); setTyped(e.target.value); }}
                onBlur={() => setTyping(false)}
                data-payload={3}
                value={barValue}
                placeholder="Search Bing or enter a web address"
                type="text"
                spellCheck={false}
              />
              <Icon className="z-1 handcr" src="google" ui onClick={action} payload={2} width={14} margin="0 10px" />
            </div>
          </div>
          <div className="w-full bookbar py-2">
            <div className="flex">
              {bookmarks.map((mark, i) => (
                <div key={i} className="flex handcr items-center ml-2 mr-1 prtclk" onClick={action} data-payload={6} data-url={mark.url}>
                  <div className="text-xs">{mark.name}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="siteFrame flex-grow overflow-hidden relative">
            {tab.kind === "home" && <NewTab onGo={(v) => navigate(v)} />}
            {tab.kind === "search" && (
              <SearchPage
                tab={tab}
                onOpen={openResult}
                onSearch={(q) => runSearch(tab.id, q)}
                onBing={() => navigate(tab.bingUrl || bingSearchUrl(tab.q))}
              />
            )}
            {tab.kind === "web" && (
              <iframe
                ref={iframeRef}
                src={tab.url}
                id="isite"
                frameBorder="0"
                className="w-full h-full bingFrame"
                title="site"
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-downloads"
                referrerPolicy="no-referrer"
              />
            )}
            {pending && (
              <div className="redirMask">
                <div className="redirCard">
                  <div className="redirTitle">You'll be redirected to another website</div>
                  <div className="redirUrl">{pending}</div>
                  <p>Open it inside WebOS Edge? It will not spawn a new browser tab.</p>
                  <div className="redirActions">
                    <button className="oobe-btn ghost" style={{ color: "var(--dark-txt)", borderColor: "#d1d1d1" }} onClick={() => setPending(null)}>No</button>
                    <button className="oobe-btn accent" onClick={() => navigate(pending)}>Yes</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
