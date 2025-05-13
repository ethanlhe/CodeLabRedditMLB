export type GamePhase = 'pre' | 'live' | 'post';
export type SubTab = 'summary' | 'lineups' | 'preview' | 'stats' | 'boxscore' | 'updates' | 'highlights' | 'recap';

export interface TeamInfo {
  name: string;
  record: string;
  [key: string]: string | undefined;
}

export interface ProbablePitchers {
  home?: string;
  away?: string;
  [key: string]: string | undefined;
}

export interface GameInfo {
  league: string;
  date: string;
  location: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  currentTime: string;
  status: string;
  probablePitchers?: ProbablePitchers;
  [key: string]: string | TeamInfo | ProbablePitchers | undefined;
}

export interface Score {
  home: number;
  away: number;
}