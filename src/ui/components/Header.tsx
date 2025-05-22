import { Devvit } from '@devvit/public-api';
import { GameInfo, GamePhase } from '../../types/game.ts';

interface HeaderProps {
  gameInfo: GameInfo;
  phase: GamePhase;
}

export function Header({ gameInfo, phase }: HeaderProps) {
  // Extract year from date string (e.g., "Thursday, May 22, 2025")
  const year = gameInfo.date?.split(', ').pop()?.split(' ').pop() ?? '';
  // Remove year from date for display
  const dateNoYear = gameInfo.date?.replace(/,? \d{4}$/, '') ?? '';
  return (
    <vstack width="100%" gap="none" padding="none">
      <hstack width="100%" backgroundColor="#F6F8F9" alignment="start middle">
        <hstack gap="small" alignment="start middle">
          <text size="small">⚾</text>
          <text size="small" weight="bold">MLB {year}</text>
        </hstack>
        <spacer />
        {phase === 'live' && (
          <hstack gap="small" alignment="center middle">
            <image
              url="liveicon.png"
              imageWidth={36}
              imageHeight={20}
              description="Live game logo"
            />
            <text size="medium" color="#FF0000" weight="bold">LIVE</text>
          </hstack>
        )}
        {phase === 'pre' && (
          <text size="small" color="#888">Pre-Game</text>
        )}
        {phase === 'post' && (
          <text size="small" color="#888">Final</text>
        )}
      </hstack>
      <text size="small" color="#888" alignment="start">
        {dateNoYear} • {gameInfo.location}
      </text>
    </vstack>
  );
}
