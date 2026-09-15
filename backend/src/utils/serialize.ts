type PopulatedTeamRef = { _id: number; name: string } | number | null | undefined;

const teamIdOf = (teamId: PopulatedTeamRef): number | null =>
  teamId && typeof teamId === 'object' ? teamId._id : (teamId as number | null) ?? null;

const teamRefOf = (teamId: PopulatedTeamRef): { id: number; name: string } | null =>
  teamId && typeof teamId === 'object' ? { id: teamId._id, name: teamId.name } : null;

export const toApiPlayer = (player: any) => {
  const { _id, teamId, ...rest } = player;
  return {
    id: _id,
    ...rest,
    teamId: teamIdOf(teamId),
    team: teamRefOf(teamId),
  };
};

export const toApiTeam = (team: any) => {
  const { _id, ...rest } = team;
  return { id: _id, ...rest };
};

export const toApiSettings = (settings: any) => {
  const { _id, ...rest } = settings;
  return { id: _id, ...rest };
};
