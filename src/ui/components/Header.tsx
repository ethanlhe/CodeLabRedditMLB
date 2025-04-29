import { Devvit } from '@devvit/public-api';
import { GameInfo, GamePhase } from '../../types/game.ts';

interface HeaderProps {
  gameInfo: GameInfo;
  gamePhase: GamePhase;
}

export function Header({ gameInfo, gamePhase }: HeaderProps) {
  return (
    <vstack width="100%" padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
      <hstack gap="small" alignment="center middle">
        {/* ... header content */}
      </hstack>
    </vstack>
  );
} 