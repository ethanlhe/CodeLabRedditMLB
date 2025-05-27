import { Devvit } from '@devvit/public-api';
import { GameInfo, GamePhase } from '../../types/game.ts';

interface HeaderProps {
  gameInfo: GameInfo;
  phase: GamePhase;
}

export function Header({ gameInfo, phase }: HeaderProps) {
  // Extract year from date string (e.g., "Thursday, May 22, 2025")
  const year = gameInfo.date?.split(', ').pop()?.split(' ').pop() ?? '';
  // Format date to show only month and day
  const dateNoYear = gameInfo.date?.split(', ')[1]?.split(',')[0] ?? '';
  // Format time with timezone
  const timeWithZone = gameInfo.currentTime ? `${gameInfo.currentTime} ${gameInfo.timezone || 'ET'}` : '';

  return (
    <vstack width="100%" gap="none" padding="none">
      <hstack width="100%" alignment="start middle">
        <hstack gap="small" alignment="start middle">
          <text size="small">⚾</text>
          <text size="small" weight="bold" color="#0F1A1C">MLB {year}</text>
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
          </hstack>
        )}
        {phase === 'pre' && (
          <text size="small" color="#888">Pre-Game</text>
        )}
        {phase === 'post' && (
          <text size="small" color="#888">Final</text>
        )}
      </hstack>
      <hstack gap="small" alignment="end">
        <text size="small" color="#888" alignment="end">{timeWithZone}</text>
      </hstack>
      <hstack width="100%" alignment="start middle">
        <text size="small" color="#888" alignment="start">
          {dateNoYear} • {gameInfo.location}
        </text>
      </hstack>
    </vstack>
  );
}
