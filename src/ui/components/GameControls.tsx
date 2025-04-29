import { Devvit } from '@devvit/public-api';
import { GamePhase } from '../../types/game.ts';

interface GameStateControlsProps {
  onPhaseChange: (phase: GamePhase) => void;
}

export function GameStateControls({ onPhaseChange }: GameStateControlsProps) {
  return (
    <vstack padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium" gap="small">
      <text weight="bold" color="#1a1a1b">Game Controls</text>
      <hstack gap="medium" alignment="center middle">
        <button onPress={() => onPhaseChange('pre')}>Pre-Game</button>
        <button onPress={() => onPhaseChange('live')}>Live Game</button>
        <button onPress={() => onPhaseChange('post')}>Post-Game</button>
      </hstack>
    </vstack>
  );
} 