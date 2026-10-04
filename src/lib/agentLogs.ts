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
  /** The prompt as I gave it (lightly tidied for spelling). */
  prompt: string;
  /** Heading for the prompt box when it is a summary rather than my exact words. */
  promptLabel?: string;
  workflow: string[];
  produced: string[];
  saved: string;
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
    promptLabel: "The brief (summarised)",
    prompt:
      "The bot takes messages but nothing reaches the CRM. Fix the tools so messages and email requests save to the contact, and make the tool descriptions clear enough that the bot uses them the right way. Do it yourself.",
    workflow: [
      "Read the bot's prompt and tool list: its rules said to save messages with update_user_details, which only writes name, phone and email — every message was going nowhere.",
      "Created two extraction tools, one field each, and wrote their descriptions the way bots follow best: when to run, a worked “save exactly this” example, NOT-clauses naming the wrong output (no summaries like “caller wants to leave a message”), and what to do when there's nothing to save. Overwrite turned on so a caller's correction sticks.",
      "Edited only the four save rules in the prompt to call the new tools, kept a backup, diffed before and after, and stayed under the 8,000-character limit.",
      "Built the tags and three alert workflows the tools trigger, published them and read them back through the API.",
    ],
    produced: [
      "Two extraction tools with clear, testable descriptions, each mapped to its own contact field.",
      "Prompt save rules fixed, with nothing else changed (checked by diff).",
      "Three alert workflows live, so the right person hears about each message. A real test call is the next check.",
    ],
    saved: "Messages that were silently lost now have a path to the CRM and to the person who needs them, and the description pattern is reusable for every bot after this one.",
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
    promptLabel: "The brief (summarised)",
    prompt:
      "The book-a-call buttons on the funnel go to the client's website. Embed our GHL booking calendar on the funnel page instead, so people book without leaving, and set the timezone the client asked for.",
    workflow: [
      "Found that the whole page is one Custom Code block, and that the funnel builder runs inside a cross-origin frame that normal page tools can't read.",
      "Reached the builder's frame directly from the automated browser and edited the code in place.",
      "Pointed every booking button to a new on-page #book section and embedded the GHL calendar there through a custom value, so the calendar can be swapped later without touching the page.",
      "Checked the live preview: no links left to the old site, both buttons scroll to the calendar, and the calendar loads. Then set the account timezone to America/New_York through the API.",
    ],
    produced: [
      "An inline booking calendar on the funnel page.",
      "Zero booking links left pointing off-site.",
      "Account timezone corrected and confirmed by the API.",
    ],
    saved: "Visitors book without leaving the page, and changing the calendar later is one custom value instead of a page edit.",
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
    prompt:
      "Can we change the Rolodex carousel to something else? I'm not understanding what this carousel is doing — do something more animated. Instead of the secret key field, use a navbar, a unique navbar. The split the bill card, use another component, find something unique. Let's do total six for now.",
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
    prompt:
      "Why, when I go to the home page, I can't scroll — I scroll a bit and it starts going to the components. Why is it going automatically? It's coming to the Undo Fuse Button. Fix that, no one wants that.",
    workflow: [
      "Traced it to the live previews on the gallery cards: the fuse preview presses its own button on a timer.",
      "Found that the scripted click bubbled up to the card's link — and only fired once the card scrolled into view.",
      "Stopped scripted clicks at the edge of every preview.",
      "Verified both ways: an automated slow scroll stayed on the home page, and a real click on a card still opened it.",
    ],
    produced: ["A fix in one helper plus the five live-state files.", "A regression check for both the bug and normal card clicks."],
    saved: "The bug only happened as a card came into view, so it was hard to catch by eye. The agent found the cause from the code and proved the fix instead of guessing.",
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
    prompt:
      "The 375, 768, full button is not even working. A preview should look like a proper preview, nothing else that makes it look like a mess. There should also be a light room — the component showing in a dark stage and in a light stage.",
    workflow: [
      "Studied how a clean preview looks on a reference gallery, without copying it.",
      "Rebuilt the stage so the frame itself resizes, with a ruler that reads the real pixel width.",
      "Moved every component's colours onto stage variables so one switch flips dark and light.",
      "Screenshot-checked every component at 375, 768 and full width, on both stages, in an automated browser.",
    ],
    produced: [
      "A working 375 / 768 / Full switch with a live pixel ruler.",
      "A dark and a light stage for every component.",
      "Controls moved into a Customize drawer so the preview shows only the component.",
    ],
    saved: "Dozens of resize-and-look checks done and repeated after each change, instead of by hand.",
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
    prompt: "Why does View on GitHub say 404? And now deploy to Vercel — I think this is the final.",
    workflow: [
      "Diagnosed the 404: the links pointed to files that only existed on my computer — 21 commits had never been pushed.",
      "Checked before publishing: fast-forward only (21 ahead, 0 behind), every commit in my name, and a scan of the changes for anything key-shaped.",
      "Pushed to main; Vercel deployed automatically.",
      "Polled the live site until every page returned 200, opened it, and confirmed a GitHub file link works.",
    ],
    produced: ["lofi90.vercel.app live with all six components.", "Working GitHub links on every component page.", "A deploy verified page by page."],
    saved: "A careful release checklist done in a few minutes, so nothing unsafe went public and nothing was left broken.",
  },
];

export const findLog = (slug: string) => AGENT_LOGS.find((l) => l.slug === slug);
