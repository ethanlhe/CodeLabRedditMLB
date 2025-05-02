import { GameInfo } from '../types/game.ts';
import { Devvit } from '@devvit/public-api';

export function renderPreGame(gameInfo: GameInfo) {
  return (
    <vstack gap="medium" padding="medium">
      <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
        <text weight="bold" color="#1a1a1b">Game Preview</text>
        <text color="#333333">First Pitch: 7:05 PM ET</text>
        {/* ... rest of pre-game content */}
      </vstack>
    </vstack>
  );
} 