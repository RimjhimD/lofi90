"use client";

import { useEffect, useState } from "react";
import { PolaroidCard } from "@/library/polaroid-card/PolaroidCard";

type Photo = { id: string; url: string; thumbs: string; width: number; height: number; alt: string; title: string; takenAt: string; blur?: string };

// An album grid. width/height come from the API so each card reserves its space before the photo arrives.
export function AlbumGrid({ albumId }: { albumId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cover, setCover] = useState<string | null>(null);

  useEffect(() => {
    // Abort when the album changes, so a slow old response can't overwrite the new album.
    const ctrl = new AbortController();
    fetch(`/api/albums/${albumId}/photos`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Photos request failed: ${r.status}`);
        return r.json() as Promise<Photo[]>;
      })
      .then(setPhotos)
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
    return () => ctrl.abort();
  }, [albumId]);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
      {photos.map((p) => (
        <PolaroidCard
          key={p.id}
          src={p.url}
          srcSet={p.thumbs}
          sizes="(max-width: 600px) 50vw, 240px"
          width={p.width}
          height={p.height}
          alt={p.alt}
          blurDataURL={p.blur}
          caption={p.title}
          date={new Date(p.takenAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          selected={cover === p.id}
          onSelect={async (on) => {
            const before = cover;
            setCover(on ? p.id : null);
            const res = await fetch(`/api/albums/${albumId}/cover`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photoId: on ? p.id : null }),
            });
            if (!res.ok) setCover(before); // put the tape back where it was
          }}
          onError={({ src, attempt }) => console.error("photo failed", src, attempt)}
        />
      ))}
    </div>
  );
}
