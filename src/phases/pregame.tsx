import { Devvit, useState, useAsync, FormOnSubmitEvent } from '@devvit/public-api';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';
import { GameInfo, Player } from '../types/game.ts';
import { usePagination } from '@devvit/kit';
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';

const REDIS_COUNTDOWN_MATCHES_KEY = 'countdown:matches';
function makeKeyForCountdownUsers(eventId: string) {
  return `countdown:users:${eventId}`;
}

export enum CountdownSubscriptionState {
  SUBSCRIBED,
  AVAILABLE,
  UNAVAILABLE,
}

interface PreGameProps {
  gameInfo: GameInfo;
  voteForTeam: (team: string) => Promise<void>;
  getPollResults: (homeTeam: string, awayTeam: string) => Promise<{
    home: number;
    away: number;
    total: number;
    homePct: number;
    awayPct: number;
  }>;
  homePlayers: Player[];
  awayPlayers: Player[];
  context: Devvit.Context;
}

export function renderPreGame({ gameInfo, voteForTeam, getPollResults, homePlayers, awayPlayers, context }: PreGameProps) {
  console.log(" Home Probable Pitcher", gameInfo.homeTeam.probablePitchers);  const safeHomePlayers = Array.isArray(homePlayers) ? homePlayers : [];
  const safeAwayPlayers = Array.isArray(awayPlayers) ? awayPlayers : [];

  const homePagination = usePagination(context, safeHomePlayers, 5);
  const awayPagination = usePagination(context, safeAwayPlayers, 6);

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

  const [hasVoted, setHasVoted] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'lineups'>('summary');
  const [selectedLineupTeam, setSelectedLineupTeam] = useState<'home' | 'away'>('home');

  const {
    currentPage,
    currentItems,
    toNextPage,
    toPrevPage
  } = selectedLineupTeam === 'home' ? homePagination : awayPagination;
  const [subscriptionState, setSubscriptionState] = useState<CountdownSubscriptionState>(CountdownSubscriptionState.AVAILABLE);

  // Check if user is already subscribed and if match is too close
  const { data: isSubscribed } = useAsync(async () => {
    const userName = context.user?.username || context.userName;
    const eventId = gameInfo.id;
    const users = await context.redis.zRange(makeKeyForCountdownUsers(eventId), 0, -1);
    return users.includes(userName);
  });

  // Set subscription state based on isSubscribed and match time
  useAsync(async () => {
    const startTime = new Date(`${gameInfo.date} ${gameInfo.currentTime}`).getTime();
    if (startTime - Date.now() < 15 * 60 * 1000) {
      setSubscriptionState(CountdownSubscriptionState.UNAVAILABLE);
    } else if (isSubscribed) {
      setSubscriptionState(CountdownSubscriptionState.SUBSCRIBED);
    } else {
      setSubscriptionState(CountdownSubscriptionState.AVAILABLE);
    }
    return null;
  });

  // Handler for Remind Me
  const handleRemindMe = async () => {
    const userName = context.user?.username || context.userName;
    const eventId = gameInfo.id;
    const startTime = new Date(`${gameInfo.date} ${gameInfo.currentTime}`).getTime();
    await context.redis.zAdd(REDIS_COUNTDOWN_MATCHES_KEY, {
      member: eventId,
      score: startTime,
    });
    await context.redis.zAdd(makeKeyForCountdownUsers(eventId), {
      member: userName,
      score: Date.now(),
    });
    setSubscriptionState(CountdownSubscriptionState.SUBSCRIBED);
  };

  const handleVote = async (team: string) => {
    await voteForTeam(team);
    const pollResults = await getPollResults(gameInfo.homeTeam.name, gameInfo.awayTeam.name);
    setHomeVotes(pollResults.home);
    setAwayVotes(pollResults.away);
    setHomePct(pollResults.homePct);
    setAwayPct(pollResults.awayPct);
    setTotalVotes(pollResults.total);
    setHasVoted(true);
  };

  const { loading, error, data: pollResults } = useAsync(
    () => getPollResults(gameInfo.homeTeam.name, gameInfo.awayTeam.name),
  );


  const [homeVotes, setHomeVotes] = useState(pollResults?.home ?? 0);
  const [awayVotes, setAwayVotes] = useState(pollResults?.away ?? 0);
  const [homePct, setHomePct] = useState(pollResults?.homePct ?? 0);
  const [awayPct, setAwayPct] = useState(pollResults?.awayPct ?? 0);
  const [totalVotes, setTotalVotes] = useState(pollResults?.total ?? 0);

  return (
    <vstack width="100%" maxWidth={600} padding="small" gap="small" cornerRadius="large">
      {/* line */}
      <hstack width="100%" height="1px" backgroundColor="#E5EBEE" />
      {/* Tabs Section */}
      <hstack width="100%" gap="small" alignment="center middle">
        <hstack backgroundColor="#E5EBEE" borderColor="#E0E6E9" cornerRadius="full">
          <button
            appearance={selectedTab === 'summary' ? 'secondary' : 'secondary'}
            width="80px"
            height="32px"
            size="small"
            onPress={() => setSelectedTab('summary')}
          >
            Summary
          </button> </hstack>
        <hstack borderColor="#E0E6E9" cornerRadius="full">
          <button
            appearance={selectedTab === 'lineups' ? 'bordered' : 'bordered'}
            width="64px"
            height="32px"
            size="small"
            onPress={() => setSelectedTab('lineups')}
          >
            Roster
          </button> </hstack>
      </hstack>
      {/* Matchup Row */}
      {selectedTab === 'summary' && (
        <>
          <hstack width="100%" alignment="center middle" gap="small" padding="none">
            {/* Away Team */}
            <vstack alignment="center middle" gap="none" padding="none">
              <image
                url={awayLogo || 'fallback.png'}
                imageWidth={48}
                imageHeight={48}
                description={`${gameInfo.awayTeam.name} logo`}
              />
              <text size="medium" weight="bold" alignment="center" color="#0F1A1C">{gameInfo.awayTeam.name}</text>
              <text size="small" color="#0F1A1C" alignment="center">({gameInfo.awayTeam.record})</text>
            </vstack>
            {/* VS */}
            <vstack alignment="center middle" gap="small" minWidth={80}>
              <text size="medium" weight="bold" color="#576F76" alignment="center">vs.</text>
            </vstack>
            {/* Home Team */}
            <vstack alignment="center middle" gap="none" padding="none">
              <image
                url={homeLogo || 'fallback.png'}
                imageWidth={48}
                imageHeight={48}
                description={`${gameInfo.homeTeam.name} logo`}
              />
              <text size="medium" weight="bold" alignment="center" color="#0F1A1C">{gameInfo.homeTeam.name}</text>
              <text size="small" color="#0F1A1C" alignment="center">({gameInfo.homeTeam.record})</text>
            </vstack>
          </hstack>
          <hstack width="100%" height="1px" backgroundColor="#E5EBEE" padding="none" />
        </>
      )}

      {/* Countdown Section */}
      {selectedTab === 'summary' && (
        <vstack width="100%" gap="small" padding="small">
          <text size="small" color="#888" weight="bold" alignment="start">COUNTDOWN</text>
          <hstack gap="medium" alignment="center middle">
            <vstack alignment="center middle" gap="none" backgroundColor="#FFFFFF" width="50px" height="45px" cornerRadius="small">
              <text size="xlarge" weight="bold" color="#000000">{days}</text>
              <text size="xsmall" color="#888">D</text>
            </vstack>
            <text size="large" color="#888" weight="bold">:</text>
            <vstack alignment="center middle" gap="none" backgroundColor="#FFFFFF" width="50px" height="45px" cornerRadius="small">
              <text size="xlarge" weight="bold" color="#000000">{hours}</text>
              <text size="xsmall" color="#888">H</text>
            </vstack>
            <spacer grow />
            {subscriptionState !== CountdownSubscriptionState.UNAVAILABLE && (
              <button
                size="medium"
                appearance="secondary"
                icon={
                  subscriptionState === CountdownSubscriptionState.SUBSCRIBED
                    ? "checkmark-outline"
                    : "notification-outline"
                }
                disabled={subscriptionState === CountdownSubscriptionState.SUBSCRIBED}
                onPress={handleRemindMe}
              >
                {subscriptionState === CountdownSubscriptionState.SUBSCRIBED
                  ? "Reminder set"
                  : "Remind Me"}
              </button>
            )}
          </hstack>
        </vstack>
      )}
      {selectedTab === 'summary' && (
        <hstack width="100%" height="1px" backgroundColor="#E5EBEE" />
      )}

      {/* Poll Section */}

      {selectedTab === 'summary' && (
        <vstack width="100%" gap="small">
          <hstack width="100%" alignment="start middle">
            <text size="small" color="#888" weight="bold">COMMUNITY PREDICTION</text>
            <spacer grow />
            <text size="small" color="#888">{totalVotes} votes</text>
          </hstack>
          {/* Home Team Bar */}
          <hstack width="100%" gap="small" alignment="center middle">
            <spacer grow />
            <vstack width={`${homePct}%`} height="40px" backgroundColor="#B0BEC5" cornerRadius="medium" alignment="center middle">
              <text size="medium" weight="bold" color="#0F1A1C">{homePct}% {gameInfo.homeTeam.name}</text>
            </vstack>
            {!hasVoted && (
              <button appearance="secondary" size="small" onPress={() => handleVote(gameInfo.homeTeam.name)}>
                Vote {gameInfo.homeTeam.name}
              </button>
            )}
            <spacer grow />
          </hstack>
          {/* Away Team Bar */}
          <hstack width="100%" gap="small" alignment="center middle">
            <spacer grow />
            <vstack width={`${awayPct}%`} height="40px" backgroundColor="#FF7043" cornerRadius="medium" alignment="center middle">
              <text size="medium" weight="bold" color="#0F1A1C">{awayPct}% {gameInfo.awayTeam.name}</text>
            </vstack>
            {!hasVoted && (
              <button appearance="secondary" size="small" onPress={() => handleVote(gameInfo.awayTeam.name)}>
                Vote {gameInfo.awayTeam.name}
              </button>
            )}
            <spacer grow />
          </hstack>
        </vstack>
      )}
      {selectedTab === 'summary' && (
        <hstack width="100%" height="1px" backgroundColor="#E5EBEE" />
      )}

      {/* Probable Pitchers Section */}
      {selectedTab === 'summary' && (
        <vstack>
          <text size="small" weight="bold" color="#576F76">PROBABLE PITCHERS</text>
          <text size="small">{(gameInfo.probablePitchers?.away || 'TBD') + ' vs. ' + (gameInfo.probablePitchers?.home || 'TBD')}</text>
        </vstack>
      )}
      {/* Home Players Section - only show when Lineups is selected */}
      {selectedTab === 'lineups' && (
        <vstack width="100%" gap="none" backgroundColor="#FAFAFA" cornerRadius="medium" padding="none">
          {/* Team Switch Buttons at Top */}
          <hstack width="100%" alignment="start middle" gap="small" padding="small">
            <hstack backgroundColor="#E5EBEE" borderColor="#E0E6E9" cornerRadius="full">
              <button
                appearance={selectedLineupTeam === 'home' ? 'secondary' : 'secondary'}
                width="80px"
                height="32px"
                size="small"
                onPress={() => setSelectedLineupTeam('home')}
              >
                {gameInfo.homeTeam.name}
              </button>
            </hstack>
            <hstack borderColor="#E0E6E9" cornerRadius="full">
              <button
                appearance={selectedLineupTeam === 'away' ? 'bordered' : 'bordered'}
                width="64px"
                height="32px"
                size="small"
                onPress={() => setSelectedLineupTeam('away')}
              >
                {gameInfo.awayTeam.name}
              </button>
            </hstack>
          </hstack>
          {/* Table Header */}
          <hstack width="100%" gap="medium" alignment="start middle" padding="xsmall">
            <text size="small" weight="bold" color="#000000" width="120px">Players</text>
            <text size="small" weight="bold" color="#000000" width="45px">AB</text>
            <text size="small" weight="bold" color="#000000" width="45px">R</text>
            <text size="small" weight="bold" color="#000000" width="45px">H</text>
            <text size="small" weight="bold" color="#000000" width="45px">RBI</text>
            <text size="small" weight="bold" color="#000000" width="45px">HR</text>
            <text size="small" weight="bold" color="#000000" width="45px">BB</text>
            <text size="small" weight="bold" color="#000000" width="45px">K</text>
            <text size="small" weight="bold" color="#000000" width="45px">AVG</text>
            <text size="small" weight="bold" color="#000000" width="45px">OBP</text>
            <text size="small" weight="bold" color="#000000" width="45px">SLP</text>
          </hstack>
          {/* Table Rows */}
          {(selectedLineupTeam === 'home' ? homePlayers : awayPlayers).map((player, idx) => (
            <hstack key={String(idx)} width="100%" gap="medium" alignment="start middle" padding="xsmall" backgroundColor={idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF"}>
              <hstack gap="small" width="120px">
                <text size="small" color="#000000">{player.first_name[0]}. {player.last_name}</text>
                <text size="small" color="#5A7684">{player.primary_position}</text>
              </hstack>
              <text size="small" color="#000000" width="45px">2</text>
              <text size="small" color="#000000" width="45px">0</text>
              <text size="small" color="#000000" width="45px">0</text>
              <text size="small" color="#000000" width="45px">0</text>
              <text size="small" color="#000000" width="45px">0</text>
              <text size="small" color="#000000" width="45px">0</text>
              <text size="small" color="#000000" width="45px">0</text>
              <text size="small" color="#000000" width="45px">-</text>
              <text size="small" color="#000000" width="45px">-</text>
              <text size="small" color="#000000" width="45px">-</text>
            </hstack>
          ))}
        </vstack>
      )
      }
        <>
          <hstack width="100%" gap="small" alignment="center middle">
            <button
              appearance={selectedLineupTeam === 'home' ? 'primary' : 'secondary'}
              size="medium"
              onPress={() => setSelectedLineupTeam('home')}
            >
              {gameInfo.homeTeam.name}
            </button>
            <button
              appearance={selectedLineupTeam === 'away' ? 'primary' : 'secondary'}
              size="medium"
              onPress={() => setSelectedLineupTeam('away')}
            >
              {gameInfo.awayTeam.name}
            </button>
          </hstack>

          // Home Players Section
          {selectedLineupTeam === 'home' && homePlayers && homePlayers.length > 0 && (
            <vstack width="100%" gap="small" padding="small">
              <text size="small" weight="bold" color="#576F76">Players</text>
              {/* Rendering items for the current page */}
              <vstack gap="small" padding="small" minHeight="150px">
                {currentItems.map((player, idx) => (
                <hstack key={String(idx)} gap="small" alignment="start middle">
                  <text size="small" weight="bold" color="#000000">{player.first_name} {player.last_name}</text>
                  <text size="small" color="#000000">{player.primary_position}</text>
                </hstack>
              ))}
              </vstack>

              {/* Rendering pagination controls */}
              <hstack alignment="middle center" gap="small">
                <button onPress={toPrevPage} icon="up"/>
                <text>{currentPage}</text>
                <button onPress={toNextPage} icon="down"/>
              </hstack>
            </vstack>
          )}

          // Away Players Section
          {selectedLineupTeam === 'away' && awayPlayers && awayPlayers.length > 0 && (
            <vstack width="100%" gap="small" padding="small">
              <text size="small" weight="bold" color="#576F76">Players</text>
              {/* Rendering items for the current page */}
              <vstack gap="small" padding="small" minHeight="150px">
                {currentItems.map((player, idx) => (
                <hstack key={String(idx)} gap="small" alignment="start middle">
                  <text size="small" weight="bold" color="#000000">{player.first_name} {player.last_name}</text>
                  <text size="small" color="#000000">{player.primary_position}</text>
                </hstack>
              ))}
              </vstack>

              {/* Rendering pagination controls */}
              <hstack alignment="middle center" gap="small">
                <button onPress={toPrevPage} icon="up"/>
                <text>{currentPage}</text>
                <button onPress={toNextPage} icon="down"/>
              </hstack>
            </vstack>
          )} 
        </>

    </vstack >
  );
}

function getCountdown(scheduled: string, currentTime: string, timezone: string): { days: number; hours: number; } {
  // Combine scheduled date and time
  // Assume scheduled is in format 'April 17, 2024' and currentTime is '10:15 AM'
  // timezone is e.g. 'America/New_York'
  const scheduledDateTimeString = `${scheduled} ${currentTime}`;
  // Try to parse with luxon
  let gameTime = DateTime.fromFormat(scheduledDateTimeString, 'MMMM d, yyyy h:mm a', { zone: timezone });
  if (!gameTime.isValid) {
    // Try fallback format
    gameTime = DateTime.fromFormat(scheduledDateTimeString, 'MMMM d yyyy h:mm a', { zone: timezone });
  }
  const now = DateTime.now().setZone(timezone);
  const diff = gameTime.diff(now, ['days', 'hours', 'minutes']).toObject();
  return {
    days: Math.max(0, Math.floor(diff.days ?? 0)),
    hours: Math.max(0, Math.floor(diff.hours ?? 0)),
  };
}
