import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';

interface PostGameProps {
  gameInfo: GameInfo;
}

export function renderPostGame({ gameInfo }: PostGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold">Post-Game</text>
      <text>Teams: {gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
      <text>Final Score: {gameInfo.awayTeam.runs} - {gameInfo.homeTeam.runs}</text>
      <text>Venue: {gameInfo.location}</text>
    </vstack>
  );
} 