import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';

interface InGameProps {
  gameInfo: GameInfo;
}

export function renderInGame({ gameInfo }: InGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold">In-Game</text>
      <text>Teams: {gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
      <text>Score: {gameInfo.awayTeam.runs} - {gameInfo.homeTeam.runs}</text>
      <text>Venue: {gameInfo.location}</text>
    </vstack>
  );
} 