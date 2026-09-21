import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToolBar } from "../../../utils/general";
import { idb, uid, getUser, fsList, fsWrite } from "../../../utils/idb";
import "./extras.scss";

function WinApp({ id, title, invert, bg, children, className = "" }) {
  const wnapp = useSelector((s) => s.apps[id]);
  if (!wnapp || !wnapp.alive) return null;
  return (
    <div
      className={`floatTab dpShad extraApp ${className}`}
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{ ...(wnapp.size == "cstm" ? wnapp.dim : null), zIndex: wnapp.z }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar app={wnapp.action} icon={wnapp.icon} size={wnapp.size} name={title} invert={invert} bg={bg} />
      <div className="windowScreen flex flex-col" data-dock="true">
        <div className="restWindow flex-grow overflow-hidden extraFill">{children}</div>
      </div>
    </div>
  );
}

function useStore(name, initial = []) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    idb.getAll(name).then((r) => setItems(r || [])).catch(() => {});
  }, [name]);
  const save = async (rec) => {
    await idb.put(name, rec);
    setItems(await idb.getAll(name));
  };
  const remove = async (key) => {
    await idb.deleteFrom(name, key);
    setItems(await idb.getAll(name));
  };
  return [items, save, remove, setItems];
}

export const CalendarApp = () => {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [picked, setPicked] = useState(now.toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [events, save] = useStore("events");
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, i) => (i < first ? null : i - first + 1));
  const onDay = (d) => {
    if (!d) return;
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setPicked(iso);
  };
  const add = async () => {
    if (!title.trim()) return;
    await save({ id: uid("ev"), date: picked, title: title.trim() });
    setTitle("");
  };
  return (
    <WinApp id="calendar" title="Calendar">
      <div className="winPad">
        <div className="winRow" style={{ justifyContent: "space-between" }}>
          <h2 className="winH">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
          <div className="winRow">
            <button className="winBtn ghost" onClick={() => setCursor(new Date(y, m - 1, 1))}>Back</button>
            <button className="winBtn ghost" onClick={() => setCursor(new Date(y, m + 1, 1))}>Next</button>
          </div>
        </div>
        <div className="calGrid" style={{ marginBottom: 6, fontSize: 11, color: "var(--sat-txt)" }}>
          {"SMTWTFS".split("").map((d, i) => <div key={i}>{["S","M","T","W","T","F","S"][i]}</div>)}
        </div>
        <div className="calGrid">
          {cells.map((d, i) => {
            const iso = d ? `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
            const evs = events.filter((e) => e.date === iso);
            return (
              <div key={i} className={`calCell ${iso === picked ? "on" : ""}`} onClick={() => onDay(d)}>
                <div className="n">{d || ""}</div>
                {evs.slice(0, 2).map((e) => <div className="ev" key={e.id}>{e.title}</div>)}
              </div>
            );
          })}
        </div>
        <div className="winRow" style={{ marginTop: 14 }}>
          <input className="winInput" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Event on ${picked}`} />
          <button className="winBtn" onClick={add}>Add</button>
        </div>
      </div>
    </WinApp>
  );
};

const COLORS = ["#fff475", "#fdcfe8", "#d7aefb", "#cbf0f8", "#ccff90"];
export const StickyNotes = () => {
  const [notes, save, remove] = useStore("notes");
  const add = () => save({ id: uid("note"), text: "", color: COLORS[notes.length % COLORS.length], at: Date.now() });
  return (
    <WinApp id="notes" title="Sticky Notes">
      <div className="winPad">
        <div className="winRow" style={{ marginBottom: 12 }}>
          <h2 className="winH" style={{ margin: 0 }}>Sticky Notes</h2>
          <button className="winBtn" onClick={add}>New note</button>
        </div>
        <div className="noteBoard">
          {notes.map((n) => (
            <div key={n.id} className="sticky" style={{ background: n.color }}>
              <div className="stickyBar">
                <span>Note</span>
                <button className="winBtn ghost" onClick={() => remove(n.id)}>Close</button>
              </div>
              <textarea
                value={n.text}
                placeholder="Take a note..."
                onChange={(e) => save({ ...n, text: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </WinApp>
  );
};

export const TodoApp = () => {
  const [items, save, remove] = useStore("todos");
  const [text, setText] = useState("");
  const add = async () => {
    if (!text.trim()) return;
    await save({ id: uid("td"), text: text.trim(), done: false });
    setText("");
  };
  return (
    <WinApp id="todo" title="Microsoft To Do">
      <div className="winPad">
        <h2 className="winH">My Day</h2>
        <div className="winRow">
          <input className="winInput" style={{ flex: 1 }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a task" />
          <button className="winBtn" onClick={add}>Add</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {items.map((t) => (
            <div key={t.id} className={`todoItem ${t.done ? "done" : ""}`}>
              <input type="checkbox" checked={!!t.done} onChange={() => save({ ...t, done: !t.done })} />
              <span style={{ flex: 1 }}>{t.text}</span>
              <button className="winBtn ghost" onClick={() => remove(t.id)}>Delete</button>
            </div>
          ))}
          {items.length === 0 && <div className="winMuted">You're all caught up.</div>}
        </div>
      </div>
    </WinApp>
  );
};

export const MailApp = ({ id = "mail", title = "Mail" }) => {
  const [items, save] = useStore("mail");
  const [sel, setSel] = useState(null);
  const [to, setTo] = useState("");
  const [sub, setSub] = useState("");
  const [body, setBody] = useState("");
  const [compose, setCompose] = useState(false);
  useEffect(() => {
    if (id !== "mail") return;
    if (items.length) return;
    const seed = [
      { id: uid("mail"), from: "WebOS", to: "you", subject: "Welcome to Mail", body: "Your inbox lives in IndexedDB. Compose a message — it stays on this PC.", at: Date.now() - 3600000, inbox: true },
      { id: uid("mail"), from: "Microsoft Store", to: "you", subject: "Apps are ready", body: "Open Microsoft Store to install Paint, VS Code, Wikipedia and games.", at: Date.now() - 7200000, inbox: true },
    ];
    seed.forEach(save);
  }, [items.length, id]);
  const send = async () => {
    await save({ id: uid("mail"), from: "Me", to, subject: sub, body, at: Date.now(), inbox: false });
    setCompose(false); setTo(""); setSub(""); setBody("");
  };
  const view = items.filter((m) => m.inbox !== false);
  const cur = view.find((m) => m.id === sel) || view[0];
  return (
    <WinApp id={id} title={title}>
      <div className="mailList">
        <div className="mailSide">
          <div className="winPad winRow">
            <button className="winBtn" onClick={() => setCompose(true)}>New mail</button>
          </div>
          {view.map((m) => (
            <div key={m.id} className={`mailRow ${cur?.id === m.id ? "on" : ""}`} onClick={() => { setSel(m.id); setCompose(false); }}>
              <b>{m.subject}</b>
              <div className="winMuted">{m.from}</div>
            </div>
          ))}
        </div>
        <div className="mailBody">
          {compose ? (
            <>
              <h2 className="winH">New message</h2>
              <input className="winInput" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
              <input className="winInput" placeholder="Subject" value={sub} onChange={(e) => setSub(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
              <textarea className="winArea" value={body} onChange={(e) => setBody(e.target.value)} />
              <button className="winBtn" style={{ marginTop: 8 }} onClick={send}>Send</button>
            </>
          ) : cur ? (
            <>
              <h2 className="winH">{cur.subject}</h2>
              <div className="winMuted">{cur.from} · {new Date(cur.at).toLocaleString()}</div>
              <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{cur.body}</p>
            </>
          ) : null}
        </div>
      </div>
    </WinApp>
  );
};

export const PhotosApp = () => {
  const [shots, save] = useStore("photos");
  const [open, setOpen] = useState(null);
  const builtins = ["img/gallery1.jpg", "img/gallery2.jpg", "img/gallery3.jpg", "img/wallpaper/default/img0.jpg"];
  return (
    <WinApp id="photos" title="Photos">
      <div className="winPad">
        <h2 className="winH">Photos</h2>
        <p className="winMuted">Pictures on this PC, plus captures from Camera and Paint.</p>
        <div className="photoGrid">
          {builtins.map((src) => (
            <img key={src} src={src} alt="" onClick={() => setOpen(src)} />
          ))}
          {shots.map((p) => (
            <img key={p.id} src={p.dataUrl} alt={p.name} onClick={() => setOpen(p.dataUrl)} />
          ))}
        </div>
        {open && (
          <div className="redirMask" onClick={() => setOpen(null)}>
            <img src={open} alt="" style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: 8 }} />
          </div>
        )}
      </div>
    </WinApp>
  );
};

export const WeatherApp = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const load = async (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      setData(await res.json());
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => load(p.coords.latitude, p.coords.longitude).catch(() => setErr("Could not reach weather service.")),
        () => load(25.5941, 85.1376).catch(() => setErr("Could not reach weather service.")),
      );
    } else {
      load(25.5941, 85.1376).catch(() => setErr("Could not reach weather service."));
    }
  }, []);
  const cw = data?.current_weather;
  return (
    <WinApp id="weather" title="Weather">
      <div className="winPad">
        <div className="wxHero">
          <div className="winMuted" style={{ color: "rgba(255,255,255,0.8)" }}>Today</div>
          <div style={{ fontSize: 48, fontWeight: 300 }}>{cw ? Math.round(cw.temperature) + "°" : "—"}</div>
          <div>Wind {cw ? Math.round(cw.windspeed) + " km/h" : ""}</div>
        </div>
        {err && <div className="winMuted">{err}</div>}
        <div className="wxDays">
          {(data?.daily?.time || []).slice(0, 7).map((t, i) => (
            <div className="wxDay" key={t}>
              <div className="winMuted">{new Date(t).toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{Math.round(data.daily.temperature_2m_max[i])}°</div>
              <div className="winMuted">{Math.round(data.daily.temperature_2m_min[i])}°</div>
            </div>
          ))}
        </div>
      </div>
    </WinApp>
  );
};

export const ClockApp = () => {
  const [tab, setTab] = useState("clock");
  const [now, setNow] = useState(new Date());
  const [ms, setMs] = useState(0);
  const [run, setRun] = useState(false);
  const [timer, setTimer] = useState(60);
  const [left, setLeft] = useState(0);
  const [alarms, save, remove] = useStore("alarms");
  const [ah, setAh] = useState("07");
  const [am, setAm] = useState("00");
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setMs((x) => x + 10), 10);
    return () => clearInterval(t);
  }, [run]);
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [left > 0]);
  const fmt = (n) => {
    const m = Math.floor(n / 60000);
    const s = Math.floor((n % 60000) / 1000);
    const cs = Math.floor((n % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  return (
    <WinApp id="alarm" title="Clock">
      <div className="winPad">
        <div className="clkTabs">
          {["clock", "alarm", "stopwatch", "timer"].map((t) => (
            <button key={t} className="winBtn ghost" data-on={tab === t} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === "clock" && <div className="clkBig">{now.toLocaleTimeString()}</div>}
        {tab === "stopwatch" && (
          <>
            <div className="clkBig">{fmt(ms)}</div>
            <div className="winRow">
              <button className="winBtn" onClick={() => setRun((v) => !v)}>{run ? "Pause" : "Start"}</button>
              <button className="winBtn ghost" onClick={() => { setRun(false); setMs(0); }}>Reset</button>
            </div>
          </>
        )}
        {tab === "timer" && (
          <>
            <div className="clkBig">{left || timer}s</div>
            <div className="winRow">
              <input className="winInput" type="number" value={timer} onChange={(e) => setTimer(+e.target.value)} />
              <button className="winBtn" onClick={() => setLeft(timer)}>Start</button>
            </div>
          </>
        )}
        {tab === "alarm" && (
          <>
            <div className="winRow">
              <input className="winInput" value={ah} onChange={(e) => setAh(e.target.value)} style={{ width: 64 }} />
              :
              <input className="winInput" value={am} onChange={(e) => setAm(e.target.value)} style={{ width: 64 }} />
              <button className="winBtn" onClick={() => save({ id: uid("al"), time: `${ah}:${am}`, on: true })}>Add alarm</button>
            </div>
            {alarms.map((a) => (
              <div key={a.id} className="todoItem">
                <b>{a.time}</b>
                <span style={{ flex: 1 }}>{a.on ? "On" : "Off"}</span>
                <button className="winBtn ghost" onClick={() => remove(a.id)}>Delete</button>
              </div>
            ))}
          </>
        )}
      </div>
    </WinApp>
  );
};

export const MapsApp = () => (
  <WinApp id="maps" title="Maps">
    <iframe
      title="maps"
      className="w-full h-full"
      style={{ border: 0, width: "100%", height: "100%" }}
      src="https://www.openstreetmap.org/export/embed.html?bbox=85.05,25.55,85.22,25.68&layer=mapnik"
    />
  </WinApp>
);

export const NewsApp = () => {
  const stories = [
    { t: "WebOS now stores everything in IndexedDB", s: "Your files, notes and apps survive a refresh." },
    { t: "Microsoft Store rebuilt", s: "Install, open and uninstall for real. Add your own iframe app." },
    { t: "Edge stays inside the OS", s: "Google, Bing and video search no longer spawn extra tabs." },
    { t: "A lock screen that actually locks", s: "The password you created during setup is required to sign in." },
  ];
  return (
    <WinApp id="news" title="News">
      <div className="winPad">
        <h2 className="winH">Today</h2>
        {stories.map((n) => (
          <div key={n.t} className="peopleCard">
            <div>
              <b>{n.t}</b>
              <div className="winMuted">{n.s}</div>
            </div>
          </div>
        ))}
      </div>
    </WinApp>
  );
};

export const PaintApp = () => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(4);
  const pos = useRef({ x: 0, y: 0 });
  const get = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e) => { drawing.current = true; pos.current = get(e); };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const p = get(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pos.current.x, pos.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    pos.current = p;
  };
  const savePhoto = async () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    await idb.put("photos", { id: uid("ph"), name: "Painting", dataUrl, at: Date.now() });
  };
  const clear = () => {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
  };
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = c.parentElement.clientWidth;
    c.height = Math.max(320, c.parentElement.clientHeight - 48);
  }, []);
  return (
    <WinApp id="paint" title="Paint">
      <div className="paintWrap">
        <div className="paintBar">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <input type="range" min="1" max="24" value={size} onChange={(e) => setSize(+e.target.value)} />
          <button className="winBtn ghost" onClick={clear}>Clear</button>
          <button className="winBtn" onClick={savePhoto}>Save to Photos</button>
        </div>
        <canvas ref={canvasRef} onMouseDown={down} onMouseMove={move} onMouseUp={() => (drawing.current = false)} onMouseLeave={() => (drawing.current = false)} />
      </div>
    </WinApp>
  );
};

export const SecurityApp = () => {
  const [scan, setScan] = useState("idle");
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (scan !== "run") return;
    setPct(0);
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) { clearInterval(t); setScan("done"); return 100; }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(t);
  }, [scan]);
  return (
    <WinApp id="security" title="Windows Security">
      <div className="winPad">
        <div className="secHero">
          <svg className="secOk" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="34" fill="#107c10" />
            <path d="M20 37l10 10 22-24" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <div>
            <h2 className="winH">You're protected</h2>
            <p className="winMuted">Virus & threat protection is on. Firewall is on. This PC is using IndexedDB isolation.</p>
          </div>
        </div>
        <div className="winRow" style={{ marginTop: 16 }}>
          <button className="winBtn" onClick={() => setScan("run")} disabled={scan === "run"}>Quick scan</button>
          {scan === "run" && <span>{pct}%</span>}
          {scan === "done" && <span>No threats found.</span>}
        </div>
      </div>
    </WinApp>
  );
};

export const SnippingApp = () => {
  const [shot, setShot] = useState(null);
  const canvasRef = useRef(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const c = canvasRef.current;
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext("2d").drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      setShot(c.toDataURL("image/png"));
    } catch (e) {}
  };
  const save = async () => {
    if (!shot) return;
    await idb.put("photos", { id: uid("snip"), name: "Snip", dataUrl: shot, at: Date.now() });
  };
  return (
    <WinApp id="snip" title="Snipping Tool">
      <div className="snipStage winPad">
        <div className="winRow">
          <button className="winBtn" onClick={start}>New</button>
          <button className="winBtn ghost" onClick={save} disabled={!shot}>Save to Photos</button>
        </div>
        <canvas ref={canvasRef} style={{ marginTop: 12, maxWidth: "100%" }} />
      </div>
    </WinApp>
  );
};

export const VoiceApp = () => {
  const [recs, save, remove] = useStore("recordings");
  const [rec, setRec] = useState(null);
  const chunks = useRef([]);
  useEffect(() => {
    return () => {
      try {
        rec && rec.state !== "inactive" && rec.stop();
      } catch (e) {}
    };
  }, [rec]);
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunks.current = [];
    mr.ondataavailable = (e) => chunks.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const dataUrl = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(blob);
      });
      await save({ id: uid("rec"), name: "Recording " + new Date().toLocaleTimeString(), dataUrl, at: Date.now() });
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    setRec(mr);
  };
  return (
    <WinApp id="voice" title="Voice Recorder">
      <div className="winPad">
        <div className="winRow">
          {rec ? (
            <button className="winBtn" onClick={() => { rec.stop(); setRec(null); }}>Stop</button>
          ) : (
            <button className="winBtn" onClick={start}>Record</button>
          )}
        </div>
        <div className="voiceList" style={{ marginTop: 16 }}>
          {recs.map((r) => (
            <div key={r.id} className="peopleCard">
              <div style={{ flex: 1 }}>
                <b>{r.name}</b>
                <audio src={r.dataUrl} controls style={{ width: "100%", marginTop: 6 }} />
              </div>
              <button className="winBtn ghost" onClick={() => remove(r.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </WinApp>
  );
};

export const PeopleApp = () => {
  const [list, save, remove] = useStore("contacts");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  return (
    <WinApp id="people" title="People">
      <div className="winPad">
        <h2 className="winH">Contacts</h2>
        <div className="winRow">
          <input className="winInput" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="winInput" placeholder="Email" value={mail} onChange={(e) => setMail(e.target.value)} />
          <button className="winBtn" onClick={() => { if (!name.trim()) return; save({ id: uid("c"), name, mail }); setName(""); setMail(""); }}>Add</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {list.map((c) => (
            <div key={c.id} className="peopleCard">
              <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#0067c0" /><circle cx="18" cy="14" r="6" fill="#fff" /><path d="M8 32c2-8 6-10 10-10s8 2 10 10" fill="#fff" /></svg>
              <div style={{ flex: 1 }}><b>{c.name}</b><div className="winMuted">{c.mail}</div></div>
              <button className="winBtn ghost" onClick={() => remove(c.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </WinApp>
  );
};

export const TipsApp = () => {
  const tips = [
    { t: "Start menu", d: "Click the Windows logo or press the Windows key to open Start." },
    { t: "Lock this PC", d: "Use Power in Start, or just refresh — returning users hit the lock screen." },
    { t: "Microsoft Store", d: "Press Get on any catalog app. To add your own, open Store → plus icon, or edit storeCatalog.json." },
    { t: "Terminal", d: "Your files live in IndexedDB. Try dir, mkdir, echo hello > file.txt, type file.txt." },
    { t: "Edge", d: "google.com rewrites to the embeddable Google homepage. New tabs are blocked." },
  ];
  const [i, setI] = useState(0);
  return (
    <WinApp id="tips" title="Tips">
      <div className="winPad">
        <div className="tipsCard">
          <div className="winMuted">Tip {i + 1} of {tips.length}</div>
          <h2 className="winH">{tips[i].t}</h2>
          <p>{tips[i].d}</p>
          <div className="winRow">
            <button className="winBtn ghost" onClick={() => setI((x) => (x + tips.length - 1) % tips.length)}>Back</button>
            <button className="winBtn" onClick={() => setI((x) => (x + 1) % tips.length)}>Next</button>
          </div>
        </div>
      </div>
    </WinApp>
  );
};

export const FeedbackApp = () => {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const send = async () => {
    await idb.put("kv", { key: "feedback-" + Date.now(), value: text });
    setSent(true);
  };
  return (
    <WinApp id="feedback" title="Feedback Hub">
      <div className="winPad">
        <h2 className="winH">Send feedback</h2>
        <textarea className="winArea" value={text} onChange={(e) => setText(e.target.value)} placeholder="What could be better?" />
        <button className="winBtn" style={{ marginTop: 8 }} onClick={send}>Submit</button>
        {sent && <p className="winMuted">Saved on this PC.</p>}
      </div>
    </WinApp>
  );
};

export const GrooveApp = () => {
  const [src, setSrc] = useState("");
  const [name, setName] = useState("No track");
  return (
    <WinApp id="groove" title="Groove Music" invert bg="#111" className="">
      <div className="winPad" style={{ color: "#eee" }}>
        <h2 className="winH">Groove Music</h2>
        <p className="winMuted">Open an audio file from this device.</p>
        <input type="file" accept="audio/*" onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setName(f.name);
          setSrc(URL.createObjectURL(f));
        }} />
        <div style={{ marginTop: 24 }}>
          <b>{name}</b>
          {src && <audio src={src} controls style={{ width: "100%", marginTop: 12 }} />}
        </div>
      </div>
    </WinApp>
  );
};

export const MoviesApp = () => (
  <WinApp id="movies" title="Movies & TV">
    <iframe
      title="movies"
      className="w-full h-full"
      style={{ border: 0, width: "100%", height: "100%" }}
      src="https://www.bing.com/videos/search?q=nature+wildlife+documentary"
    />
  </WinApp>
);

export const XboxApp = () => {
  const dispatch = useDispatch();
  return (
    <WinApp id="xbox" title="Xbox" invert bg="#0e0e10">
      <div className="xboxShell">
        <h2 className="winH">Xbox</h2>
        <p className="winMuted">Jump into games from the Microsoft Store.</p>
        <div className="winRow" style={{ marginTop: 16 }}>
          <button className="winBtn" onClick={() => dispatch({ type: "WNSTORE", payload: "full" })}>Open Store</button>
        </div>
      </div>
    </WinApp>
  );
};

export const OfficeApp = () => {
  const dispatch = useDispatch();
  const tiles = [
    { n: "Word", c: "#2b579a", u: "https://www.office.com/launch/word" },
    { n: "Excel", c: "#217346", u: "https://www.office.com/launch/excel" },
    { n: "PowerPoint", c: "#d24726", u: "https://www.office.com/launch/powerpoint" },
    { n: "Outlook", c: "#0078d4", u: "https://outlook.live.com" },
  ];
  return (
    <WinApp id="msoffice" title="Office">
      <div className="winPad">
        <h2 className="winH">Microsoft 365</h2>
        <div className="officeGrid">
          {tiles.map((t) => (
            <div key={t.n} className="officeTile" style={{ background: t.c }} onClick={() => dispatch({ type: "EDGELINK", payload: t.u })}>
              {t.n}
            </div>
          ))}
        </div>
      </div>
    </WinApp>
  );
};

export const NarratorApp = () => {
  const [text, setText] = useState("Welcome to WebOS. Narrator will read this aloud.");
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  return (
    <WinApp id="narrator" title="Narrator">
      <div className="winPad">
        <h2 className="winH">Narrator</h2>
        <textarea className="winArea" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="winRow" style={{ marginTop: 8 }}>
          <button className="winBtn" onClick={speak}>Read</button>
          <button className="winBtn ghost" onClick={() => speechSynthesis.cancel()}>Stop</button>
        </div>
      </div>
    </WinApp>
  );
};

function ChatShell({ id, title, bot }) {
  const [lines, setLines] = useState([{ from: "them", text: bot.hello }]);
  const [v, setV] = useState("");
  const send = () => {
    if (!v.trim()) return;
    const next = [...lines, { from: "me", text: v.trim() }, { from: "them", text: bot.reply(v.trim()) }];
    setLines(next);
    setV("");
  };
  return (
    <WinApp id={id} title={title}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="chatLog">
          {lines.map((l, i) => <div key={i} className={`bubble ${l.from}`}>{l.text}</div>)}
        </div>
        <div className="winRow" style={{ padding: 8 }}>
          <input className="winInput" style={{ flex: 1 }} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="winBtn" onClick={send}>Send</button>
        </div>
      </div>
    </WinApp>
  );
}

export const CortanaApp = () => (
  <ChatShell id="cortana" title="Cortana" bot={{
    hello: "Hi. I can open apps by name, tell the time, or explain WebOS.",
    reply: (q) => {
      const s = q.toLowerCase();
      if (s.includes("time")) return "It is " + new Date().toLocaleTimeString();
      if (s.includes("who")) return "I'm Cortana, running locally inside WebOS.";
      if (s.includes("store")) return "Open Microsoft Store from the taskbar to install apps.";
      return "I stored that thought. Try asking for the time, or about the Store.";
    },
  }} />
);
export const TeamsApp = () => (
  <ChatShell id="teams" title="Teams" bot={{ hello: "Teams is ready. Say hi to the room.", reply: () => "Got it — posted to General." }} />
);
export const SkypeApp = () => (
  <ChatShell id="skype" title="Skype" bot={{ hello: "Skype preview. Type a message.", reply: (q) => "Delivered: " + q }} />
);
export const YammerApp = () => (
  <ChatShell id="yammer" title="Yammer" bot={{ hello: "Your community feed.", reply: () => "Published to the network." }} />
);

export const OneDriveApp = () => {
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState("User");
  useEffect(() => {
    getUser().then((u) => {
      const name = u?.username || "User";
      setUser(name);
      fsList(`C:\\Users\\${name}\\Documents`).then(setFiles).catch(() => {});
    });
  }, []);
  return (
    <WinApp id="oneDrive" title="OneDrive">
      <div className="winPad">
        <h2 className="winH">OneDrive — {user}</h2>
        <p className="winMuted">Files in your Documents folder (IndexedDB).</p>
        {files.map((f) => (
          <div key={f.path} className="todoItem"><span>{f.name}</span><span className="winMuted">{f.type}</span></div>
        ))}
        {files.length === 0 && <div className="winMuted">Nothing synced yet.</div>}
      </div>
    </WinApp>
  );
};

export const OneNoteApp = () => {
  const [text, setText] = useState("");
  useEffect(() => { idb.get("onenote").then((t) => t && setText(t)); }, []);
  return (
    <WinApp id="onenote" title="OneNote">
      <div className="winPad" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <h2 className="winH">Quick notes</h2>
        <textarea className="winArea" style={{ flex: 1 }} value={text} onChange={(e) => { setText(e.target.value); idb.set("onenote", e.target.value); }} />
      </div>
    </WinApp>
  );
};

export const OutlookApp = () => <MailApp id="outlook" title="Outlook" />;

export const SharepointApp = () => (
  <WinApp id="share" title="SharePoint">
    <div className="winPad">
      <h2 className="winH">SharePoint</h2>
      <p>Team site for this PC. Documents you save in Explorer show up through IndexedDB.</p>
    </div>
  </WinApp>
);

export const YourPhoneApp = () => (
  <WinApp id="yphone" title="Your Phone">
    <div className="winPad">
      <h2 className="winH">Link your phone</h2>
      <p className="winMuted">This is a browser OS, so pairing is simulated. Notifications would appear here.</p>
      <button className="winBtn">Ready to link</button>
    </div>
  </WinApp>
);

export const RecycleApp = () => {
  const [bin, setBin] = useState([]);
  useEffect(() => { idb.get("recycle").then((x) => setBin(x || [])); }, []);
  return (
    <WinApp id="bin0" title="Recycle Bin">
      <div className="winPad">
        <h2 className="winH">Recycle Bin</h2>
        {bin.length === 0 && <p className="winMuted">The Recycle Bin is empty.</p>}
        {bin.map((f) => <div key={f.path} className="todoItem">{f.name}</div>)}
        <button className="winBtn ghost" onClick={async () => { await idb.set("recycle", []); setBin([]); }}>Empty Recycle Bin</button>
      </div>
    </WinApp>
  );
};


