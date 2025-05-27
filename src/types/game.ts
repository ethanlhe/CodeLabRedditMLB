export type GamePhase = 'pre' | 'live' | 'post';
export type SubTab = 'summary' | 'lineups' | 'preview' | 'stats' | 'boxscore' | 'updates' | 'highlights' | 'recap';

export interface TeamInfo {
  id: string;
  name: string;
  market: string;
  record: string;
  runs: number;
  [key: string]: string | number;
}

export interface ProbablePitchers {
  home: string | null;
  away: string | null;
  [key: string]: string | null;
}

export interface Player {
  firstName: string;
  lastName: string;
  primaryPosition: string;
  [key: string]: string;
}

export interface GameInfo {
  id: string;
  league: string;
  date: string;
  location: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  currentTime: string;
  timezone: string;
  status: string;
  probablePitchers: ProbablePitchers | null;
  [key: string]: string | TeamInfo | ProbablePitchers | null;
}

export interface Score {
  home: number;
  away: number;
  [key: string]: number;
}

export interface GameBoxscore {
  id: string;
  status: string;
  scheduled: string;
  venue: {
    name: string;
    timezone: string;
    [key: string]: string;
  };
  home: TeamInfo;
  away: TeamInfo;
  probable_pitchers?: {
    home?: { full_name: string };
    away?: { full_name: string };
    [key: string]: { full_name: string } | undefined;
  };
}