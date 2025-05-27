import { Devvit, useState, useAsync } from '@devvit/public-api';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';
import { GameInfo, Player } from '../types/game.ts';


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
}

export function renderPreGame({ gameInfo, voteForTeam, getPollResults, homePlayers, awayPlayers }: PreGameProps) {


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
    <vstack width="100%" maxWidth={600} padding="medium" gap="large" cornerRadius="large">
      {/* line */}
      <hstack width="100%" height="1px" backgroundColor="#000000" />
      {/* Tabs Section */}
      <hstack width="100%" gap="small" alignment="center middle">
        <button
          appearance={selectedTab === 'summary' ? 'primary' : 'secondary'}
          size="medium"
          onPress={() => setSelectedTab('summary')}
        >
          Summary
        </button>
        <button
          appearance={selectedTab === 'lineups' ? 'primary' : 'secondary'}
          size="medium"
          onPress={() => setSelectedTab('lineups')}
        >
          Lineups
        </button>
      </hstack>
      {/* Matchup Row */}
      {selectedTab === 'summary' && (
        <>
          <hstack width="100%" alignment="center middle" gap="small" padding="small">
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
          <hstack width="100%" height="1px" backgroundColor="#000000" />
        </>
      )}

      {/* Countdown Section */}
      {selectedTab === 'summary' && (
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
      )}
      {selectedTab === 'summary' && (
        <hstack width="100%" height="1px" backgroundColor="#000000" />
      )}

      {/* Poll Section */}
      {selectedTab === 'summary' && (
        <vstack width="100%" gap="small">
          <hstack width="100%" alignment="start middle">
            <text size="small" color="#888" weight="bold">COMMUNITY PREDICTION</text>
            <spacer />
            <text size="small" color="#888">{totalVotes} votes</text>
          </hstack>
          {/* Home Team Bar */}
          <hstack width="100%" gap="small" alignment="center middle">
            <vstack width={`${homePct}%`} height={32} backgroundColor="#B0BEC5" cornerRadius="medium" alignment="center middle">
              <text size="medium" weight="bold" color="#0F1A1C">{homePct}% {gameInfo.homeTeam.name}</text>
            </vstack>
            {!hasVoted && (
              <button appearance="secondary" size="small" onPress={() => handleVote(gameInfo.homeTeam.name)}>
                Vote {gameInfo.homeTeam.name}
              </button>
            )}
          </hstack>
          {/* Away Team Bar */}
          <hstack width="100%" gap="small" alignment="center middle">
            <vstack width={`${awayPct}%`} height={32} backgroundColor="#FF7043" cornerRadius="medium" alignment="center middle">
              <text size="medium" weight="bold" color="#0F1A1C">{awayPct}% {gameInfo.awayTeam.name}</text>
            </vstack>
            {!hasVoted && (
              <button appearance="secondary" size="small" onPress={() => handleVote(gameInfo.awayTeam.name)}>
                Vote {gameInfo.awayTeam.name}
              </button>
            )}
          </hstack>
        </vstack>
      )}
      {selectedTab === 'summary' && (
        <hstack width="100%" height="1px" backgroundColor="#000000" />
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
          {selectedLineupTeam === 'home' && homePlayers && homePlayers.length > 0 && (
            <vstack width="100%" gap="small" padding="small">
              <text size="small" weight="bold" color="#576F76">Players</text>
              {homePlayers.map((player, idx) => (
                <hstack key={String(idx)} gap="small" alignment="start middle">
                  <text size="small" weight="bold" color="#000000">{player.first_name} {player.last_name}</text>
                  <text size="small" color="#000000">{player.primary_position}</text>
                </hstack>
              ))}
            </vstack>
          )}
          {selectedLineupTeam === 'away' && awayPlayers && awayPlayers.length > 0 && (
            <vstack width="100%" gap="small" padding="small">
              <text size="small" weight="bold" color="#576F76">Players</text>
              {awayPlayers.map((player, idx) => (
                <hstack key={String(idx)} gap="small" alignment="start middle">
                  <text size="small" weight="bold" color="#000000">{player.first_name} {player.last_name}</text>
                  <text size="small" color="#000000">{player.primary_position}</text>
                </hstack>
              ))}
            </vstack>
          )}
        </>
      )}

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
