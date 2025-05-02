export type GamePhase = 'pre' | 'live' | 'post';
export type SubTab = 'summary' | 'lineups' | 'preview' | 'stats' | 'boxscore' | 'updates' | 'highlights' | 'recap';

export interface TeamInfo {
  name: string;
  record: string;
}

export interface GameInfo {
  league: string;
  date: string;
  location: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  currentTime: string;
  status: string;
}

export interface Score {
  home: number;
  away: number;
}