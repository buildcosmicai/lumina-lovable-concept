import { createFileRoute } from "@tanstack/react-router";
import { AssistantChat } from "@/components/assistant-chat";

export const Route = createFileRoute("/assistant/")({
  head: () => ({ meta: [
    { title: "Relay AI Assistant — Signage CMS" },
    { name: "description", content: "Plan signage content, troubleshoot playback and shape your next screen with Relay." },
    { property: "og:title", content: "Relay AI Assistant — Signage CMS" },
    { property: "og:description", content: "Your digital signage conversation workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <AssistantChat />,
});