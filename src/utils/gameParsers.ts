import { GameBoxscore, GameInfo, TeamStats } from '../types/game.js';

export function extractTeamStats(statistics: any): TeamStats {
  if (!statistics || !statistics.hitting || !statistics.hitting.overall) {
    return { R: 0, H: 0, HR: 0, TB: 0, SB: 0, LOB: 0, E: 0, K: 0, SO: 0, BB: 0 };
  }
  return {
    R: statistics.hitting.overall.runs?.total ?? 0,
    H: statistics.hitting.overall.onbase?.h ?? 0,
    HR: statistics.hitting.overall.onbase?.hr ?? 0,
    TB: statistics.hitting.overall.onbase?.tb ?? 0,
    SB: statistics.hitting.overall.steal?.stolen ?? 0,
    LOB: statistics.hitting.overall.team_lob ?? 0,
    E: typeof statistics.fielding?.overall?.errors === 'object'
      ? statistics.fielding.overall.errors.total ?? 0
      : statistics.fielding?.overall?.errors ?? 0,
    K: statistics.hitting.overall.outcome?.ktotal ?? 0,
    SO: statistics.hitting.overall.outcome?.ktotal ?? 0,
    BB: statistics.hitting.overall.onbase?.bb ?? 0,
  };
}

export function parseGameBoxscore(data: GameBoxscore): GameInfo {
  const gameTime = new Date(data.scheduled);
  const timezone = data.venue?.timezone || 'America/New_York';
  const formattedTime = gameTime.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Normalize status for live games
  let status = data.status;
  if (status === 'inprogress' || status === 'in_progress' || status === 'live') status = 'in-progress';

  return {
    id: data.id,
    league: 'MLB',
    date: gameTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    location: data.venue?.name || '',
    homeTeam: {
      id: data.home.id,
      name: data.home.name,
      market: data.home.market,
      abbreviation: data.home.abbr,
      record: `${data.home.win || 0}-${data.home.loss || 0}`,
      runs: data.home.runs || 0
    },
    awayTeam: {
      id: data.away.id,
      name: data.away.name,
      market: data.away.market,
      abbreviation: data.away.abbr,
      record: `${data.away.win || 0}-${data.away.loss || 0}`,
      runs: data.away.runs || 0
    },
    currentTime: formattedTime,
    status,
    probablePitchers: data.probable_pitchers ? {
      home: data.probable_pitchers.home?.full_name || null,
      away: data.probable_pitchers.away?.full_name || null
    } : null,
    weather: data.weather ? {
      condition: data.weather.condition,
      temp: data.weather.temp
    } : null,
    broadcasts: data.broadcasts?.map((b: { network: string }) => b.network).join(', ') || null
  };
}
