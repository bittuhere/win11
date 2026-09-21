import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Icon, ToolBar } from "../../../utils/general";
import { useTranslation } from "react-i18next";

export const Camera = () => {
  const wnapp = useSelector((state) => state.apps.camera);
  const hide = useSelector((state) => state.apps.camera.hide);
  const [stream, setStream] = useState(null);
  const { t } = useTranslation();

  const capture = async () => {
    var video = document.querySelector("video");
    var canvas = document.querySelector("canvas");
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var df = video.videoWidth - video.videoHeight;

    canvas
      .getContext("2d")
      .drawImage(video, -df / 2, 0, video.videoWidth + df, video.videoHeight);

    try {
      const { idb, uid } = await import("../../../utils/idb");
      await idb.put("photos", {
        id: uid("cam"),
        name: "Camera " + new Date().toLocaleTimeString(),
        dataUrl: canvas.toDataURL("image/png"),
        at: Date.now(),
      });
    } catch (e) {}
  };

  useEffect(() => {
    let local = null;
    if (!wnapp.hide && wnapp.alive) {
      var video = document.getElementById("camvideo");
      if (!video) return;
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", "");

      navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then((dstream) => {
        local = dstream;
        setStream(dstream);
        video.srcObject = dstream;
      }).catch(() => {});
    }
    return () => {
      if (local) local.getTracks().forEach((track) => track.stop());
      if (stream != null) stream.getTracks().forEach((track) => track.stop());
    };
  }, [hide, wnapp.alive]);

  return (
    <div
      className="wnCam floatTab dpShad"
      data-size={wnapp.size}
      id={wnapp.icon + "App"}
      data-max={wnapp.max}
      style={{
        ...(wnapp.size == "cstm" ? wnapp.dim : null),
        zIndex: wnapp.z,
      }}
      data-hide={wnapp.hide}
    >
      <ToolBar
        app={wnapp.action}
        icon={wnapp.icon}
        size={wnapp.size}
        name="Camera"
        invert
        bg="#060606"
      />
      <div className="windowScreen flex flex-col" data-dock="true">
        <div className="restWindow flex-grow flex flex-col">
          <div className="camcont">
            <div className="camctrl">
              <div
                className="cmicon"
                title={t("camera.take-photo")}
                onClick={capture}
              >
                <Icon icon="camera" />
              </div>
              <canvas id="camcanvas"></canvas>
            </div>
            <div className="vidcont">
              <div className="vidwrap">
                <video id="camvideo"></video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
