"use client";

import { useState } from "react";
import { UrlSlugInput, type SlugValue } from "@/library/url-slug-input/UrlSlugInput";

// The server says whether a slug is free. Pass the signal on, so an outdated check is cancelled.
async function slugIsFree(slug: string, signal: AbortSignal) {
  const res = await fetch(`/api/posts/slug-available?slug=${encodeURIComponent(slug)}`, { signal });
  if (!res.ok) throw new Error("Check failed");
  const { available } = (await res.json()) as { available: boolean };
  return available;
}

export function EditPostForm({ post }: { post: { id: string; title: string; slug: string; published: boolean } }) {
  const [value, setValue] = useState<SlugValue | null>(null);

  return (
    <form action={`/api/posts/${post.id}`} method="post" className="space-y-4">
      <UrlSlugInput
        prefix="mysite.com/blog/"
        defaultValue={{ title: post.title, slug: post.slug, locked: !post.published }}
        published={post.published}
        originalSlug={post.slug}
        checkAvailability={slugIsFree}
        names={{ title: "title", slug: "slug", redirect: "addRedirect" }}
        onChange={setValue}
      />
      <button type="submit" disabled={value?.available === false}>
        Save
      </button>
    </form>
  );
}
