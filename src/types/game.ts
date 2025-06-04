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

export interface WeatherInfo {
  condition: string;
  temp: number;
  [key: string]: string | number;
}

export interface TeamStats {
  R: number;
  H: number;
  HR: number;
  TB: number;
  SB: number;
  LOB: number;
  E: number;
  K: number;
  SO: number;
  BB: number;
}

export interface InningScore {
  number: number;
  runs: number;
  hits: number;
  errors: number;
  // Add other fields as needed
}

export interface GameInfo {
  id: string;
  league: string;
  date: string;
  location: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  currentTime: string;
  status: string;
  probablePitchers: ProbablePitchers | null;
  weather: WeatherInfo | null;
  broadcasts: string | null;
  teamStats?: {
    home: TeamStats;
    away: TeamStats;
  };
  scoring?: {
    home: InningScore[];
    away: InningScore[];
  };
  [key: string]: string | TeamInfo | ProbablePitchers | WeatherInfo | TeamStats | { home: TeamStats; away: TeamStats } | { home: InningScore[]; away: InningScore[] } | null | undefined;
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
  weather?: {
    condition: string;
    temp: number;
    [key: string]: string | number;
  };
  broadcasts?: Array<{ network: string; [key: string]: string }>;
  [key: string]: any;
}