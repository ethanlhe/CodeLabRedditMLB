import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../../types/game.ts';

interface HeaderProps {
  gameInfo: GameInfo;
}

export function Header({ gameInfo }: HeaderProps) {
  // Extract year from date string (e.g., "Thursday, May 22, 2025")
  const year = gameInfo.date?.split(', ').pop()?.split(' ').pop() ?? '';
  // Remove year from date for display
  const dateNoYear = gameInfo.date?.replace(/,? \d{4}$/, '') ?? '';
  return (
    <vstack width="100%" gap="none" padding="none">
      <hstack width="100%" backgroundColor="#F6F8F9" alignment="start middle">
        <hstack gap="small" alignment="start middle">
          <text size="medium">⚾</text>
          <text size="medium" weight="bold">MLB {year}</text>
        </hstack>
      </hstack>
      <text size="small" color="#888" alignment="start">
        {dateNoYear} • {gameInfo.location}
      </text>
    </vstack>
  );
}
