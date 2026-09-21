export const gene_name = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

let installed = JSON.parse(localStorage.getItem("installed") || "[]");

const apps = [
  {
    name: "Start",
    icon: "home",
    type: "action",
    action: "STARTMENU",
  },
  {
    name: "Search",
    icon: "search",
    type: "action",
    action: "SEARCHMENU",
  },
  {
    name: "Widget",
    icon: "widget",
    type: "action",
    action: "WIDGETS",
  },
  {
    name: "Settings",
    icon: "settings",
    type: "app",
    action: "SETTINGS",
  },
  {
    name: "Task Manager",
    icon: "taskmanager",
    type: "app",
    action: "TASKMANAGER",
  },
  {
    name: "File Explorer",
    icon: "explorer",
    type: "app",
    action: "EXPLORER",
  },
  {
    name: "Browser",
    icon: "edge",
    type: "app",
    action: "MSEDGE",
  },
  {
    name: "Buy me a coffee",
    icon: "buyme",
    type: "app",
    action: "EXTERNAL",
    payload: "https://www.buymeacoffee.com/blueedgetechno",
  },
  {
    name: "Store",
    icon: "store",
    type: "app",
    action: "WNSTORE",
  },
  {
    name: "Recycle Bin",
    icon: "bin0",
    type: "app",
    action: "RECYCLEBIN",
  },
  {
    name: "Blue",
    icon: "win/user",
    type: "app",
    action: "EXPLORER",
  },
  {
    name: "Alarms",
    icon: "alarm",
    type: "app",
    action: "ALARMAPP",
  },
  {
    name: "Calculator",
    icon: "calculator",
    type: "app",
    action: "CALCUAPP",
  },
  {
    name: "Calendar",
    icon: "calendar",
    type: "app",
    action: "CALENDARAPP",
  },
  {
    name: "Camera",
    icon: "camera",
    type: "app",
    action: "CAMERA",
  },
  {
    name: "Your Phone",
    icon: "yphone",
    type: "app",
    action: "YPHONEAPP",
  },
  {
    name: "Feedback",
    icon: "feedback",
    type: "app",
    action: "FEEDBACKAPP",
  },
  {
    name: "Get Started",
    icon: "getstarted",
    type: "app",
    action: "OOBE",
  },
  {
    name: "Groove Music",
    icon: "groove",
    type: "app",
    action: "GROOVEAPP",
  },
  {
    name: "Help",
    icon: "help",
    type: "app",
    action: "EXTERNAL",
    payload: "https://support.microsoft.com/windows",
  },
  {
    name: "Yammer",
    icon: "yammer",
    type: "app",
    action: "YAMMERAPP",
  },
  {
    name: "Mail",
    icon: "mail",
    type: "app",
    action: "MAILAPP",
  },
  {
    name: "Movies",
    icon: "movies",
    type: "app",
    action: "MOVIESAPP",
  },
  {
    name: "Xbox",
    icon: "xbox",
    type: "app",
    action: "XBOXAPP",
  },
  {
    name: "Office",
    icon: "msoffice",
    type: "app",
    action: "OFFICEAPP",
  },
  {
    name: "Narrator",
    icon: "narrator",
    type: "app",
    action: "NARRATORAPP",
  },
  {
    name: "News",
    icon: "news",
    type: "app",
    action: "NEWSAPP",
  },
  {
    name: "Notepad",
    icon: "notepad",
    type: "app",
    action: "NOTEPAD",
  },
  {
    name: "Sticky Notes",
    icon: "notes",
    type: "app",
    action: "STICKYAPP",
  },
  {
    name: "OneDrive",
    icon: "oneDrive",
    type: "app",
    action: "ONEDRIVEAPP",
  },
  {
    name: "OneNote",
    icon: "onenote",
    type: "app",
    action: "ONENOTEAPP",
  },
  {
    name: "Outlook",
    icon: "outlook",
    type: "app",
    action: "OUTLOOKAPP",
  },
  {
    name: "People",
    icon: "people",
    type: "app",
    action: "PEOPLEAPP",
  },
  {
    name: "Photos",
    icon: "photos",
    type: "app",
    action: "PHOTOSAPP",
  },
  {
    name: "Paint",
    icon: "paint",
    type: "app",
    action: "PAINTAPP",
  },
  {
    name: "Pinterest",
    icon: "pinterest",
    type: "app",
    action: "EXTERNAL",
    payload: "https://www.pinterest.com/blueedgetechno/",
  },
  {
    name: "Security",
    icon: "security",
    type: "app",
    action: "SECURITYAPP",
  },
  {
    name: "Spotify",
    icon: "spotify",
    type: "app",
    action: "SPOTIFY",
  },
  {
    name: "Sharepoint",
    icon: "share",
    type: "app",
    action: "SHAREAPP",
  },
  {
    name: "Skype",
    icon: "skype",
    type: "app",
    action: "SKYPEAPP",
  },
  {
    name: "Snipping Tool",
    icon: "snip",
    type: "app",
    action: "SNIPAPP",
  },
  {
    name: "Twitter",
    icon: "twitter",
    type: "app",
    action: "EXTERNAL",
    payload: "https://twitter.com/blueedgetechno",
  },
  {
    name: "Teams",
    icon: "teams",
    type: "app",
    action: "TEAMSAPP",
  },
  {
    name: "Terminal",
    icon: "terminal",
    type: "app",
    action: "TERMINAL",
  },
  {
    name: "Tips",
    icon: "tips",
    type: "app",
    action: "TIPSAPP",
  },
  {
    name: "To Do",
    icon: "todo",
    type: "app",
    action: "TODOAPP",
  },
  {
    name: "Maps",
    icon: "maps",
    type: "app",
    action: "MAPSAPP",
  },
  {
    name: "Voice Recorder",
    icon: "voice",
    type: "app",
    action: "VOICEAPP",
  },
  {
    name: "Weather",
    icon: "weather",
    type: "app",
    action: "WEATHERAPP",
  },
  {
    name: "Whiteboard",
    icon: "board",
    type: "app",
    action: "WHITEBOARD",
  },
  {
    name: "Cortana",
    icon: "cortana",
    type: "app",
    action: "CORTANAAPP",
  },
  {
    name: "Github",
    icon: "github",
    type: "app",
    action: "EXTERNAL",
    payload: "https://github.com/blueedgetechno/win11React",
  },
  {
    name: "Unescape",
    icon: "unescape",
    type: "action",
    action: "EXTERNAL",
    payload: "https://blueedge.me/unescape",
  },
  {
    name: "Discord",
    icon: "discord",
    type: "app",
    action: "DISCORD",
  },
];

for (let i = 0; i < installed.length; i++) {
  installed[i].action = gene_name();
  apps.push(installed[i]);
}

export default apps;
