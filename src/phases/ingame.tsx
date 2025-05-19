import { Devvit } from '@devvit/public-api';
import { GameInfo, Score } from '../types/game.ts';

interface InGameProps {
  gameInfo: GameInfo;
  score: Score;
}

export function renderInGame({ gameInfo, score }: InGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold">In-Game</text>
      <hstack gap="medium">
        <text>{gameInfo.awayTeam.name}: {score.away}</text>
        <text>-</text>
        <text>{gameInfo.homeTeam.name}: {score.home}</text>
      </hstack>
    </vstack>
  );
} 