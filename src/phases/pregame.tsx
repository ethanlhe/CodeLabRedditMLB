import { Devvit } from '@devvit/public-api';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';
import { GameInfo } from '../types/game.ts';

interface PreGameProps {
  gameInfo: GameInfo;
}

export function renderPreGame({ gameInfo }: PreGameProps) {
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

  return (
    <vstack width="100%" maxWidth={600} backgroundColor="neutral-background-weak" padding="large" gap="large">
      {/* Header Section */}
      <vstack width="100%" gap="small">
        <text size="large" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.awayTeam.name} @ {gameInfo.homeTeam.name}</text>
        <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.date} • {gameInfo.currentTime}</text>
        <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.location}</text>
      </vstack>
      {/* Matchup Row */}
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
        {/* VS */}
        <vstack alignment="center middle" gap="small" minWidth={80}>
          <text size="large" weight="bold" color="neutral-content-strong" alignment="center">VS</text>
          <text size="small" color="neutral-content-strong" alignment="center">Scheduled</text>
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
          <text size="medium" weight="bold" alignment="center" color="neutral-content-strong" >{gameInfo.homeTeam.name}</text>
          <text size="small" color="neutral-content-strong" alignment="center">{gameInfo.homeTeam.record}</text>
        </vstack>
      </hstack>
      {/* Details Section */}
      <vstack width="100%" gap="small">
        <text size="medium" color="success-plain" weight="bold" alignment="center">
          Scheduled: {gameInfo.date} at {gameInfo.currentTime}
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