export const WORKER_TABS = [
  { name: "Jobs", url: "/jobs" },
  { name: "Active", url: "/active" },
  { name: "Wallet", url: "/wallet" },
  { name: "Me", url: "/me" },
] as const

export const LANDING_NAV = [
  { name: "How it works", url: "/#how" },
  { name: "Safety", url: "/#safety" },
  { name: "Docs", url: "/docs" },
] as const

export const FOOTER_LINKS = [
  { name: "Find jobs", url: "/jobs" },
  { name: "Agent console", url: "/agent" },
  { name: "Try it", url: "/try" },
  { name: "Docs", url: "/docs" },
] as const

export const CONSOLE_NAV = [
  { name: "Your checks", url: "/agent" },
  { name: "Post a check", url: "/checks/new" },
  { name: "Spending limits", url: "/agent#limits" },
  { name: "Connect an agent", url: "/agent#connect" },
] as const
