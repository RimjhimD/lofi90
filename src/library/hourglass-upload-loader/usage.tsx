"use client";

import { useEffect, useRef, useState } from "react";
import { HourglassUploadLoader, type UploadStatus } from "@/library/hourglass-upload-loader/HourglassUploadLoader";

// The hourglass only shows the truth; this component does the uploading. It sends the file with XHR
// (fetch has no upload progress), pauses with abort(), and resumes from the byte the server confirmed.
// Your server needs a resumable endpoint: HEAD returns Upload-Offset, PATCH appends from that offset.
export function VideoUpload({ file, uploadUrl }: { file: File; uploadUrl: string }) {
  const [loaded, setLoaded] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  /** The user wants it running (not paused, cancelled or failed). */
  const wanted = useRef(false);
  /** The attempt in flight: its id, plus a way to stop its HEAD request and its XHR. */
  const attempt = useRef<{ id: number; head: AbortController; xhr: XMLHttpRequest | null } | null>(null);
  const nextId = useRef(0);
  const resume = useRef<() => void>(() => {});

  function stop() {
    attempt.current?.head.abort();
    attempt.current?.xhr?.abort();
    attempt.current = null;
  }

  async function send() {
    wanted.current = true;
    if (attempt.current) return; // one upload at a time: a double Resume or an online event mid-send does nothing
    if (!navigator.onLine) return setStatus("offline");
    const run = { id: ++nextId.current, head: new AbortController(), xhr: null as XMLHttpRequest | null };
    attempt.current = run;
    const current = () => attempt.current?.id === run.id && wanted.current;
    setError("");
    setStatus("uploading");

    let offset = 0;
    try {
      const head = await fetch(uploadUrl, { method: "HEAD", signal: run.head.signal });
      if (!head.ok) throw new Error(`Server said ${head.status}.`);
      offset = Number(head.headers.get("Upload-Offset") ?? 0);
    } catch (err) {
      if (!current()) return; // paused or cancelled while asking: stay quiet
      attempt.current = null;
      if (navigator.onLine) fail(err instanceof Error ? err.message : "Couldn't reach the server.");
      else setStatus("offline");
      return;
    }
    if (!current()) return; // paused or cancelled during the HEAD request: don't start the PATCH

    const req = new XMLHttpRequest();
    run.xhr = req;
    req.open("PATCH", uploadUrl);
    req.setRequestHeader("Upload-Offset", String(offset));
    req.upload.onprogress = (e) => {
      if (current()) setLoaded(offset + e.loaded);
    };
    req.onload = () => {
      if (!current()) return;
      attempt.current = null;
      if (req.status < 300) {
        wanted.current = false;
        setStatus("done");
      } else fail(`Server said ${req.status}.`);
    };
    req.onerror = () => {
      if (!current()) return;
      attempt.current = null;
      if (navigator.onLine) fail("The upload was interrupted.");
      else setStatus("offline"); // still wanted: the online listener carries on
    };
    req.send(file.slice(offset));
  }

  function fail(message: string) {
    wanted.current = false;
    setError(message);
    setStatus("error");
  }
  function pause() {
    wanted.current = false;
    stop();
    setStatus("paused");
  }

  useEffect(() => {
    resume.current = () => void send();
  });

  // Lost the connection: stop and say so. Back online: carry on by itself if it was running.
  useEffect(() => {
    const off = () => {
      if (!wanted.current) return;
      stop();
      setStatus("offline");
    };
    const on = () => {
      if (wanted.current) resume.current();
    };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
      wanted.current = false;
      stop();
    };
  }, []);

  return (
    <div>
      {status === "idle" && <button onClick={() => void send()}>Upload {file.name}</button>}
      <HourglassUploadLoader
        fileName={file.name}
        loaded={loaded}
        total={file.size}
        status={status}
        errorMessage={error}
        onPause={pause}
        onResume={() => void send()}
        onRetry={() => void send()}
        onCancel={() => {
          pause();
          void fetch(uploadUrl, { method: "DELETE" });
          setLoaded(0);
          setStatus("idle");
        }}
      />
    </div>
  );
}
