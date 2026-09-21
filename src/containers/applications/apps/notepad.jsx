import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToolBar } from "../../../utils/general";
import { idb, uid, fsWrite, getUser } from "../../../utils/idb";

const blankDoc = () => ({ id: uid("doc"), name: "Untitled.txt", text: "", saved: true });

export const Notepad = () => {
  const wnapp = useSelector((state) => state.apps.notepad);
  const dispatch = useDispatch();
  const [tabs, setTabs] = useState([blankDoc()]);
  const [ti, setTi] = useState(0);
  const [wrap, setWrap] = useState(true);
  const [find, setFind] = useState("");
  const [findOpen, setFindOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [zoom, setZoom] = useState(100);
  const ta = useRef(null);
  const doc = tabs[ti] || tabs[0];

  useEffect(() => {
    if (wnapp.openDoc) {
      const d = {
        id: uid("doc"),
        name: wnapp.openDoc.name || "Untitled.txt",
        text: wnapp.openDoc.text || "",
        saved: true,
      };
      setTabs((t) => [...t, d]);
      setTi((n) => n + 1);
      dispatch({ type: "OPENTXT" });
    }
  }, [wnapp.openDoc]);

  const patch = (partial) => {
    setTabs((list) => list.map((t, i) => (i === ti ? { ...t, ...partial, saved: partial.saved ?? false } : t)));
  };

  const save = async (current = doc) => {
    let name = current.name;
    if (!name || name === "Untitled.txt") {
      name = window.prompt("Save as", current.name) || current.name;
    }
    await idb.put("notepad", { id: current.id, name, text: current.text, at: Date.now() });
    const user = await getUser();
    const uname = user?.username || "User";
    const file = name.endsWith(".txt") ? name : name + ".txt";
    await fsWrite(`C:\\Users\\${uname}\\Documents\\${file}`, current.text);
    setTabs((list) => list.map((t) => (t.id === current.id ? { ...t, name: file, saved: true } : t)));
  };

  const openSaved = async () => {
    const docs = await idb.getAll("notepad");
    if (!docs.length) {
      window.alert("No saved documents yet.");
      return;
    }
    const pick = window.prompt("Open (type the file name):\n" + docs.map((d) => d.name).join("\n"), docs[0].name);
    const hit = docs.find((d) => d.name === pick);
    if (hit) {
      setTabs((t) => [...t, { id: hit.id, name: hit.name, text: hit.text || "", saved: true }]);
      setTi(tabs.length);
    }
  };

  const addTab = () => {
    setTabs((t) => [...t, blankDoc()]);
    setTi(tabs.length);
  };

  const closeTab = (i, e) => {
    e?.stopPropagation();
    setTabs((list) => {
      const next = list.filter((_, idx) => idx !== i);
      return next.length ? next : [blankDoc()];
    });
    setTi((n) => Math.max(0, n - 1));
  };

  const stats = useMemo(() => {
    const text = doc?.text || "";
    const lines = text.split("\n");
    const caret = ta.current?.selectionStart || 0;
    const before = text.slice(0, caret);
    const line = before.split("\n").length;
    const col = before.split("\n").pop().length + 1;
    return { lines: lines.length, chars: text.length, line, col };
  }, [doc?.text, ti]);

  const doFind = () => {
    if (!find || !ta.current) return;
    const start = ta.current.selectionEnd;
    const idx = doc.text.toLowerCase().indexOf(find.toLowerCase(), start);
    const at = idx >= 0 ? idx : doc.text.toLowerCase().indexOf(find.toLowerCase());
    if (at >= 0) {
      ta.current.focus();
      ta.current.setSelectionRange(at, at + find.length);
    }
  };

  return (
    <div
      className="notepad win11notepad floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{ ...(wnapp.size == "cstm" ? wnapp.dim : null), zIndex: wnapp.z }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar
        app={wnapp.action}
        icon={wnapp.icon}
        size={wnapp.size}
        name={`${doc.name}${doc.saved ? "" : "*"} - Notepad`}
      />
      <div className="windowScreen flex flex-col" data-dock="true">
        <div className="npTabs">
          {tabs.map((t, i) => (
            <div key={t.id} className={"npTab " + (i === ti ? "on" : "")} onClick={() => setTi(i)}>
              <span>{t.name}{t.saved ? "" : " •"}</span>
              <b onClick={(e) => closeTab(i, e)}>×</b>
            </div>
          ))}
          <button type="button" className="npAdd" onClick={addTab}>+</button>
        </div>
        <div className="npMenu">
          {["File", "Edit", "View"].map((m) => (
            <button key={m} type="button" onClick={() => setMenu(menu === m ? null : m)}>{m}</button>
          ))}
          {menu === "File" && (
            <div className="npDrop">
              <button type="button" onClick={() => { addTab(); setMenu(null); }}>New tab</button>
              <button type="button" onClick={() => { openSaved(); setMenu(null); }}>Open</button>
              <button type="button" onClick={() => { save(); setMenu(null); }}>Save</button>
              <button type="button" onClick={() => { save({ ...doc, name: "Untitled.txt" }); setMenu(null); }}>Save as</button>
              <button type="button" onClick={() => { dispatch({ type: wnapp.action, payload: "close" }); setMenu(null); }}>Exit</button>
            </div>
          )}
          {menu === "Edit" && (
            <div className="npDrop" style={{ left: 44 }}>
              <button type="button" onClick={() => { document.execCommand("undo"); setMenu(null); }}>Undo</button>
              <button type="button" onClick={() => { setFindOpen(true); setMenu(null); }}>Find</button>
              <button type="button" onClick={() => { ta.current?.select(); setMenu(null); }}>Select all</button>
            </div>
          )}
          {menu === "View" && (
            <div className="npDrop" style={{ left: 84 }}>
              <button type="button" onClick={() => { setWrap((v) => !v); setMenu(null); }}>Word wrap {wrap ? "✓" : ""}</button>
              <button type="button" onClick={() => { setZoom((z) => Math.min(200, z + 10)); setMenu(null); }}>Zoom in</button>
              <button type="button" onClick={() => { setZoom((z) => Math.max(50, z - 10)); setMenu(null); }}>Zoom out</button>
              <button type="button" onClick={() => { setZoom(100); setMenu(null); }}>Restore default zoom</button>
            </div>
          )}
        </div>
        {findOpen && (
          <div className="npFind">
            <input value={find} onChange={(e) => setFind(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doFind()} placeholder="Find" />
            <button type="button" onClick={doFind}>Find next</button>
            <button type="button" onClick={() => setFindOpen(false)}>×</button>
          </div>
        )}
        <div className="restWindow h-full flex-grow">
          <textarea
            ref={ta}
            className="noteText win11Scroll"
            style={{ fontSize: (14 * zoom) / 100, whiteSpace: wrap ? "pre-wrap" : "pre" }}
            value={doc.text}
            onChange={(e) => patch({ text: e.target.value })}
            spellCheck={false}
            onClick={() => setMenu(null)}
          />
        </div>
        <div className="npStatus">
          <span>Ln {stats.line}, Col {stats.col}</span>
          <span>{zoom}%</span>
          <span>Windows (CRLF)</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
