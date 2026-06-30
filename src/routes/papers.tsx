import { createFileRoute, redirect } from "@tanstack/react-router";

// /papers redirects to /past-papers (the real Cambridge IGCSE past papers page)
export const Route = createFileRoute("/papers")({
  beforeLoad: () => {
    throw redirect({ to: "/past-papers", replace: true });
  },
  component: () => null,
});
