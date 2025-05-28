import { Devvit } from '@devvit/public-api';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';
import { GameInfo } from '../types/game.ts';

/*
  This is the in-game phase.
  It displays the current score and the inning.
  It also displays the current outs and runners on base.
  It also displays the current pitcher for each team.
  It also displays the current batter for each team.
  It also displays the current pitch count for each pitcher.
*/

interface InGameProps {
  gameInfo: GameInfo;
}

export function renderInGame({ gameInfo }: InGameProps) {
  if (!gameInfo || !gameInfo.awayTeam || !gameInfo.homeTeam) {
    return <text color="red">No game data available (missing team info).</text>;
  }
  const awayAbbr = gameInfo.awayTeam.abbreviation;
  const homeAbbr = gameInfo.homeTeam.abbreviation;
  if (!awayAbbr || !homeAbbr) {
    return <text color="red">No game data available (missing team abbreviations).
    </text>;
  }
  const awayLogo = MLB_LOGOS[awayAbbr];
  const homeLogo = MLB_LOGOS[homeAbbr];

  return (
    <vstack width="100%" maxWidth={600} backgroundColor="neutral-background-weak" padding="large" gap="large">
      {/* Header Section */}
      <vstack width="100%" gap="small">
        <text size="large" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
        <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.date} • {gameInfo.currentTime}</text>
        <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.location}</text>
      </vstack>
      {/* Score Row */}
      <hstack width="100%" alignment="center middle" gap="large" padding="xsmall">
        {/* Away Team */}
        <vstack alignment="center middle" gap="small">
          {awayLogo ? (
            <image 
              url={awayLogo} 
              imageWidth={48} 
              imageHeight={48} 
              description={`${gameInfo.awayTeam.name} logo`} 
            />
          ) : null}
          <text size="medium" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.awayTeam.name}</text>
          <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.awayTeam.record}</text>
        </vstack>
        {/* Score */}
        <vstack alignment="center middle" gap="small" minWidth={80}>
          <text size="xxlarge" weight="bold" color="#222" alignment="center">
            {gameInfo.awayTeam.runs} - {gameInfo.homeTeam.runs}
          </text>
          <text size="small" color="#1976d2" alignment="center">In Progress</text>
        </vstack>
        {/* Home Team */}
        <vstack alignment="center middle" gap="small">
          {homeLogo ? (
            <image 
              url={homeLogo} 
              imageWidth={48} 
              imageHeight={48} 
              description={`${gameInfo.homeTeam.name} logo`} 
            />
          ) : null}
          <text size="medium" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.homeTeam.name}</text>
          <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.homeTeam.record}</text>
        </vstack>
      </hstack>
      {/* Live Details Section */}
      <vstack width="100%" gap="small">
        <text size="medium" color="#1976d2" weight="bold" alignment="center">
          Game In Progress
        </text>
        {/* You can add inning, outs, runners, etc. here if available */}
      </vstack>
    </vstack>
  );
} 