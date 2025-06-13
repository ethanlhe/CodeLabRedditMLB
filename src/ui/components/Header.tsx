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
    <vstack
      width="100%"
      cornerRadius="large"
      padding="small"
      gap="none"
    >
      <hstack width="100%" alignment="start middle">
        <text size="medium" weight="bold" color="#0F1A1C">MLB</text>
        <spacer grow />
        <text size="small" weight="bold" color="#576F76">{timeWithZone}</text>
      </hstack>
      <hstack width="100%" alignment="start middle">
        <text size="small" color="#5A7684">{dateNoYear} • {gameInfo.location}</text>
      </hstack>
    </vstack>
  );
}
