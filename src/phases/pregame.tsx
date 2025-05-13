import { GameInfo } from '../types/game.ts';
import { Devvit } from '@devvit/public-api';

export function renderPreGame(gameInfo: GameInfo) {
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b" size="large">Game Preview</text>
        
        {/* Venue and Time */}
        <vstack gap="small" padding="small">
          <text weight="bold" color="#1a1a1b">Venue</text>
          <text color="#333333">{gameInfo.location}</text>
        </vstack>

        {/* Teams and Records */}
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
          <text color="#333333">{gameInfo.status}</text>
        </vstack>

        {/* Probable Pitchers - if available */}
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
      </vstack>
    </vstack>
  );
} 