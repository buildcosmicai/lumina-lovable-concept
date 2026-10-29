import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AssistantWorkspace } from "@/components/assistant-workspace";

export const Route = createFileRoute("/assistant")({
  component: () => (
    <AssistantWorkspace>
      <Outlet />
    </AssistantWorkspace>
  ),
});
