import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';

interface PreGameProps {
  gameInfo: GameInfo;
}

export function renderPreGame({ gameInfo }: PreGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold">Pre-Game</text>
      <text>Teams: {gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
      <text>Scheduled: {gameInfo.currentTime}</text>
      <text>Venue: {gameInfo.location}</text>
    </vstack>
  );
} 