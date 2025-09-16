import { z } from "zod";
import { normalizeTeamName } from "../transformers/team-name-normalizer.js";

export const teamNameSchema = z
  .string()
  .default("")
  .describe(
    "Team name (required). Use esa_get_teams first to see available teams.",
  )
  .transform(normalizeTeamName);

export function createSchemaWithTeamName<T extends z.ZodRawShape>(
  schema: T,
): z.ZodObject<T & { teamName: typeof teamNameSchema }> {
  return z.object({
    teamName: teamNameSchema,
    ...schema,
  });
}
