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

  // Parse scoring for both teams if available
  let scoring = undefined;
  if (data.home?.scoring && data.away?.scoring) {
    scoring = {
      home: data.home.scoring,
      away: data.away.scoring,
    };
  } else if (data.linescore?.innings) {
    // Fallback: parse from linescore.innings if present
    const homeScores = data.linescore.innings.map((inning: any) => ({
      number: inning.number,
      runs: inning.home?.runs ?? 0,
      hits: inning.home?.hits ?? 0,
      errors: inning.home?.errors ?? 0,
    }));
    const awayScores = data.linescore.innings.map((inning: any) => ({
      number: inning.number,
      runs: inning.away?.runs ?? 0,
      hits: inning.away?.hits ?? 0,
      errors: inning.away?.errors ?? 0,
    }));
    scoring = { home: homeScores, away: awayScores };
  }

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
    timezone,
    status,
    probablePitchers: data.probable_pitchers ? {
      home: data.probable_pitchers.home?.full_name || null,
      away: data.probable_pitchers.away?.full_name || null
    } : null,
    weather: data.weather ? {
      condition: data.weather.condition,
      temp: data.weather.temp
    } : null,
    broadcasts: data.broadcasts?.map((b: { network: string }) => b.network).join(', ') || null,
    scoring,
  };
}

// Parse play-by-play data from pbp.json, grouped by half-inning and only at-bat descriptions
export function parsePlayByPlay(raw: any) {
  if (!raw || !raw.game || !Array.isArray(raw.game.innings)) return [];
  const homeTeam = raw.game.home?.name || 'Home';
  const awayTeam = raw.game.away?.name || 'Away';
  const result = [];
  for (const inningObj of raw.game.innings) {
    if (!inningObj.number || inningObj.number < 1) continue; // skip inning 0 or invalid
    for (const halfObj of inningObj.halfs || []) {
      const isTop = halfObj.half === 'T';
      const team = isTop ? awayTeam : homeTeam;
      // Only at-bat level events with a description
      const plays = (halfObj.events || [])
        .filter((event: any) => event.at_bat && event.at_bat.description)
        .map((event: any) => ({ description: event.at_bat.description }));
      if (plays.length > 0) {
        result.push({
          inning: inningObj.number,
          half: halfObj.half,
          team,
          plays
        });
      }
    }
  }
  return result;
}
