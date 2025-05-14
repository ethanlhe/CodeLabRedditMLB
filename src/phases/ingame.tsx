import { Devvit } from '@devvit/public-api';
import { GameInfo, Score } from '../types/game.ts';

interface InGameProps {
  gameInfo: GameInfo;
  score: Score;
}

export function renderInGame({ gameInfo, score }: InGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b" size="large">Live Game</text>
        
        {/* Game Status */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Status</text>
          <text color="#333333">{gameInfo.status}</text>
        </vstack>

        {/* Score */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Score</text>
          <hstack gap="medium" alignment="middle">
            <vstack>
              <text weight="bold" color="#333333">{gameInfo.awayTeam.name}</text>
              <text color="#666666">{score.away}</text>
            </vstack>
            <text color="#666666">-</text>
            <vstack>
              <text weight="bold" color="#333333">{gameInfo.homeTeam.name}</text>
              <text color="#666666">{score.home}</text>
            </vstack>
          </hstack>
        </vstack>

        {/* Current Time */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Current Time</text>
          <text color="#333333">{gameInfo.currentTime}</text>
        </vstack>

        {/* Weather - if available */}
        {(gameInfo.weather && (
          <vstack gap="small" padding="small">
            <text weight="bold" color="#1a1a1b">Weather</text>
            <text color="#333333">{`${gameInfo.weather!.condition}, ${gameInfo.weather!.temp}°F`}</text>
          </vstack>
        )) as JSX.Element}

        {/* Broadcasts - if available */}
        {(gameInfo.broadcasts && (
          <vstack gap="small" padding="small">
            <text weight="bold" color="#1a1a1b">Broadcasts</text>
            <text color="#333333">{gameInfo.broadcasts}</text>
          </vstack>
        )) as JSX.Element}
      </vstack>
    </vstack>
  );
} 