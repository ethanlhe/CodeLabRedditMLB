import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';

interface PreGameProps {
  gameInfo: GameInfo;
}

export function renderPreGame({ gameInfo }: PreGameProps) {
  console.log('[Pregame] received gameInfo:', gameInfo);
  if (!gameInfo.id) {
    return (
      <vstack gap="medium" padding="medium">
        <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
          <text color="#1a1a1b">Loading pregame data...</text>
        </vstack>
      </vstack>
    );
  }
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b" size="large">Upcoming Game</text>
        
        {/* Game Status */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Status</text>
          <text color="#333333">{gameInfo.status}</text>
        </vstack>

        {/* Teams */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Teams</text>
          <hstack gap="medium" alignment="middle">
            <vstack>
              <text weight="bold" color="#333333">{gameInfo.awayTeam.name}</text>
              <text color="#666666">{gameInfo.awayTeam.record}</text>
            </vstack>
            <text color="#666666">@</text>
            <vstack>
              <text weight="bold" color="#333333">{gameInfo.homeTeam.name}</text>
              <text color="#666666">{gameInfo.homeTeam.record}</text>
            </vstack>
          </hstack>
        </vstack>

        {/* Game Time */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Game Time</text>
          <text color="#333333">{gameInfo.currentTime}</text>
        </vstack>

        {/* Location */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Location</text>
          <text color="#333333">{gameInfo.location}</text>
        </vstack>

        {/* Probable Pitchers */}
        {gameInfo.probablePitchers && (
          <vstack gap="small" padding="small">
            <text weight="bold" color="#1a1a1b">Probable Pitchers</text>
            <hstack gap="medium" alignment="middle">
              <vstack>
                <text color="#333333">{gameInfo.probablePitchers.away || 'TBD'}</text>
              </vstack>
              <text color="#666666">vs</text>
              <vstack>
                <text color="#333333">{gameInfo.probablePitchers.home || 'TBD'}</text>
              </vstack>
            </hstack>
          </vstack>
        )}

        {/* Broadcasts */}
        {gameInfo.broadcasts && (
          <vstack gap="small" padding="small">
            <text weight="bold" color="#1a1a1b">Broadcasts</text>
            <text color="#333333">{gameInfo.broadcasts}</text>
          </vstack>
        )}
      </vstack>
    </vstack>
  );
} 