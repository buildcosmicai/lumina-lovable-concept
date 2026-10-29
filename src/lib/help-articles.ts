import {
  BookOpen,
  CalendarDays,
  CreditCard,
  Handshake,
  Layers,
  ListVideo,
  Monitor,
  Users,
} from "lucide-react";

export const HELP_TOPICS = [
  {
    id: "start",
    name: "Getting started",
    icon: BookOpen,
    tone: "text-accent bg-accent/10",
    description: "Your first steps in Lumina.",
  },
  {
    id: "content",
    name: "Layouts & content",
    icon: Layers,
    tone: "text-foreground bg-primary/15",
    description: "Build something worth looking at.",
  },
  {
    id: "screens",
    name: "Screens & publishing",
    icon: Monitor,
    tone: "text-accent bg-accent/10",
    description: "The right content. The right screens.",
  },
  {
    id: "schedules",
    name: "Playlists & schedules",
    icon: ListVideo,
    tone: "text-zone-3 bg-zone-3/10",
    description: "Make every moment count.",
  },
  {
    id: "rooms",
    name: "Meeting rooms",
    icon: CalendarDays,
    tone: "text-zone-4 bg-zone-4/10",
    description: "Calendars, room displays and privacy.",
  },
  {
    id: "team",
    name: "Users & partners",
    icon: Users,
    tone: "text-zone-5 bg-zone-5/10",
    description: "Bring the right people together.",
  },
  {
    id: "account",
    name: "Account & licences",
    icon: CreditCard,
    tone: "text-foreground bg-primary/15",
    description: "Understand your account and access.",
  },
] as const;

export type HelpArticle = {
  slug: string;
  title: string;
  topic: (typeof HELP_TOPICS)[number]["id"];
  summary: string;
  minutes: number;
  featured?: boolean;
  note?: string;
  sections: { title: string; paragraphs?: string[]; steps?: string[] }[];
  related: string[];
};
export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "find-your-way",
    title: "Find your way around Lumina",
    topic: "start",
    minutes: 3,
    featured: true,
    summary: "From your first layout to the screen it belongs on: a tour of your workspace.",
    note: "Several workspace pages currently use sample records and browser-local changes. Treat their status and publish confirmations as demonstrations, not live screen delivery.",
    sections: [
      {
        title: "Start with the workspace",
        paragraphs: [
          "The icon rail connects the main areas of Lumina. Control Center provides an operational overview; Pulse presents playback and delivery signals. Screens contains the inventory and a detail page for each display.",
        ],
      },
      {
        title: "Create, sequence, schedule",
        paragraphs: [
          "Layouts determines how a screen is divided into zones. Media holds images and videos. Playlists arranges content into a sequence, while Schedules determines when it should play.",
        ],
      },
      {
        title: "Manage your account",
        paragraphs: [
          "Users contains invitations, groups and custom roles. Partners organises the distributor and reseller network. Settings includes your profile, plan and room integrations. Relay is the AI Assistant for drafting content and discussing signage questions.",
        ],
      },
    ],
    related: ["create-a-layout", "publish-targets", "build-a-playlist"],
  },
  {
    slug: "create-a-layout",
    title: "Create your first screen layout",
    topic: "content",
    minutes: 4,
    featured: true,
    summary: "Choose a screen shape, add zones and make the canvas your own.",
    sections: [
      {
        title: "Choose your canvas",
        steps: [
          "Open Layouts and select New layout, or open an existing layout.",
          "Choose Landscape (16:9), Portrait (9:16) or Ultrawide (32:9) to match the intended display.",
          "Give the layout a recognisable name.",
        ],
      },
      {
        title: "Add and arrange zones",
        paragraphs: [
          "The left-hand library offers video, image, ticker, clock, weather, web and meeting-room zones. Add a zone, then drag or resize it on the centre canvas. Snapping helps align adjoining zones.",
        ],
        steps: [
          "Select a zone to see its settings on the right.",
          "Rename the zone and adjust opacity as needed.",
          "Lock completed zones to prevent accidental movement. Duplicate a zone when you need a similar element.",
        ],
      },
      {
        title: "Preview and save",
        paragraphs: [
          "Use Preview to inspect the composition, then Save layout. Saved layouts are kept in this browser in the current editor; using a different browser does not restore them automatically.",
        ],
      },
    ],
    related: ["organise-layouts", "meeting-room-designs", "publish-targets"],
  },
  {
    slug: "organise-layouts",
    title: "Organise layouts into folders",
    topic: "content",
    minutes: 2,
    summary: "Keep a growing layout collection easy to browse.",
    sections: [
      {
        title: "Create a folder",
        steps: [
          "Open Layouts and use the new-folder control beside Folders.",
          "Enter a name and confirm it.",
          "Select the folder to narrow the layout collection.",
        ],
      },
      {
        title: "Move and find layouts",
        paragraphs: [
          "Use a layout's options to move it into a folder. Search by layout name to find it quickly. Open returns to the editor; Duplicate creates a separate copy. Delete removes the saved entry.",
        ],
      },
      {
        title: "Where layouts are stored",
        paragraphs: [
          "The current layout collection and folders are saved in browser storage. Do not clear browser data if you need to keep these local layouts.",
        ],
      },
    ],
    related: ["create-a-layout", "meeting-room-designs"],
  },
  {
    slug: "publish-targets",
    title: "Publish to screens, groups and sites",
    topic: "screens",
    minutes: 3,
    featured: true,
    summary: "Choose any combination of destinations in one Where to publish picker.",
    note: "The current publish flow demonstrates target selection. It does not send content to physical screens yet.",
    sections: [
      {
        title: "Open the destination picker",
        paragraphs: [
          "Press Publish in the layout editor or on Playlists. The Where to publish dialog lets you combine individual screens, groups and sites.",
        ],
      },
      {
        title: "Select your destinations",
        steps: [
          "Screens: search for displays and use site or status filters, then tick the screens you want.",
          "Groups: search by group name and select one or more groups.",
          "Sites: search by site name and select sites, optionally narrowing the selection by group.",
        ],
      },
      {
        title: "Review the total",
        paragraphs: [
          "A screen selected in more than one way is counted once. Selected items remain selected when your search hides them. Review the unique screen total and offline count before confirming. Offline destinations are identified as waiting until they are back online in the demo.",
        ],
      },
    ],
    related: ["screen-troubleshooting", "create-a-layout", "build-a-playlist"],
  },
  {
    slug: "screen-troubleshooting",
    title: "What to check when a screen is offline",
    topic: "screens",
    minutes: 4,
    summary: "A practical checklist for power, connectivity and the player.",
    sections: [
      {
        title: "Check the physical display",
        steps: [
          "Confirm that the screen and signage player have power.",
          "Check the display input and the cable between the player and screen.",
          "Look for any messages on the player or display before restarting it.",
        ],
      },
      {
        title: "Check the network",
        paragraphs: [
          "Verify that the player is connected to the expected wired or wireless network. Ask your network administrator about recent firewall, proxy, Wi-Fi or internet changes. A working local connection does not necessarily mean the player can reach its service.",
        ],
      },
      {
        title: "Review the screen details",
        paragraphs: [
          "Open Screens, select the display and inspect its last signal, device details and assignment. The current inventory uses demonstration records; refresh, diagnostics and restart actions are not live device commands. Record the issue and work with your device administrator for a real installation.",
        ],
      },
    ],
    related: ["publish-targets", "find-your-way"],
  },
  {
    slug: "build-a-playlist",
    title: "Build a playlist with a natural rhythm",
    topic: "schedules",
    minutes: 3,
    summary: "Arrange media, set durations and preview the sequence.",
    sections: [
      {
        title: "Arrange the sequence",
        steps: [
          "Open Playlists and select a playlist.",
          "Drag content from the media list into the sequence.",
          "Drag playlist items to change their order.",
        ],
      },
      {
        title: "Set the pacing",
        paragraphs: [
          "Select an item to adjust its duration and transition. Keep text on screen long enough to read, and balance longer videos with shorter information screens. The runtime bar helps compare the length of each item.",
        ],
      },
      {
        title: "Preview and choose destinations",
        paragraphs: [
          "Use playback controls to review the order. The preview runs at increased speed. Loop repeats the sequence; Shuffle changes the order. Publish opens the destination picker. Playlist editing and publishing are currently demonstration interactions, not live delivery.",
        ],
      },
    ],
    related: ["schedule-content", "publish-targets"],
  },
  {
    slug: "schedule-content",
    title: "Plan content and resolve schedule overlaps",
    topic: "schedules",
    minutes: 4,
    summary: "Work with the timeline and spot content competing for the same time.",
    sections: [
      {
        title: "Work with the timeline",
        paragraphs: [
          "Open Schedules and choose a day. Each row represents a screen channel. Select a scheduled item to inspect its timing, priority and recurrence.",
        ],
        steps: [
          "Drag an item to move it to another time or channel.",
          "Resize its ends to change the duration. Timeline adjustments snap to 30-minute intervals.",
          "Use the slot editor for precise changes.",
        ],
      },
      {
        title: "Look for conflicts",
        paragraphs: [
          "An overlap appears when two items occupy the same channel at the same time. Review the intended order and timing before using the conflict resolution controls. Check the resulting timeline rather than assuming both items will play simultaneously.",
        ],
      },
      {
        title: "Current scheduling behaviour",
        paragraphs: [
          "The schedule page is a browser-local demonstration. Its natural-language entry is a convenience for sample slots, not the Relay assistant or a live scheduling service. Changes are not sent to real players.",
        ],
      },
    ],
    related: ["build-a-playlist", "publish-targets"],
  },
  {
    slug: "meeting-room-designs",
    title: "Choose an adaptive meeting-room display",
    topic: "rooms",
    minutes: 3,
    summary: "Explore room templates that change with availability and protect meeting details.",
    sections: [
      {
        title: "Choose a template",
        paragraphs: [
          "Open Layouts → Layout library. The room collection includes Atelier, Panorama, Signal, Prism, Orbit, Vector, Tempo and Meridian. Use a template to bring its room zone into the editor.",
        ],
      },
      {
        title: "One room, changing states",
        paragraphs: [
          "Tempo and Meridian adapt between Available, Starting soon and In a meeting, with an offline state when calendar information is unavailable. These are states of one design, not separate layouts you need to schedule manually. Use the library simulation to compare them.",
        ],
      },
      {
        title: "Set the information and privacy",
        paragraphs: [
          "Select the meeting zone to choose a provider, room and display settings. Review privacy controls before showing titles or organisers. Meridian's timetable opens the selected room's agenda in day, week and month views. Calendar previews in the layout editor currently use demo room records.",
        ],
      },
      {
        title: "Add your own room photo",
        paragraphs: [
          "Panorama and Prism support customer room photos through their zone controls. Sign in to upload, replace or remove a photo. Accepted formats are JPG, PNG and WebP, up to 10 MB; photos are stored privately for the account. Photo-free designs stay photo-free.",
        ],
      },
    ],
    related: ["connect-room-calendars", "create-a-layout"],
  },
  {
    slug: "connect-room-calendars",
    title: "Connect Google Workspace or Microsoft 365 rooms",
    topic: "rooms",
    minutes: 6,
    summary: "Prepare a reader connection, verify access and select managed room calendars.",
    note: "Real verification requires your organisation's credentials and a signed-in account. A saved connection does not make the editor's demo calendars live automatically.",
    sections: [
      {
        title: "Open Room Connectors",
        paragraphs: [
          "Go to Settings → Integrations → Room Connectors. You can create separate connections for Google Workspace and Microsoft 365, including both providers in the same account.",
        ],
      },
      {
        title: "Prepare Google Workspace",
        steps: [
          "Follow the page's Google setup guide to create a service account and enable the Calendar API.",
          "Configure domain-wide delegation and authorise the required reader scopes in the Google Workspace admin console.",
          "Share the room calendars as instructed. Enter a connection name and reader email, then upload the service-account key JSON.",
        ],
      },
      {
        title: "Prepare Microsoft 365",
        paragraphs: [
          "Choose Microsoft and follow its Azure setup instructions. Your organisation's administrator must configure the application and calendar access. Enter the requested Microsoft connection details; do not upload a Google key for this provider.",
        ],
      },
      {
        title: "Verify and discover",
        steps: [
          "Press Verify and read the actual connection status or specific error.",
          "Resolve any permission, delegation or credential problem before continuing.",
          "Run Discover rooms and tick the calendars you want to manage.",
          "Use the connections list to review status, room count and last error, replace credentials or remove a connection.",
        ],
      },
    ],
    related: ["meeting-room-designs", "find-your-way"],
  },
  {
    slug: "roles-and-partners",
    title: "Understand roles and partner access",
    topic: "team",
    minutes: 4,
    summary: "Know the difference between workspace permissions and the partner network.",
    sections: [
      {
        title: "Built-in and custom roles",
        paragraphs: [
          "Users shows the built-in Owner, Admin, Publisher, Editor and Viewer roles. These defaults are read-only in the role builder. New role creates a custom role, optionally starting from an existing role's permissions. Custom roles can be edited or deleted using the role table controls. These controls currently operate as a demo and do not establish backend permissions.",
        ],
      },
      {
        title: "Partner visibility",
        paragraphs: [
          "The partner hierarchy is Vendor → Distributor → Reseller → Customer. Resellers see customers sold through them. Distributors also see their resellers' customers. All partners is a tree filter, not a grant of access; the current Viewing as control simulates each viewpoint.",
        ],
      },
      {
        title: "Licences and support",
        paragraphs: [
          "Partners request licences by submitting a purchase order; the vendor approves the request. Partners do not issue licences themselves. Customer approval is required for support access. Partner margins and commissions are not shown in the portal.",
        ],
      },
    ],
    related: ["plan-and-licences", "find-your-way"],
  },
  {
    slug: "plan-and-licences",
    title: "Read your plan and licence information",
    topic: "account",
    minutes: 3,
    summary: "Find screen usage, included features, validity and provider details.",
    sections: [
      {
        title: "Where to find it",
        paragraphs: [
          "Open Settings → Plan & licences. The page brings together screen usage, remaining licences, plan status, support level, validity, licence grants and included features.",
        ],
      },
      {
        title: "Review validity and limits",
        paragraphs: [
          "Check expiry dates and any grace or expired notice alongside the feature and capacity limits. Provider details and order history are read-only; the page does not offer checkout or show prices. The current page uses sample summaries to demonstrate these states, not an account's live entitlement.",
        ],
      },
      {
        title: "Request a change",
        paragraphs: [
          "For a real plan or licence change, contact your selling provider or Lumina account manager. In the partner workflow, licence requests require a purchase order and vendor approval.",
        ],
      },
    ],
    related: ["roles-and-partners", "find-your-way"],
  },
  {
    slug: "using-relay",
    title: "Get useful answers from Relay",
    topic: "start",
    minutes: 2,
    summary:
      "Give your AI assistant the context it needs without assuming it controls your screens.",
    sections: [
      {
        title: "Start a conversation",
        paragraphs: [
          "Open AI Assistant and sign in with Google or Lovable. Each conversation has its own page and account-saved history. New conversation starts a separate thread; the conversation list lets you return to earlier discussions.",
        ],
      },
      {
        title: "Ask a specific question",
        paragraphs: [
          "Tell Relay your audience, display format, desired tone and any timing constraints. For troubleshooting, describe what you see and what you have already checked. Use follow-up questions in the same conversation to refine the answer.",
        ],
      },
      {
        title: "Review before publishing",
        paragraphs: [
          "Relay can draft content and explain workflows. It does not have live screen telemetry, calendar access or deployment tools, and it does not change CMS content for you. Review important details and perform the final change in the relevant workspace page. Stop ends an in-progress response; Copy lets you reuse the answer.",
        ],
      },
    ],
    related: ["create-a-layout", "screen-troubleshooting"],
  },
];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((article) => article.slug === slug);
}
export function searchHelpArticles(query: string, topic = "all") {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return HELP_ARTICLES.filter(
    (article) =>
      (topic === "all" || article.topic === topic) &&
      words.every((word) =>
        `${article.title} ${article.summary} ${article.sections.map((section) => `${section.title} ${section.paragraphs?.join(" ") ?? ""} ${section.steps?.join(" ") ?? ""}`).join(" ")}`
          .toLowerCase()
          .includes(word),
      ),
  );
}
