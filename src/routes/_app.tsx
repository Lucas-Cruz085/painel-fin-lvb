import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/portal/AppShell";

export const Route = createFileRoute("/_app")({
  component: function LayoutAutenticado() {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  },
});