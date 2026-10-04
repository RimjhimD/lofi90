/** Agent logs: one real task done with an AI agent, each a different kind of task. */
export interface AgentLog {
  slug: string;
  no: string;
  kind: "Prompting" | "Integration" | "Build" | "Debug" | "QA" | "Release";
  title: string;
  summary: string;
  date: string;
  agent: string;
  tools: string[];
  task: string;
  /** The full prompt: my request written out as clear, reusable instructions. */
  prompt: string;
  workflow: string[];
  produced: string[];
  saved: string;
  /** What this taught me about prompting. */
  lesson: string;
  /** Where to see the result, when it is public. */
  links?: { label: string; href: string }[];
}

const AGENT = "Claude Code (Claude Opus)";

export const AGENT_LOGS: AgentLog[] = [
  {
    slug: "bot-tool-descriptions",
    no: "01",
    kind: "Prompting",
    title: "Make a voice bot's tools save what callers actually say",
    summary: "A client's AI receptionist took messages that never reached the CRM. The agent rewired its tools and rewrote their descriptions so the bot saves the caller's own words.",
    date: "2 Oct 2026",
    agent: AGENT,
    tools: ["Assistant tool editor", "GoHighLevel API", "Playwright browser"],
    task: "An AI phone receptionist took messages and email requests for the team, but none of them ever landed on the contact record, so no one was alerted. The bot needed tools that write those details to the right CRM fields, described clearly enough that it uses them properly.",
    prompt: `You are working on an AI phone receptionist built on an assistant platform that is connected to GoHighLevel (GHL). The bot takes messages and email requests from callers, but none of them ever reach the contact record, so nobody on the team is alerted.

Goal: every caller message and email request is saved to the right contact field, and the right person is notified.

Instructions:
1. Read the bot's current prompt and its tool list. Find the instruction that tells the bot how to save messages, and check whether that tool can actually write custom fields.
2. For each piece of information that must be saved, create one extraction tool mapped to one GHL custom field. One tool, one field, one job.
3. Write each tool's description so the bot uses it correctly:
   - when to call it, and when not to;
   - a worked example of exactly what to save, in the caller's own words;
   - NOT-rules that name the wrong output (for example, NOT "caller wants to leave a message");
   - what to do when there is nothing to save.
   Turn on "overwrite existing value" so a caller's correction replaces the first answer.
4. Change only the save rules in the bot's prompt so they call the new tools. Back up the prompt first, diff before and after, and stay under the 8,000-character limit.
5. Create the tags and alert workflows that the tools trigger, publish them, and read them back through the API to confirm.

Rules: do not change anything else in the prompt. Do not publish the assistant yourself; tell me when it is ready to publish.

When you finish, report: the tools you created and their exact descriptions, the prompt diff, the workflows and their status, and what still needs a live test call.`,
    workflow: [
      "Read the bot's prompt and tool list: its rules said to save messages with update_user_details, which only writes name, phone and email — every message was going nowhere.",
      "Created two extraction tools, one field each, and wrote their descriptions the way bots follow best: when to run, a worked “save exactly this” example, NOT-clauses naming the wrong output (no summaries like “caller wants to leave a message”), and what to do when there's nothing to save. Overwrite turned on so a caller's correction sticks.",
      "Edited only the four save rules in the prompt to call the new tools, kept a backup, diffed before and after, and stayed under the 8,000-character limit.",
      "Built the tags and three alert workflows the tools trigger, published them and read them back through the API.",
    ],
    produced: [
      "Two extraction tools with clear, testable descriptions, each mapped to its own contact field.",
      "Prompt save rules fixed, with nothing else changed (checked by diff).",
      "Three alert workflows live, so the right person hears about each message. A real test call is the next check.", "Prompt stayed at 6,214 characters, under the 8,000 limit, with 4 lines changed."],
    saved: "Messages that were silently lost now have a path to the CRM and to the person who needs them, and the description pattern is reusable for every bot after this one.",
    lesson: "A bot follows its tool descriptions more than its prompt. One tool, one field, a worked example and explicit NOT-rules work better than a long rule in the prompt.",
  },
  {
    slug: "funnel-calendar-embed",
    no: "02",
    kind: "Integration",
    title: "Put the booking calendar inside a funnel page",
    summary: "The “Book a call” buttons sent visitors off to another website. Now they scroll to a GoHighLevel calendar embedded right on the page.",
    date: "3 Oct 2026",
    agent: AGENT,
    tools: ["Playwright browser", "GoHighLevel funnel builder", "GoHighLevel API"],
    task: "On a client's GoHighLevel funnel, both booking buttons linked out to the client's own website. Bookings needed to happen on the funnel page itself, in the GHL calendar, in the client's timezone.",
    prompt: `You are working in a GoHighLevel (GHL) sub-account. The funnel's "Book a call" buttons currently link to the client's own website, so visitors leave the page to book.

Goal: visitors book a call directly on the funnel page, using the GHL booking calendar, in the client's timezone (America/New_York).

Instructions:
1. Open the funnel page in the builder and work out how it is built (sections or a single Custom Code block).
2. Point every booking button to a new on-page section with the id "book" instead of the external link.
3. In that section, embed the GHL booking calendar as an iframe with the GHL form-embed script. Use the custom value {{custom_values.sales_booking_calendar}} as the iframe source, so the calendar can be changed later without editing the page.
4. Match the page's existing styling: a short heading, one line of copy, then the calendar.
5. Save the page, then check the live preview: no booking links point off-site, every booking button scrolls to the calendar, and the calendar loads.
6. Set the sub-account timezone to America/New_York through the API, then read it back to confirm.

Rules: change only the booking buttons and the new section; leave the rest of the page as it is. Note the character count before and after the edit.

When you finish, report: what changed on the page, the checks you ran on the live preview, and the timezone before and after.`,
    workflow: [
      "Found that the whole page is one Custom Code block, and that the funnel builder runs inside a cross-origin frame that normal page tools can't read.",
      "Reached the builder's frame directly from the automated browser and edited the code in place.",
      "Pointed every booking button to a new on-page #book section and embedded the GHL calendar there through a custom value, so the calendar can be swapped later without touching the page.",
      "Checked the live preview: no links left to the old site, both buttons scroll to the calendar, and the calendar loads. Then set the account timezone to America/New_York through the API.",
    ],
    produced: [
      "An inline booking calendar on the funnel page.",
      "Zero booking links left pointing off-site.",
      "Account timezone corrected and confirmed by the API.", "Page code went from 7,932 to 8,362 characters; 2 buttons repointed, 0 off-site booking links left; the timezone update returned 200."],
    saved: "Visitors book without leaving the page, and changing the calendar later is one custom value instead of a page edit.",
    lesson: "Point embeds at a custom value instead of a hard-coded URL. The page never has to be edited again when the calendar changes.",
  },
  {
    slug: "parallel-component-build",
    no: "03",
    kind: "Build",
    title: "Build four components at the same time",
    summary: "One brief per component, four sub-agents running in parallel, then one agent wiring them in and testing each in the browser.",
    date: "4 Oct 2026",
    agent: `${AGENT} with 4 sub-agents`,
    tools: ["Sub-agents", "ESLint", "TypeScript", "Playwright browser"],
    task: "Replace three components I didn't like with four new, more visual ones — an input, a navbar, a carousel and a card — and keep the whole site consistent.",
    prompt: `You are working on my component gallery: Next.js (App Router), React, TypeScript and Tailwind CSS. No other packages.

Goal: replace three components I am not happy with — a secret key field, a rolodex carousel and a split-the-bill card — with four new, unique and clearly animated components: one input, one navbar, one carousel and one card. The gallery will then have six components in total.

Instructions:
1. Suggest four ideas for each slot. Each must be unique (not a variation of anything my teammates have built), easy to understand at a glance, and built around one signature motion. Let me pick one per slot before you build.
2. For each picked component, write a detailed brief and give it to its own sub-agent, so all four are built in parallel. Each sub-agent builds the component, a demo, looping live states, a usage example and the build prompt, following the structure and colour variables of the existing components.
3. Every component must work with the keyboard, have correct ARIA, respect reduced motion, look right on both a dark and a light background, and fit a 375px-wide screen.
4. Each sub-agent must pass ESLint and the TypeScript check, and must not edit shared files. It reports back its registry entry and controls instead.
5. Wire all four into the site, remove the three old components, and test each one in the browser at 375, 768 and full width, on the dark and the light stage.

When you finish, report: what each component does, what you tested, anything that looks off, and the commit.`,
    workflow: [
      "The agent gave me four options per slot as a quick multiple-choice. I picked Tape Measure, Plucked String Nav, Vinyl Crate and Boarding Pass.",
      "It wrote one detailed brief per component (patterns to copy, colour rules, motion, accessibility, must fit 375px) and launched four sub-agents at once.",
      "Each sub-agent built 5 files — component, demo, live states, usage, prompt — ran lint and type checks, and reported back its registry entry.",
      "The main agent wired all four in, removed the old three, and tested each one in the browser on the dark and light stage and at 375px.",
    ],
    produced: [
      "4 new components, 20 files, all passing ESLint and TypeScript.",
      "Sub-agents finished in 7 to 14 minutes each, running side by side.",
      "A final lineup of six, each with a live demo, looping live states and its build prompt.",
    ],
    saved: "Four components built side by side instead of one after another: about 40 minutes from picking ideas to all four working on the site.",
    lesson: "Parallel agents need one tight brief each and a rule not to touch shared files. Wiring everything together and testing stays with one agent.",
    links: [{ label: "See the six components", href: "https://lofi90.vercel.app/components" }, { label: "Repo", href: "https://github.com/RimjhimD/lofi90" }],
  },
  {
    slug: "home-page-jump-bug",
    no: "04",
    kind: "Debug",
    title: "Fix a home page that scrolled away by itself",
    summary: "The page jumped to a component while I scrolled. The agent traced it to a hidden click and proved the fix with an automated scroll.",
    date: "4 Oct 2026",
    agent: AGENT,
    tools: ["Code reading", "Playwright browser"],
    task: "Scrolling the home page kept opening the Undo Fuse Button page on its own.",
    prompt: `Bug in my Next.js component gallery: when I scroll the home page, it jumps to the Undo Fuse Button page on its own, before I can read the "Shipped so far" section. Nobody clicked anything.

Goal: find the real cause, fix it, and prove the fix.

Instructions:
1. Reproduce it: load the home page and scroll slowly through the gallery. Note when the jump happens and which page opens.
2. Find the root cause in the code before changing anything. Look at what runs on the gallery cards as they scroll into view: live previews, timers, scripted clicks and links.
3. Fix the cause, not the symptom. Do not remove the live previews.
4. Verify both ways:
   - an automated slow scroll through the whole home page stays on "/";
   - a real click on a gallery card still opens that component's page.
5. Run ESLint and the TypeScript check.

When you finish, explain in plain words why it happened, what you changed, and the test results. Then commit.`,
    workflow: [
      "Traced it to the live previews on the gallery cards: the fuse preview presses its own button on a timer.",
      "Found that the scripted click bubbled up to the card's link — and only fired once the card scrolled into view.",
      "Stopped scripted clicks at the edge of every preview.",
      "Verified both ways: an automated slow scroll stayed on the home page, and a real click on a card still opened it.",
    ],
    produced: ["A fix in one helper plus the five live-state files.", "A regression check for both the bug and normal card clicks.", "Checked with a 14-step automated scroll through the whole page: it stayed on the home page every time."],
    saved: "The bug only happened as a card came into view, so it was hard to catch by eye. The agent found the cause from the code and proved the fix instead of guessing.",
    lesson: "Ask the agent to find the cause before fixing anything, and to prove the fix both ways: the bug is gone and normal clicks still work.",
    links: [{ label: "Home page", href: "https://lofi90.vercel.app/" }],
  },
  {
    slug: "preview-stage-qa",
    no: "05",
    kind: "QA",
    title: "Make the preview honest at every size and on light",
    summary: "The 375 / 768 buttons didn't visibly work and components broke on a light background. Rebuilt the stage and checked every component.",
    date: "4 Oct 2026",
    agent: AGENT,
    tools: ["Playwright browser", "CSS variables"],
    task: "The width buttons looked broken, previews felt cluttered, and components had no light-background version.",
    prompt: `My component pages need a clean, working preview. Right now the 375 / 768 / Full buttons don't visibly change anything, the preview area is cluttered with extra panels, and the components only look right on a dark background.

Goal: the preview shows only the component, really resizes, and can be viewed on a dark or a light stage.

Instructions:
1. Look at a well-made component gallery for what a clean preview feels like, but design our own version in our style. Do not copy it.
2. Rebuild the preview as one framed stage. The 375 / 768 / Full buttons must resize the stage itself, with a ruler above it that shows the real pixel width.
3. Add a Dark stage / Light stage switch. Move every component's colours onto stage variables, so one switch flips them and everything stays readable.
4. Move the controls into a closed "Customize" drawer under the preview, and keep only a one-line caption under the stage.
5. Check every component at 375, 768 and full width, on both stages, with screenshots, and fix anything that breaks.

When you finish, report what changed, show before and after screenshots, and list anything that still looks off.`,
    workflow: [
      "Studied how a clean preview looks on a reference gallery, without copying it.",
      "Rebuilt the stage so the frame itself resizes, with a ruler that reads the real pixel width.",
      "Moved every component's colours onto stage variables so one switch flips dark and light.",
      "Screenshot-checked every component at 375, 768 and full width, on both stages, in an automated browser.",
    ],
    produced: [
      "A working 375 / 768 / Full switch with a live pixel ruler.",
      "A dark and a light stage for every component.",
      "Controls moved into a Customize drawer so the preview shows only the component.", "36 checks: 6 components × 3 widths × 2 stages, each with a screenshot."],
    saved: "Dozens of resize-and-look checks done and repeated after each change, instead of by hand.",
    lesson: "Say what “done” looks like — it really resizes, it is readable on both stages — and make the agent check it with screenshots, not by reading code.",
    links: [{ label: "Try a preview", href: "https://lofi90.vercel.app/components/boarding-pass-card" }],
  },
  {
    slug: "release-and-deploy",
    no: "06",
    kind: "Release",
    title: "Fix broken GitHub links and ship safely",
    summary: "Found why “View on GitHub” gave 404, ran a pre-publish checklist, pushed, and confirmed the live site page by page.",
    date: "4 Oct 2026",
    agent: AGENT,
    tools: ["git", "Vercel (auto-deploy)", "curl", "Playwright browser"],
    task: "“View on GitHub” returned 404 on every component, and the finished site needed to go live.",
    prompt: `The "View on GitHub" link on every component page returns a 404, and the finished site needs to go live on Vercel. The Vercel project deploys automatically when main is pushed.

Goal: find out why the links are broken, then publish the site safely and confirm it works.

Instructions:
1. Find the cause of the 404: compare the file paths in the links with what is actually on GitHub, and check whether my local commits have been pushed.
2. Before pushing, check that:
   - the push is a fast-forward (my branch is ahead, not behind);
   - every commit is in my name, with no AI co-author lines;
   - nothing in the changes looks like a key, token or password, and no .env file is included.
   If any check fails, stop and tell me.
3. Push to main and let Vercel deploy.
4. Check the live site until every page returns 200: the home page, the components page and every component page. Then open one "View on GitHub" link to confirm it works.

When you finish, report: why it was a 404, the results of each check, the live URLs, and anything that failed.`,
    workflow: [
      "Diagnosed the 404: the links pointed to files that only existed on my computer — 21 commits had never been pushed.",
      "Checked before publishing: fast-forward only (21 ahead, 0 behind), every commit in my name, and a scan of the changes for anything key-shaped.",
      "Pushed to main; Vercel deployed automatically.",
      "Polled the live site until every page returned 200, opened it, and confirmed a GitHub file link works.",
    ],
    produced: ["lofi90.vercel.app live with all six components.", "Working GitHub links on every component page.", "A deploy verified page by page.", "21 commits pushed, 0 behind, 0 key-shaped strings found; all 8 pages returned 200 on the live site."],
    saved: "A careful release checklist done in a few minutes, so nothing unsafe went public and nothing was left broken.",
    lesson: "Give the agent a stop condition. “If any check fails, stop and tell me” makes a push safe to hand over.",
    links: [{ label: "Live site", href: "https://lofi90.vercel.app" }, { label: "Repo", href: "https://github.com/RimjhimD/lofi90" }],
  },
];

export const findLog = (slug: string) => AGENT_LOGS.find((l) => l.slug === slug);
