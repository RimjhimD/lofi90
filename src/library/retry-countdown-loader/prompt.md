Build a React + TypeScript + Tailwind "Retry Countdown Loader" for work that can fail and should be retried with growing waits (SMS sends, webhooks, API calls). No extra libraries.

Props (typed): task (async function given the attempt number; throw to fail that try), label, maxAttempts (default 5), baseDelayMs (default 1000, doubles after each failure), maxDelayMs (default 30000), onSuccess, onGiveUp, previewState ("running" | "waiting" | "server-wait" | "offline" | "success" | "failed" | "cancelled" — render one state without running anything) and className. Export a RetryAfterError class (message + retryAfterMs); any thrown error with a numeric retryAfterMs is honoured instead of the computed wait.

Behaviour:
- Start on mount. After a failure wait min(maxDelayMs, baseDelayMs × 2^(n−1)), or the server's retryAfterMs, then try again; give up after maxAttempts.
- Draw the backoff to scale: a row of numbered attempt markers (✕ failed, ✓ worked, pulsing red = in progress) joined by gaps whose width is proportional to the wait they stand for, labelled 1s 2s 4s 8s. The current gap fills as the countdown runs; a server-requested wait fills in amber.
- Status line in role="status": "Try 2 of 5…", "Didn't work. Next try in 3.4s.", "The server asked us to wait…", "Done on try 3.", "Gave up after 5 tries." plus the last error message.
- Buttons: Retry now and Cancel while waiting; Start over after giving up or cancelling.
- Watch online/offline (useSyncExternalStore): while offline the countdown freezes and says so, then resumes.
- Ignore results from a run that was cancelled or restarted.

Look: switchboard style — white card, 2px #1A1A17 border, hard 4px shadow, signal red #D7263D for progress, bottle green #0E3B2E for success, amber #A86A00 for server waits, bone #E8E2D2 empty track, mono numbers. aria-busy while trying, visible focus, respects prefers-reduced-motion (no pulsing), works at 375 px.
