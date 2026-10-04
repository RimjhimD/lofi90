/** Agent logs: one real task done with an AI agent, each a different kind of task. */
export interface AgentLog {
  slug: string;
  no: string;
  kind: "Research" | "Design" | "Build" | "Debug" | "QA" | "Release";
  title: string;
  summary: string;
  date: string;
  agent: string;
  tools: string[];
  task: string;
  /** The prompt as I gave it (lightly tidied for spelling). */
  prompt: string;
  workflow: string[];
  produced: string[];
  saved: string;
}

const AGENT = "Claude Code (Claude Opus)";

export const AGENT_LOGS: AgentLog[] = [
  {
    slug: "team-inventory-research",
    no: "01",
    kind: "Research",
    title: "Map what every teammate already built",
    summary: "Read nine teammates' galleries and turned them into a list of taken ideas, so nothing I build gets rejected as a repeat.",
    date: "4 Oct 2026",
    agent: AGENT,
    tools: ["Built-in browser", "File writing"],
    task: "Before choosing my components I needed to know what everyone on the challenge had already built, because duplicates and slight variations of anyone's earlier component are rejected.",
    prompt:
      "Look at this site — have you seen what they put here? And see their components. […] Merge tag input already exists. Have you not seen Shinzuu's work, how unique each button and form is? Do something like that, that does not match with mine but brings out unique components.",
    workflow: [
      "Opened each teammate's gallery in the browser and read every component page.",
      "Grouped what is taken by type: buttons, inputs, forms, loaders, cards, sections, navbars, modals, tables.",
      "Saved it as a team inventory with a rule: re-check this list before every build.",
      "Checked every new idea against the list before suggesting it to me.",
    ],
    produced: [
      "A team inventory of 9 galleries: who built what, how many, and their theme.",
      "A taken-concepts list across 9 component types.",
      "Two of my own ideas dropped early because they already existed on the team (a merge tag input and an orbit loader).",
    ],
    saved: "Hours of clicking through other people's sites by hand, and components that would have been rejected as repeats.",
  },
  {
    slug: "site-design-mockups",
    no: "02",
    kind: "Design",
    title: "Find the site's look with 31 clickable mockups",
    summary: "Instead of describing styles, the agent built each direction as a real page and opened them one by one until I could choose.",
    date: "4 Oct 2026",
    agent: AGENT,
    tools: ["HTML mockups", "Chrome"],
    task: "Pick a visual direction for the gallery without coding each idea into the real site first.",
    prompt:
      "Don't like any of the designs you're giving. Give something unique, like the designs from before — pocket phone, vending machine… List me all the ideas we generated here from the start and open them one by one in Chrome. Don't wait for me to say next, keep opening them one by one.",
    workflow: [
      "Built every direction as a standalone HTML page, no build step.",
      "Opened them in Chrome one after another so I reacted to real pages, not descriptions.",
      "Narrowed it down from what I liked and didn't: no floating backgrounds, a sidebar of all types, navbar on the right.",
      "Built the chosen Control Room look into the real Next.js site.",
    ],
    produced: [
      "31 clickable mockups: switchboard, pocket phone, vending machine, darkroom, transit map, control room and more.",
      "A locked direction: Control Room, dark #0B0D0C with lime #C6FF3D.",
      "The site rebuilt in that theme: intro, sidebar, live ticker, component pages.",
    ],
    saved: "Making 31 directions by hand wasn't realistic. Seeing them as real pages made it possible to choose quickly instead of guessing from descriptions.",
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
