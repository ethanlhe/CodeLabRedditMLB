import { Devvit, useState, useAsync, FormOnSubmitEvent } from '@devvit/public-api';
import { MLB_LOGOS } from '../../assets/logos/mlb.ts';
import { GameInfo, Player } from '../../types/game.ts';
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
  context: any;
}

export function renderPreGame({ gameInfo, voteForTeam, getPollResults, homePlayers, awayPlayers, context }: PreGameProps) {
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

  // Memoize countdown calculation to prevent infinite loops
  const { data: countdown } = useAsync(async () => {
    return getCountdown(gameInfo.date, gameInfo.currentTime, gameInfo.timezone);
  });

  const days = countdown?.days ?? 0;
  const hours = countdown?.hours ?? 0;

  const [hasVoted, setHasVoted] = useState(false);

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
      {/* Matchup Row */}
      <hstack width="100%" alignment="center middle" gap="small" padding="none">
        {/* Away Team */}
        <vstack alignment="center middle" gap="none" padding="none">
          <image
            url={awayLogo || 'fallback.png'}
            imageWidth={48}
            imageHeight={48}
            description={`${gameInfo.awayTeam.name} logo`}
          />
          <text size="medium" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.awayTeam.name}</text>
          <text size="small" color="neutral-content-strong" alignment="center">({gameInfo.awayTeam.record})</text>
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
          <text size="medium" weight="bold" alignment="center" color="neutral-content-strong">{gameInfo.homeTeam.name}</text>
          <text size="small" color="neutral-content-strong" alignment="center">({gameInfo.homeTeam.record})</text>
        </vstack>
      </hstack>
      <hstack width="100%" height="1px" backgroundColor="neutral-border-weak" padding="none" />

      {/* Countdown Section */}
      <vstack width="100%" gap="small">
        <text size="small" color="#888" weight="bold" alignment="start">COUNTDOWN</text>
        <hstack gap="medium" alignment="center middle">
          <vstack alignment="center middle" gap="none" backgroundColor="neutral-background" width="50px" height="45px" cornerRadius="small">
            <text size="xlarge" weight="bold" color="neutral-content-strong">{days}</text>
            <text size="xsmall" color="#888">D</text>
          </vstack>
          <text size="large" color="#888" weight="bold">:</text>
          <vstack alignment="center middle" gap="none" backgroundColor="neutral-background" width="50px" height="45px" cornerRadius="small">
            <text size="xlarge" weight="bold" color="neutral-content-strong">{hours}</text>
            <text size="xsmall" color="#888">H</text>
          </vstack>
          <spacer grow />
          {subscriptionState !== CountdownSubscriptionState.UNAVAILABLE && (
            <button
              size="small"
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
      <hstack width="100%" height="1px" backgroundColor="neutral-border-weak" />

      {/* Poll Section */}
      <vstack width="100%" gap="small">
        <hstack width="100%" alignment="start middle">
          <text size="small" color="#888" weight="bold">COMMUNITY PREDICTION</text>
          <spacer grow />
          <text size="small" color="#888">{totalVotes} votes</text>
        </hstack>
        {/* Vote Buttons */}
        <hstack width="100%" gap="small" alignment="center middle">
          <spacer grow />
          {!hasVoted && (
            <button appearance="secondary" size="small" onPress={() => handleVote(gameInfo.homeTeam.name)}>
              Vote for {gameInfo.homeTeam.name}
            </button>
          )}
          {!hasVoted && (
            <button appearance="secondary" size="small" onPress={() => handleVote(gameInfo.awayTeam.name)}>
              Vote for {gameInfo.awayTeam.name}
            </button>
          )}
          <spacer grow />
        </hstack>
        {/* Home Team Bar */}
        <hstack width="100%" gap="small" alignment="center middle">
          <spacer grow />
          <vstack width={`${homePct}%`} height="40px" backgroundColor="#B0BEC5" cornerRadius="medium" alignment="center middle">
            <text size="medium" weight="bold" color="#0F1A1C">{homePct}% {gameInfo.homeTeam.name}</text>
          </vstack>
          <spacer grow />
        </hstack>
        {/* Away Team Bar */}
        <hstack width="100%" gap="small" alignment="center middle">
          <spacer grow />
          <vstack width={`${awayPct}%`} height="40px" backgroundColor="#FF7043" cornerRadius="medium" alignment="center middle">
            <text size="medium" weight="bold" color="#0F1A1C">{awayPct}% {gameInfo.awayTeam.name}</text>
          </vstack>
          <spacer grow />
        </hstack>
      </vstack>
    </vstack>
  );
}

function getCountdown(scheduled: string, currentTime: string, timezone: string): { days: number; hours: number; } {
  try {
    // Combine scheduled date and time
    const scheduledDateTimeString = `${scheduled} ${currentTime}`;
    
    // Try to parse with luxon using the actual format
    let gameTime = DateTime.fromFormat(scheduledDateTimeString, 'EEEE, MMMM d, yyyy h:mm a', { zone: timezone });
    if (!gameTime.isValid) {
      // Try fallback format without comma after day
      gameTime = DateTime.fromFormat(scheduledDateTimeString, 'EEEE, MMMM d yyyy h:mm a', { zone: timezone });
    }
    if (!gameTime.isValid) {
      // Try another fallback format
      gameTime = DateTime.fromFormat(scheduledDateTimeString, 'MMMM d, yyyy h:mm a', { zone: timezone });
    }
    if (!gameTime.isValid) {
      // Try parsing just the date part first, then add time
      const dateOnly = DateTime.fromFormat(scheduled, 'EEEE, MMMM d, yyyy', { zone: timezone });
      if (dateOnly.isValid) {
        const timeOnly = DateTime.fromFormat(currentTime, 'h:mm a', { zone: timezone });
        if (timeOnly.isValid) {
          gameTime = dateOnly.set({
            hour: timeOnly.hour,
            minute: timeOnly.minute
          });
        }
      }
    }
    if (!gameTime.isValid) {
      // If all parsing fails, return 0 values
      console.warn('Failed to parse game time:', scheduledDateTimeString);
      return { days: 0, hours: 0 };
    }
    
    const now = DateTime.now().setZone(timezone);
    const diff = gameTime.diff(now, ['days', 'hours']).toObject();
    
    return {
      days: Math.max(0, Math.floor(diff.days ?? 0)),
      hours: Math.max(0, Math.floor(diff.hours ?? 0)),
    };
  } catch (error) {
    console.error('Error calculating countdown:', error);
    return { days: 0, hours: 0 };
  }
}
