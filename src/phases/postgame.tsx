import { Devvit } from '@devvit/public-api';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';
import { GameInfo } from '../types/game.ts';

interface PostGameProps {
  gameInfo: GameInfo;
}

export function renderPostGame({ gameInfo }: PostGameProps) {
  // Defensive checks
  if (!gameInfo || !gameInfo.awayTeam || !gameInfo.homeTeam) {
    return <text color="red">No game data available (missing team info).</text>;
  }
  const awayAbbr = gameInfo.awayTeam.abbreviation;
  const homeAbbr = gameInfo.homeTeam.abbreviation;
  if (!awayAbbr || !homeAbbr) {
    return <text color="red">No game data available (missing team abbreviations).</text>;
  }
  const awayLogo = MLB_LOGOS[awayAbbr];
  const homeLogo = MLB_LOGOS[homeAbbr];

  // Determine winner and game summary
  const homeWon = gameInfo.homeTeam.runs > gameInfo.awayTeam.runs;
  const awayWon = gameInfo.awayTeam.runs > gameInfo.homeTeam.runs;
  const isTie = gameInfo.homeTeam.runs === gameInfo.awayTeam.runs;
  const summaryLine = isTie 
    ? `The game ends in a tie`
    : `${homeWon ? gameInfo.homeTeam.name : gameInfo.awayTeam.name} defeat ${homeWon ? gameInfo.awayTeam.name : gameInfo.homeTeam.name}`;

  return (
    <vstack>
      {/* Score Row */}
      <hstack width="100%" alignment="center middle" gap="large" padding="small">
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
          <hstack alignment="center middle" gap="small">
            {awayWon ? (
              <text size="xxlarge" weight="bold" color="neutral-content-strong" alignment="center">
                {gameInfo.awayTeam.runs}
              </text>
            ) : (
              <text size="xxlarge" color="neutral-content-strong" alignment="center">
                {gameInfo.awayTeam.runs}
              </text>
            )}
            <text size="xxlarge" color="neutral-content-strong" alignment="center">
              {" - "}
            </text>
            {homeWon ? (
              <text size="xxlarge" weight="bold" color="neutral-content-strong" alignment="center">
                {gameInfo.homeTeam.runs}
              </text>
            ) : (
              <text size="xxlarge" color="neutral-content-strong" alignment="center">
                {gameInfo.homeTeam.runs}
              </text>
            )}
          </hstack>
          <text size="small" color="neutral-content-strong" alignment="center">Final</text>
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
      {/* Team Stats Section */}
      <vstack gap="small" width="100%">
        <text size="small" weight="bold">Team Stats</text>
        <hstack gap="medium" alignment="center middle">
          <text size="xsmall" weight="bold" color="neutral-content-weak">TEAM</text>
          <spacer grow />
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>R</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>H</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>HR</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>TB</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>SB</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>LOB</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>E</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>K</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>SO</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak">BB</text>
        </hstack>
        {/* Away team row */}
        <hstack gap="medium" alignment="center middle">
          <text size="small" weight="bold">{gameInfo.awayTeam.abbreviation}</text>
          <spacer grow />
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.R}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.H}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.HR}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.TB}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.SB}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.LOB}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.E}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.K}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.away.SO}</text>
          <text size="small">{gameInfo.teamStats?.away.BB}</text>
        </hstack>
        {/* Home team row */}
        <hstack gap="medium" alignment="center middle">
          <text size="small" weight="bold">{gameInfo.homeTeam.abbreviation}</text>
          <spacer grow />
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.R}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.H}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.HR}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.TB}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.SB}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.LOB}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.E}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.K}</text>
          <text size="small" minWidth={8}>{gameInfo.teamStats?.home.SO}</text>
          <text size="small">{gameInfo.teamStats?.home.BB}</text>
        </hstack>
      </vstack>
    </vstack>
  );
} 