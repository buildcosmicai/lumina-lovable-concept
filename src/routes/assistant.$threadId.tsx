import { createFileRoute } from "@tanstack/react-router";
import { AssistantThreadPage } from "@/components/assistant-chat";

export const Route = createFileRoute("/assistant/$threadId")({
  head: () => ({ meta: [
    { title: "Conversation with Relay — Signage CMS" },
    { name: "description", content: "Continue your private digital signage conversation with Relay." },
    { property: "og:title", content: "Conversation with Relay — Signage CMS" },
    { property: "og:description", content: "A saved conversation with your signage assistant." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ThreadPage,
});
function ThreadPage() { const { threadId } = Route.useParams(); return <AssistantThreadPage key={threadId} threadId={threadId} />; }