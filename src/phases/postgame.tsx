import { Devvit } from '@devvit/public-api';
import { GameInfo, Score } from '../types/game.ts';

interface PostGameProps {
  gameInfo: GameInfo;
  score: Score;
}

export function renderPostGame({ gameInfo, score }: PostGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold">Post-Game</text>
      <hstack gap="medium">
        <text>{gameInfo.awayTeam.name}: {score.away}</text>
        <text>-</text>
        <text>{gameInfo.homeTeam.name}: {score.home}</text>
      </hstack>
    </vstack>
  );
} 