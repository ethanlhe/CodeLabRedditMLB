import { Devvit, useState } from '@devvit/public-api';
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

  const { days, hours } = getCountdown(gameInfo.date, gameInfo.currentTime, gameInfo.timezone);


  return (
    <vstack width="100%" maxWidth={600} padding="large" gap="large" cornerRadius="large">
      {/* line */}
      <hstack width="100%" height="1px" backgroundColor="#000000" />
      {/* tabs */}
      <hstack width="100%" gap="small" alignment="center middle">
        <button appearance="primary" size="medium">Summary</button>
        <button appearance="secondary" size="medium">Lineups</button>
      </hstack>
      {/* Tabs Section */}
      <hstack width="100%" gap="small" alignment="center middle">
        <button appearance="primary" size="medium">Summary</button>
        <button appearance="secondary" size="medium">Lineups</button>
      </hstack>
      {/* Matchup Row */}
      <hstack width="100%" alignment="center middle" gap="large" padding="small">
        {/* Away Team */}
        <vstack alignment="center middle" gap="small">
          <image
            url={awayLogo || 'fallback.png'}
            imageWidth={48}
            imageHeight={48}
            description={`${gameInfo.awayTeam.name} logo`}
          />
          <text size="medium" weight="bold" alignment="center" color="#0F1A1C">{gameInfo.awayTeam.name}</text>
          <text size="small" color="#0F1A1C" alignment="center">{gameInfo.awayTeam.record}</text>
        </vstack>
        {/* VS */}
        <vstack alignment="center middle" gap="small" minWidth={80}>
          <text size="large" weight="bold" color="#0F1A1C" alignment="center">vs.</text>
        </vstack>
        {/* Home Team */}
        <vstack alignment="center middle" gap="small">
          <image
            url={homeLogo || 'fallback.png'}
            imageWidth={48}
            imageHeight={48}
            description={`${gameInfo.homeTeam.name} logo`}
          />
          <text size="medium" weight="bold" alignment="center" color="#0F1A1C">{gameInfo.homeTeam.name}</text>
          <text size="small" color="#0F1A1C" alignment="center">{gameInfo.homeTeam.record}</text>
        </vstack>
      </hstack>

      {/* Countdown Section */}
      <vstack width="100%" gap="small">
        <text size="small" color="#888" weight="bold" alignment="start">COUNTDOWN</text>
        <hstack gap="medium" alignment="center middle">
          <vstack alignment="center middle" gap="none">
            <text size="xlarge" weight="bold">{days}</text>
            <text size="xsmall" color="#888">D</text>
          </vstack>
          <text size="large" color="#888">:</text>
          <vstack alignment="center middle" gap="none" backgroundColor="#FFFFFF">
            <text size="xlarge" weight="bold">{hours}</text>
            <text size="xsmall" color="#888">H</text>
          </vstack>
          <spacer />s
          <button appearance="secondary" size="medium">🔔 Remind Me</button>
        </hstack>
      </vstack>

      {/* Poll Section */}
      <vstack width="100%" gap="small">
        <hstack width="100%" alignment="start middle">
          <text size="small" color="#888" weight="bold">COMMUNITY PREDICTION</text>
          <spacer />
          {/* <text size="small" color="#888">{totalVotes} votes</text> */}
        </hstack>
        {/* Giants Bar */}
        <hstack width="100%" gap="small" alignment="center middle">
          {/* <vstack width={`${giantsPct}%`} height={32} backgroundColor="#B0BEC5" cornerRadius="medium" alignment="center middle">
            <text size="medium" weight="bold" color="#222">{giantsPct}% Giants</text>
          </vstack> */}
          {/* <button appearance="secondary" size="small" onPress={() => vote('giants')}>Vote Giants</button> */}
        </hstack>
        {/* Phillies Bar */}
        <hstack width="100%" gap="small" alignment="center middle">
          {/* <vstack width={`${philliesPct}%`} height={32} backgroundColor="#FF7043" cornerRadius="medium" alignment="center middle">
            <text size="medium" weight="bold" color="#fff">{philliesPct}% Phillies</text>
          </vstack> */}
          {/* <button appearance="secondary" size="small" onPress={() => vote('phillies')}>Vote Phillies</button> */}
        </hstack>
      </vstack>

      {/* Details Section */}
      <vstack width="100%" gap="small">
        <text size="medium" color="success-plain" weight="bold" alignment="center">
          Scheduled: {gameInfo.date} at {gameInfo.currentTime}
        </text>
      </vstack>
    </vstack>
  );
}

function getCountdown(scheduled: string, currentTime: string, timezone: string): { days: number; hours: number; } {
  const now = new Date();

  // Combine scheduled date and currentTime into a single string
  const scheduledDateTime = `${scheduled} ${currentTime}`;
  // Parse the game time in the game's timezone and convert to UTC
  const gameTimeString = new Date(
    new Date(scheduledDateTime).toLocaleString("en-US", { timeZone: timezone })
  );

  const diff = gameTimeString.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  return { days, hours };
}

async function voteForTeam(context: Devvit.Context, team: 'giants' | 'phillies') {
  // Watch both keys to ensure atomicity
  const txn = await context.redis.watch(`poll:giants`, `poll:phillies`);
  await txn.multi();
  await txn.incrBy(`poll:${team}`, 1); // Increment the selected team's votes
  await txn.exec();
}

async function getPollResults(context: Devvit.Context) {
  const [giants, phillies] = await context.redis.mGet(['poll:giants', 'poll:phillies']);
  const giantsVotes = parseInt(giants ?? '0', 10);
  const philliesVotes = parseInt(phillies ?? '0', 10);
  const total = giantsVotes + philliesVotes;
  return {
    giants: giantsVotes,
    phillies: philliesVotes,
    total,
    giantsPct: total ? Math.round((giantsVotes / total) * 100) : 0,
    philliesPct: total ? Math.round((philliesVotes / total) * 100) : 0,
  };
}