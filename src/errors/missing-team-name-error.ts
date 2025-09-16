export class MissingTeamNameError extends Error {
  constructor() {
    super(
      "Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
    );
    this.name = "MissingTeamNameError";
  }
}
