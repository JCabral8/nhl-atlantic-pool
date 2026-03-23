/**
 * NHL team logo URLs (public CDN used by NHL.com).
 * Primary pattern: {ABBREV}_light.svg — full-color mark.
 * Add overrides if a team asset path differs.
 */
const LOGO_BASE = "https://assets.nhle.com/logos/nhl/svg";

/** Filename (e.g. `DAL_secondary_light.svg`) relative to LOGO_BASE */
const LOGO_OVERRIDES: Record<string, string> = {};

export function getTeamLogoUrl(teamAbbrev: string): string {
  const key = teamAbbrev.toUpperCase();
  const override = LOGO_OVERRIDES[key];
  if (override) {
    return `${LOGO_BASE}/${override.replace(/^\//, "")}`;
  }
  return `${LOGO_BASE}/${key}_light.svg`;
}
