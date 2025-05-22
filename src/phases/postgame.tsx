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
    <vstack width="100%" maxWidth={600} backgroundColor="neutral-background-weak" padding="large" gap="large">
      {/* Header Section */}
      <vstack width="100%" gap="small">
        <text size="large" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
        <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.date} • {gameInfo.currentTime}</text>
        <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.location}</text>
      </vstack>
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
      {/* Summary Line and Details */}
      <vstack width="100%" gap="small">
        <text size="medium" color="success-plain" weight="bold" alignment="center">
          {summaryLine}
        </text>
        {(gameInfo.weather && gameInfo.weather.condition && gameInfo.weather.temp) || gameInfo.broadcasts ? (
          <hstack width="100%" gap="medium" alignment="center middle">
            {gameInfo.weather && gameInfo.weather.condition && gameInfo.weather.temp ? (
              <text size="small" color="neutral-content-strong" alignment="center">
                Weather: {gameInfo.weather.condition}, {gameInfo.weather.temp}°F
              </text>
            ) : null}
            {gameInfo.broadcasts ? (
              <text size="small" color="neutral-content-strong" alignment="center">
                Broadcast: {gameInfo.broadcasts}
              </text>
            ) : null}
          </hstack>
        ) : null}
      </vstack>
    </vstack>
  );
} 