export function normalizeTeamName(teamName: string): string {
  const dotIndex = teamName.indexOf(".");
  if (dotIndex >= 0) {
    return teamName.substring(0, dotIndex);
  }
  return teamName;
}
