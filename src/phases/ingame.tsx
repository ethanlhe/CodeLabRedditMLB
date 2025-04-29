import { Devvit } from '@devvit/public-api';
import { GameInfo, Score } from '../types/game.js';

interface InGameProps {
  gameInfo: GameInfo;
  score: Score;
}

export function renderInGame({ gameInfo, score }: InGameProps) {
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b">Live Game</text>
        <text>{`${gameInfo.homeTeam.name} ${score.home} - ${score.away} ${gameInfo.awayTeam.name}`}</text>
      </vstack>
    </vstack>
  );
} 