import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ToolBar } from "../../../utils/general";
import { installApp } from "../../../actions";
import {
  getUser,
  fsList,
  fsRead,
  fsWrite,
  fsEnsureDir,
  fsRm,
  joinPath,
  parentPath,
  idb,
} from "../../../utils/idb";

export const WnTerminal = () => {
  const wnapp = useSelector((state) => state.apps.terminal);
  const person = useSelector((state) => state.setting.person.name);
  const [user, setUser] = useState(person || "User");
  const [stack, setStack] = useState([]);
  const [pwd, setPwd] = useState("C:\\Users\\User");
  const [lastCmd, setLsc] = useState(0);
  const [wntitle, setWntitle] = useState("Terminal");
  const inited = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    getUser().then((u) => {
      const name = u?.username || person || "User";
      setUser(name);
      if (!inited.current) {
        setPwd(`C:\\Users\\${name}`);
        setStack([
          `Microsoft Windows [Version 10.0.22621.2428]`,
          `(c) Microsoft Corporation. All rights reserved.`,
          ``,
        ]);
        inited.current = true;
      }
    });
  }, [person]);

  let IpDetails = [];
  const getIPDetails = async () => {
    try {
      await fetch("https://ipapi.co/json")
        .then((response) => response.json())
        .then((data) => {
          IpDetails.push(data);
        });
    } catch (error) {
      IpDetails.push({
        ip: "__network_error",
        network: "__kindly check internet connection",
        city: "",
        region: "",
        org: "",
        postal: "",
      });
    }
  };

  const cmdTool = async (cmd) => {
    var tmpStack = [...stack];
    tmpStack.push(pwd + ">" + cmd);
    var raw = cmd.trim();
    var arr = raw.split(" ");
    var type = (arr[0] || "").trim().toLowerCase();
    var arg = arr.splice(1).join(" ").trim();

    const push = (...lines) => tmpStack.push(...lines);

    if (type == "echo") {
      const redir = arg.split(">");
      if (redir.length > 1) {
        const text = redir[0].replace(/^"|"$/g, "").trim();
        const file = redir.slice(1).join(">").replace(/^>/, "").trim();
        const path = joinPath(pwd, file);
        await fsWrite(path, text);
        push(`Wrote ${path}`);
      } else if (arg.length) push(arg);
      else push("ECHO is on.");
    } else if (type == "mkdir" || type == "md") {
      if (!arg) push("The syntax of the command is incorrect.");
      else {
        await fsEnsureDir(joinPath(pwd, arg));
        push(`Created directory ${arg}`);
      }
    } else if (type == "del" || type == "rm" || type == "erase") {
      if (!arg) push("The syntax of the command is incorrect.");
      else {
        await fsRm(joinPath(pwd, arg));
        push(`Deleted ${arg}`);
      }
    } else if (type == "install") {
      if (arg.length) {
        push("Installing app...");
        var parts = arg.split(" ");
        installApp({
          name: parts[0],
          icon: parts[2] || "img/icon/store.png",
          type: "app",
          data: { type: "IFrame", url: parts[1], invert: true },
        });
        push("App installed.");
      } else push("INSTALL <name> <url> [icon]");
    } else if (type == "cd") {
      if (!arg) push(pwd);
      else if (arg == ".") {
        /* stay */
      } else {
        const next = arg == ".." ? parentPath(pwd) : joinPath(pwd, arg);
        const rec = await fsRead(next);
        const kids = rec ? null : await fsList(next);
        if (rec && rec.type == "dir") setPwd(next);
        else if (next == "C:\\" || next == "C:") setPwd("C:\\");
        else if (kids && (rec || kids.length || arg == "..")) setPwd(next);
        else {
          await fsEnsureDir(next);
          setPwd(next);
        }
      }
    } else if (type == "dir" || type == "ls") {
      push(" Directory of " + pwd, "");
      push("<DIR>    .");
      push("<DIR>    ..");
      const tdir = await fsList(pwd);
      for (const f of tdir) {
        push((f.type == "dir" ? "<DIR>    " : "         ") + f.name);
      }
      if (!tdir.length) push("         (empty — try mkdir docs)");
    } else if (type == "type" || type == "cat") {
      if (!arg) push("The syntax of the command is incorrect.");
      else {
        const rec = await fsRead(joinPath(pwd, arg));
        if (!rec || rec.type != "file") push("The system cannot find the file specified.");
        else push(...String(rec.content || "").split("\n"));
      }
    } else if (type == "cls") {
      tmpStack = [];
    } else if (type == "color") {
      let color = "#FFFFFF";
      let background = "#000000";
      let re = /^[A-Fa-f0-9]+$/g;
      if (!arg || (arg.length < 3 && re.test(arg))) {
        if (arg.length == 2) {
          color = colorCode(arg[1]);
          background = colorCode(arg[0]);
        } else if (arg.length == 1) {
          color = colorCode(arg[0]);
        }
        var cmdcont = document.getElementById("cmdcont");
        if (cmdcont) {
          cmdcont.style.backgroundColor = background;
          cmdcont.style.color = color;
        }
      } else {
        push("COLOR [attr]  — 0-F background then foreground. Example: COLOR 0a");
      }
    } else if (type == "start") {
      dispatch({ type: "EDGELINK", payload: arg });
    } else if (type == "date") {
      push("The current date is: " + new Date().toLocaleDateString());
    } else if (type == "time") {
      push("The current time is: " + new Date().toLocaleTimeString());
    } else if (type == "exit") {
      tmpStack = [];
      dispatch({ type: wnapp.action, payload: "close" });
    } else if (type == "title") {
      setWntitle(arg.length ? arg : "Terminal");
    } else if (type == "hostname" || type == "whoami") {
      push(user);
    } else if (type == "ver") {
      push("Microsoft Windows [Version 10.0.22621.2428]");
    } else if (type == "systeminfo") {
      [
        `Host Name:                 ${user.toUpperCase()}`,
        `OS Name:                   Microsoft Windows 11 WebOS`,
        `OS Version:                10.0.22621 N/A Build 22621`,
        `Registered Owner:          ${user}`,
        `System Type:               x64-based PC`,
        `Storage:                   IndexedDB (WebOS internal)`,
      ].forEach((l) => push(l));
    } else if (type == "help") {
      [
        "CD          Change directory",
        "CLS         Clear screen",
        "COLOR       Set console colors",
        "DATE        Display date",
        "DEL         Delete a file",
        "DIR         List directory",
        "ECHO        Display a message. echo hi > file.txt writes a file",
        "EXIT        Quit Terminal",
        "HELP        This list",
        "INSTALL     INSTALL name url [icon]",
        "MKDIR       Create a directory",
        "START       Open a URL in Edge",
        "SYSTEMINFO  PC details",
        "TIME        Display time",
        "TITLE       Set window title",
        "TYPE        Show a text file",
        "VER         Windows version",
        "WHOAMI      Current user",
        "TASKLIST    Running apps",
        "RESET-SETUP Wipe account and run OOBE next launch",
      ].forEach((l) => push(l));
    } else if (type == "tasklist") {
      const apps = Object.values(storeApps(dispatch)).filter((a) => a && a.hide === false);
      push("Image Name                     PID");
      push("=========================        =====");
      push(`${user}.exe                      1000`);
      push("explorer.exe                     4");
    } else if (type == "ipconfig") {
      const IP = IpDetails[0] || {};
      push("Windows IP Configuration", "", "IPv4 Address. . . . . . . . . : " + (IP.ip || "10.0.0.2"));
    } else if (type == "reset-setup") {
      await idb.del("user");
      await idb.set("seeded", false);
      push("Account cleared. Reload the page to run setup again.");
    } else if (type == "notepad") {
      dispatch({ type: "NOTEPAD", payload: "full" });
    } else if (type == "") {
    } else {
      push(`'${type}' is not recognized as an internal or external command,`);
      push("operable program or batch file.");
      push("");
      push('Type "help" for available commands');
    }

    if (type.length > 0) tmpStack.push("");
    setStack(tmpStack);
  };

  const storeApps = () => ({});

  const colorCode = (color) => {
    const map = {
      0: "#000000",
      1: "#0000AA",
      2: "#00AA00",
      3: "#00AAAA",
      4: "#AA0000",
      5: "#AA00AA",
      6: "#AA5500",
      7: "#AAAAAA",
      8: "#555555",
      9: "#5555FF",
      A: "#55FF55",
      B: "#55FFFF",
      C: "#FF5555",
      D: "#FF55FF",
      E: "#FFFF55",
      F: "#FFFFFF",
    };
    return map[String(color).toUpperCase()] || "#000000";
  };

  const action = (event) => {
    var cmdline = document.getElementById("curcmd");
    var actionName = event.target.dataset.action;

    if (cmdline) {
      if (actionName == "hover") {
        var crline = cmdline.parentNode;
        var cmdcont = document.getElementById("cmdcont");
        if (crline && cmdcont) {
          cmdcont.scrollTop = crline.offsetTop;
        }
        cmdline.focus();
      } else if (actionName == "enter") {
        if (event.key == "Enter") {
          event.preventDefault();
          var tmpStack = [...stack];
          var cmd = event.target.innerText.trim();
          event.target.innerText = "";
          setLsc(tmpStack.length + 1);
          cmdTool(cmd);
        } else if (event.key == "ArrowUp" || event.key == "ArrowDown") {
          event.preventDefault();
          var i = lastCmd + [1, -1][Number(event.key == "ArrowUp")];
          while (i >= 0 && i < stack.length) {
            if (stack[i].startsWith("C:\\") && stack[i].includes(">")) {
              var tp = stack[i].split(">");
              event.target.innerText = tp.slice(1).join(">") || "";
              setLsc(i);
              break;
            }
            i += [1, -1][Number(event.key == "ArrowUp")];
          }
          cmdline.focus();
        } else if (event.key == "Tab") {
          event.preventDefault();
        }
      }
      cmdline.focus();
    }
  };

  useEffect(() => {
    getIPDetails();
    if (wnapp.dir && wnapp.dir != pwd) {
      setPwd(wnapp.dir);
      dispatch({ type: "OPENTERM", payload: null });
    }
  }, [wnapp.dir]);

  return (
    <div
      className="wnterm floatTab dpShad"
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
        name={wntitle}
        invert
        bg="#060606"
      />
      <div className="windowScreen flex" data-dock="true">
        <div className="restWindow h-full flex-grow text-gray-100">
          <div
            className="cmdcont w-full box-border overflow-y-scroll win11Scroll prtclk"
            id="cmdcont"
            onMouseOver={action}
            onClick={action}
            data-action="hover"
          >
            <div className="w-full h-max pb-12">
              {stack.map((x, i) => (
                <pre key={i} className="cmdLine">
                  {x}
                </pre>
              ))}
              <div className="cmdLine actmd">
                {pwd}&gt;
                <div
                  className="ipcmd"
                  id="curcmd"
                  contentEditable
                  data-action="enter"
                  onKeyDown={action}
                  spellCheck="false"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
