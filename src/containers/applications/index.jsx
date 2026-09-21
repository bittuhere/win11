import React from "react";
import { useSelector } from "react-redux";
import "./tabs.scss";
import "./tabs2.scss";
import "./wnapp.scss";

export * from "./apps/about";
export * from "./apps/calculator";
export * from "./apps/camera";
export * from "./apps/discord";
export * from "./apps/edge";
export * from "./apps/explorer";
export * from "./apps/getstarted";
export * from "./apps/notepad";
export * from "./apps/settings";
export * from "./apps/spotify";
export * from "./apps/store";
export * from "./apps/taskmanager";
export * from "./apps/terminal";
export * from "./apps/whiteboard";
export * from "./apps/extras";

import { AboutWin } from "./apps/about";
import { Calculator } from "./apps/calculator";
import { Camera } from "./apps/camera";
import { DScord } from "./apps/discord";
import { EdgeMenu } from "./apps/edge";
import { Explorer } from "./apps/explorer";
import { Getstarted } from "./apps/getstarted";
import { Notepad } from "./apps/notepad";
import { Settings } from "./apps/settings";
import { Spotify } from "./apps/spotify";
import { MicroStore } from "./apps/store";
import { Taskmanager } from "./apps/taskmanager";
import { WnTerminal } from "./apps/terminal";
import { WhiteBoard } from "./apps/whiteboard";
import {
  CalendarApp,
  ClockApp,
  CortanaApp,
  FeedbackApp,
  GrooveApp,
  MailApp,
  MapsApp,
  MoviesApp,
  NarratorApp,
  NewsApp,
  OfficeApp,
  OneDriveApp,
  OneNoteApp,
  OutlookApp,
  PaintApp,
  PeopleApp,
  PhotosApp,
  RecycleApp,
  SecurityApp,
  SharepointApp,
  SkypeApp,
  SnippingApp,
  StickyNotes,
  TeamsApp,
  TipsApp,
  TodoApp,
  VoiceApp,
  WeatherApp,
  XboxApp,
  YammerApp,
  YourPhoneApp,
} from "./apps/extras";

export const WINDOW_APPS = [
  { icon: "settings", Comp: Settings },
  { icon: "taskmanager", Comp: Taskmanager },
  { icon: "explorer", Comp: Explorer },
  { icon: "edge", Comp: EdgeMenu },
  { icon: "store", Comp: MicroStore },
  { icon: "bin0", Comp: RecycleApp },
  { icon: "alarm", Comp: ClockApp },
  { icon: "calculator", Comp: Calculator },
  { icon: "calendar", Comp: CalendarApp },
  { icon: "camera", Comp: Camera },
  { icon: "yphone", Comp: YourPhoneApp },
  { icon: "feedback", Comp: FeedbackApp },
  { icon: "getstarted", Comp: Getstarted },
  { icon: "groove", Comp: GrooveApp },
  { icon: "yammer", Comp: YammerApp },
  { icon: "mail", Comp: MailApp },
  { icon: "movies", Comp: MoviesApp },
  { icon: "xbox", Comp: XboxApp },
  { icon: "msoffice", Comp: OfficeApp },
  { icon: "narrator", Comp: NarratorApp },
  { icon: "news", Comp: NewsApp },
  { icon: "notepad", Comp: Notepad },
  { icon: "notes", Comp: StickyNotes },
  { icon: "oneDrive", Comp: OneDriveApp },
  { icon: "onenote", Comp: OneNoteApp },
  { icon: "outlook", Comp: OutlookApp },
  { icon: "people", Comp: PeopleApp },
  { icon: "photos", Comp: PhotosApp },
  { icon: "paint", Comp: PaintApp },
  { icon: "security", Comp: SecurityApp },
  { icon: "spotify", Comp: Spotify },
  { icon: "share", Comp: SharepointApp },
  { icon: "skype", Comp: SkypeApp },
  { icon: "snip", Comp: SnippingApp },
  { icon: "teams", Comp: TeamsApp },
  { icon: "terminal", Comp: WnTerminal },
  { icon: "tips", Comp: TipsApp },
  { icon: "todo", Comp: TodoApp },
  { icon: "maps", Comp: MapsApp },
  { icon: "voice", Comp: VoiceApp },
  { icon: "weather", Comp: WeatherApp },
  { icon: "board", Comp: WhiteBoard },
  { icon: "cortana", Comp: CortanaApp },
  { icon: "discord", Comp: DScord },
];

export { AboutWin };

export const ScreenPreview = () => {
  const tasks = useSelector((state) => state.taskbar);

  return (
    <div className="prevCont" style={{ left: tasks.prevPos + "%" }}>
      <div className="prevScreen" id="prevApp" data-show={tasks.prev && false}>
        <div id="prevsc"></div>
      </div>
    </div>
  );
};
