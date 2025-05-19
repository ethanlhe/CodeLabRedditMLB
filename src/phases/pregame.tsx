import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';

interface PreGameProps {
  gameInfo: GameInfo;
}

export function renderPreGame({ gameInfo }: PreGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold">Pre-Game</text>
      <hstack gap="medium">
        <text>{gameInfo.awayTeam.name}</text>
        <text>vs</text>
        <text>{gameInfo.homeTeam.name}</text>
      </hstack>
    </vstack>
  );
} 