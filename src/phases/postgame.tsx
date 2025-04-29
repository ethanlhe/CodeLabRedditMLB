import { Devvit } from '@devvit/public-api';
import { GameInfo, Score } from '../types/game.js';

interface PostGameProps {
  gameInfo: GameInfo;
  score: Score;
}

export function renderPostGame({ gameInfo, score }: PostGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b">Final Score</text>
        <text>{`${gameInfo.homeTeam.name} ${score.home} - ${score.away} ${gameInfo.awayTeam.name}`}</text>
      </vstack>
    </vstack>
  );
} 