import { allApps } from "../utils";

var dev = "";
if (import.meta.env.MODE == "development") {
  dev = "";
}

const defState = {};
for (var i = 0; i < allApps.length; i++) {
  defState[allApps[i].icon] = Object.assign({}, allApps[i], {
    size: "full",
    hide: true,
    max: null,
    z: 0,
    alive: false,
    closing: false,
    session: 0,
  });

  if (allApps[i].icon == dev) {
    defState[allApps[i].icon].size = "mini";
    defState[allApps[i].icon].hide = false;
    defState[allApps[i].icon].max = true;
    defState[allApps[i].icon].z = 1;
    defState[allApps[i].icon].alive = true;
  }
}

defState.hz = 2;

const openApp = (obj, tmpState) => {
  obj = { ...obj };
  obj.size = obj.size === "cstm" ? "cstm" : "full";
  obj.hide = false;
  obj.max = true;
  obj.alive = true;
  obj.closing = false;
  tmpState.hz += 1;
  obj.z = tmpState.hz;
  return obj;
};

const closeApp = (obj, tmpState) => {
  obj = { ...obj };
  obj.hide = true;
  obj.max = null;
  obj.z = -1;
  obj.alive = true;
  obj.closing = true;
  tmpState.hz = Math.max(2, tmpState.hz - 1);
  return obj;
};

const appReducer = (state = defState, action) => {
  var tmpState = { ...state };
  if (action.type == "APPREAP") {
    const key = action.payload;
    if (tmpState[key] && tmpState[key].closing) {
      tmpState[key] = {
        ...tmpState[key],
        alive: false,
        closing: false,
        hide: true,
        url: null,
        dir: null,
        openDoc: null,
        size: "full",
        dim: null,
        session: (tmpState[key].session || 0) + 1,
      };
    }
    return tmpState;
  } else if (action.type == "EDGELINK") {
    var obj = openApp({ ...tmpState["edge"] }, tmpState);
    if (action.payload && action.payload.startsWith("http")) {
      obj.url = action.payload;
    } else if (action.payload && action.payload.length != 0) {
      obj.url = "search:" + action.payload;
    } else {
      obj.url = null;
    }
    tmpState["edge"] = obj;
    return tmpState;
  } else if (action.type == "OPENTXT") {
    var obj = openApp({ ...tmpState["notepad"] }, tmpState);
    obj.openDoc = action.payload;
    tmpState["notepad"] = obj;
    return tmpState;
  } else if (action.type == "SHOWDSK") {
    var keys = Object.keys(tmpState);

    for (var i = 0; i < keys.length; i++) {
      var obj = tmpState[keys[i]];
      if (obj && obj.hide == false) {
        obj = { ...obj };
        obj.max = false;
        if (obj.z == tmpState.hz) {
          tmpState.hz -= 1;
        }
        obj.z = -1;
        tmpState[keys[i]] = obj;
      }
    }

    return tmpState;
  } else if (action.type == "EXTERNAL") {
    var href = action.payload || "";
    if (String(href).startsWith("mailto:")) {
      window.location.href = href;
      return tmpState;
    }
    var obj = openApp({ ...tmpState["edge"] }, tmpState);
    obj.url = href;
    tmpState["edge"] = obj;
    return tmpState;
  } else if (action.type == "OPENTERM") {
    var obj = openApp({ ...tmpState["terminal"] }, tmpState);
    obj.dir = action.payload;
    tmpState["terminal"] = obj;
    return tmpState;
  } else if (action.type == "ADDAPP") {
    tmpState[action.payload.icon] = {
      ...action.payload,
      size: "full",
      hide: true,
      max: null,
      z: 0,
      alive: false,
      closing: false,
      session: 0,
    };
    return tmpState;
  } else if (action.type == "DELAPP") {
    delete tmpState[action.payload];
    return tmpState;
  } else {
    var keys = Object.keys(state);
    for (var i = 0; i < keys.length; i++) {
      var obj = state[keys[i]];
      if (obj && obj.action == action.type) {
        tmpState = { ...state };
        obj = { ...obj };

        if (action.payload == "full") {
          obj = openApp(obj, tmpState);
        } else if (action.payload == "close") {
          obj = closeApp(obj, tmpState);
        } else if (action.payload == "mxmz") {
          obj.size = ["mini", "full"][obj.size != "full" ? 1 : 0];
          obj.hide = false;
          obj.max = true;
          obj.alive = true;
          obj.closing = false;
          tmpState.hz += 1;
          obj.z = tmpState.hz;
        } else if (action.payload == "togg") {
          if (!obj.alive || obj.hide || obj.closing) {
            obj = openApp(obj, tmpState);
          } else if (obj.z != tmpState.hz) {
            obj.hide = false;
            obj.alive = true;
            obj.closing = false;
            if (!obj.max) {
              tmpState.hz += 1;
              obj.z = tmpState.hz;
              obj.max = true;
            } else {
              obj.z = -1;
              obj.max = false;
            }
          } else {
            obj.max = !obj.max;
            obj.hide = false;
            obj.alive = true;
            obj.closing = false;
            if (obj.max) {
              tmpState.hz += 1;
              obj.z = tmpState.hz;
            } else {
              obj.z = -1;
              tmpState.hz -= 1;
            }
          }
        } else if (action.payload == "mnmz") {
          obj.max = false;
          obj.hide = false;
          obj.alive = true;
          obj.closing = false;
          if (obj.z == tmpState.hz) {
            tmpState.hz -= 1;
          }
          obj.z = -1;
        } else if (action.payload == "resize") {
          obj.size = "cstm";
          obj.hide = false;
          obj.max = true;
          obj.alive = true;
          obj.closing = false;
          if (obj.z != tmpState.hz) tmpState.hz += 1;
          obj.z = tmpState.hz;
          obj.dim = action.dim;
        } else if (action.payload == "front") {
          obj.hide = false;
          obj.max = true;
          obj.alive = true;
          obj.closing = false;
          if (obj.z != tmpState.hz) {
            tmpState.hz += 1;
            obj.z = tmpState.hz;
          }
        }

        tmpState[keys[i]] = obj;
        return tmpState;
      }
    }
  }

  return state;
};

export default appReducer;
