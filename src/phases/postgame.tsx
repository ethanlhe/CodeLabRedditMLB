import { Devvit } from '@devvit/public-api';
import { GameInfo, Score } from '../types/game.ts';

interface PostGameProps {
  gameInfo: GameInfo;
  score: Score;
}

export function renderPostGame({ gameInfo, score }: PostGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b" size="large">Final Score</text>
        
        {/* Final Score */}
        <vstack gap="small" padding="small">
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

        {/* Game Info */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Game Info</text>
          <text color="#333333">{gameInfo.status}</text>
        </vstack>

        {/* Venue */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Venue</text>
          <text color="#333333">{gameInfo.location}</text>
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