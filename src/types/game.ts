export type GamePhase = 'pre' | 'live' | 'post' | 'scores';
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

export interface LiveGameData {
  [key: string]: any;  // Add index signature to satisfy JSONValue
  league: {
    alias: string;
    name: string;
    id: string;
    date: string;
    games: Array<{
      game: {
        id: string;
        status: string;
        scheduled: string;
        home: {
          name: string;
          market: string;
          runs: number;
          win: number;
          loss: number;
          probable_pitcher?: {
            full_name: string;
          };
        };
        away: {
          name: string;
          market: string;
          runs: number;
          win: number;
          loss: number;
          probable_pitcher?: {
            full_name: string;
          };
        };
        outcome?: {
          current_inning: number;
          current_inning_half: string;
          count?: {
            balls: number;
            strikes: number;
            outs: number;
          };
        };
      };
    }>;
  };
}