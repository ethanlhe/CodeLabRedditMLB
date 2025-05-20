import { Devvit } from '@devvit/public-api';
import { GameInfo, GamePhase } from '../../types/game.ts';

interface HeaderProps {
  gameInfo: GameInfo;
  gamePhase: GamePhase;
  pollingStatus?: boolean;
  lastUpdateTime?: number;
}

export function Header({ gameInfo, gamePhase, pollingStatus, lastUpdateTime }: HeaderProps) {
  return (
    <vstack width="100%" padding="medium" backgroundColor="#f6f7f8" cornerRadius="medium">
      {gamePhase === 'live' && (
        <hstack alignment="middle center" padding="small" backgroundColor="red" cornerRadius="small" width="100%" gap="small">
          <text color="white" weight="bold" size="large">LIVE</text>
          {typeof pollingStatus !== 'undefined' && typeof lastUpdateTime !== 'undefined' && (
            <hstack alignment="middle center" gap="small">
              <vstack 
                width="8px" 
                height="8px" 
                backgroundColor={pollingStatus ? "green" : "gray"} 
                cornerRadius="full"
              />
              <text size="small" color={pollingStatus ? "green" : "gray"}>
                {pollingStatus ? "Live Updates Active" : "Waiting for Updates"}
              </text>
            </hstack>
          )}
        </hstack>
      )}
      <hstack gap="small" alignment="center middle">
        <text size="large" weight="bold">{gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
      </hstack>
      <text>{gameInfo.date} - {gameInfo.currentTime}</text>
      <text>{gameInfo.location}</text>
    </vstack>
  );
} 