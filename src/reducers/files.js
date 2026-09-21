import { Bin } from "../utils/bin";
import fdata from "./dir.json";

const defState = {
  cdir: "%user%",
  hist: [],
  hid: 0,
  view: 1,
  clip: null,
  selected: null,
};

defState.hist.push(defState.cdir);
defState.data = new Bin();
defState.data.parse(fdata);

const fileReducer = (state = defState, action) => {
  var tmp = { ...state };
  var navHist = false;

  if (action.type === "FILEDIR") {
    tmp.cdir = action.payload;
  } else if (action.type === "FILEPATH") {
    var pathid = tmp.data.parsePath(action.payload);
    if (pathid) tmp.cdir = pathid;
  } else if (action.type === "FILEBACK") {
    var item = tmp.data.getId(tmp.cdir);
    if (item.host) {
      tmp.cdir = item.host.id;
    }
  } else if (action.type === "FILEVIEW") {
    tmp.view = action.payload;
  } else if (action.type === "FILEPREV") {
    tmp.hid--;
    if (tmp.hid < 0) tmp.hid = 0;
    navHist = true;
  } else if (action.type === "FILENEXT") {
    tmp.hid++;
    if (tmp.hid > tmp.hist.length - 1) tmp.hid = tmp.hist.length - 1;
    navHist = true;
  } else if (action.type === "FILESEL") {
    tmp.selected = action.payload;
  } else if (action.type === "FILEMKDIR") {
    tmp.data.addItem(tmp.cdir, { type: "folder", name: action.payload || "New folder" });
  } else if (action.type === "FILEMKFILE") {
    tmp.data.addItem(tmp.cdir, {
      type: "file",
      name: action.payload || "New Text Document.txt",
      data: "",
      info: { icon: "file" },
    });
  } else if (action.type === "FILEDEL") {
    const gone = tmp.data.removeItem(action.payload || tmp.selected);
    if (gone) {
      import("../utils/idb").then(({ idb }) => {
        idb.get("recycle").then((bin) => {
          const list = Array.isArray(bin) ? bin : [];
          list.push({ path: gone.id, name: gone.name, type: gone.type, at: Date.now() });
          idb.set("recycle", list);
        });
      });
    }
    tmp.selected = null;
  } else if (action.type === "FILEREN") {
    const id = action.payload?.id || tmp.selected;
    const name = action.payload?.name;
    if (id && name) tmp.data.renameItem(id, name);
  } else if (action.type === "FILECLIP") {
    tmp.clip = { id: action.payload || tmp.selected, mode: action.mode || "copy" };
  } else if (action.type === "FILEPASTE") {
    if (tmp.clip?.id) {
      const src = tmp.data.getId(tmp.clip.id);
      if (src) {
        tmp.data.addItem(tmp.cdir, {
          type: src.type,
          name: src.name,
          data: src.type === "folder" ? [] : src.data,
          info: src.info,
        });
        if (tmp.clip.mode === "cut") tmp.data.removeItem(src.id);
      }
    }
  }

  if (!navHist && tmp.cdir != tmp.hist[tmp.hid]) {
    tmp.hist.splice(tmp.hid + 1);
    tmp.hist.push(tmp.cdir);
    tmp.hid = tmp.hist.length - 1;
  }

  tmp.cdir = tmp.hist[tmp.hid];
  if (tmp.cdir.includes("%")) {
    if (tmp.data.special[tmp.cdir] != null) {
      tmp.cdir = tmp.data.special[tmp.cdir];
      tmp[tmp.hid] = tmp.cdir;
    }
  }

  tmp.cpath = tmp.data.getPath(tmp.cdir);
  return tmp;
};

export default fileReducer;
