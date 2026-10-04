"use client";

import { useState } from "react";
import { TapeMeasureInput } from "@/library/tape-measure-input/TapeMeasureInput";

// onChange runs live while the tape moves (cheap things: redraw, local price). onSettle runs once
// the person lets go, so that's where the slow work goes, like asking the server for a quote.
export function CurtainWidthField() {
  const [width, setWidth] = useState(140);
  const [quote, setQuote] = useState<string>();

  return (
    <form>
      <TapeMeasureInput
        label="Curtain width"
        value={width}
        onChange={setWidth}
        onSettle={async (w) => {
          const res = await fetch(`/api/quote?width=${w}`);
          setQuote((await res.json()).total);
        }}
        min={60}
        max={300}
        step={5}
        unit="cm"
      />
      <input type="hidden" name="width" value={width} />
      {quote && <p>Made to measure: {quote}</p>}
    </form>
  );
}
