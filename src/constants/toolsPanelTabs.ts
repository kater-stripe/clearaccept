export const TOOLS_PANEL_TABS = [
  'Appearance',
  'Account',
  'Seeding',
  'Financing',
] as const;

export type ToolsPanelTab = (typeof TOOLS_PANEL_TABS)[number];
