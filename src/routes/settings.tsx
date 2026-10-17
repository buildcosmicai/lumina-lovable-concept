import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsShell } from "@/components/settings-shell";
export const Route = createFileRoute("/settings")({ component: () => <SettingsShell><Outlet /></SettingsShell> });