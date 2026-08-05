export const VIA_OPTIONS = ["Group", "Airbnb App", "Instagram", "Referer"] as const;
export type ViaOption = (typeof VIA_OPTIONS)[number];
