import { Devvit, useState } from '@devvit/public-api';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';
import { GameInfo } from '../types/game.ts';
import { parsePlayByPlay } from '../utils/gameParsers.js';

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
      <spacer size="small" />
      <hstack width="100%" backgroundColor="neutral-border-weak" height="1px" />
      <spacer size="small" />
      {/* Inning-by-inning scoring */}
      {gameInfo.scoring ? (
        <vstack gap="small" width="100%">
          <hstack gap="medium" alignment="center middle">
            <text size="xsmall" weight="bold" color="neutral-content-weak">TEAM</text>
            <spacer grow />
            {gameInfo.scoring.home.map((inning, idx, arr) => (
              <text key={String(idx)} size="xsmall" weight="bold" color="neutral-content-weak" minWidth={idx === arr.length - 1 ? 12 : 6}>{String(inning.number ?? '')}</text>
            ))}

           <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={7}>R</text>
            <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={7}>H</text>
            <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={2}>E</text>
          </hstack>
          {/* Away team row */}
          <hstack gap="medium" alignment="center middle">
            <text size="small" weight="bold">{gameInfo.awayTeam.abbreviation ?? ''}</text>
            <spacer grow />
            {gameInfo.scoring.away.map((inning, idx, arr) => (
              <text key={String(idx)} size="small" minWidth={idx === arr.length - 1 ? 12 : 6}>{String(inning.runs ?? '')}</text>
            ))}

            <text size="small" minWidth={7}>{String(gameInfo.teamStats?.away.R ?? '')}</text>
            <text size="small" minWidth={7}>{String(gameInfo.teamStats?.away.H ?? '')}</text>
            <text size="small" minWidth={2}>{String(gameInfo.teamStats?.away.E ?? '')}</text>
          </hstack>
          <hstack width="100%" backgroundColor="neutral-border-weak" height="1px" />
          {/* Home team row */}
          <hstack gap="medium" alignment="center middle">
            <text size="small" weight="bold">{gameInfo.homeTeam.abbreviation ?? ''}</text>
            <spacer grow />
            {gameInfo.scoring.home.map((inning, idx, arr) => (
              <text key={String(idx)} size="small" minWidth={idx === arr.length - 1 ? 12 : 6}>{String(inning.runs ?? '')}</text>
            ))}

            <text size="small" minWidth={7}>{String(gameInfo.teamStats?.home.R ?? '')}</text>
            <text size="small" minWidth={7}>{String(gameInfo.teamStats?.home.H ?? '')}</text>
            <text size="small" minWidth={2}>{String(gameInfo.teamStats?.home.E ?? '')}</text>
          </hstack>
        </vstack>
      ) : null}
      <spacer size="small" />
      <hstack width="100%" backgroundColor="neutral-border" height="1px" />
      <spacer size="medium" />
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
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={11}>LOB</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>E</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>K</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={8}>SO</text>
          <text size="xsmall" weight="bold" color="neutral-content-weak" minWidth={2}>BB</text>
        </hstack>
        {/* Away team row */}
        <hstack gap="medium" alignment="center middle">
          <text size="small" weight="bold">{gameInfo.awayTeam.abbreviation}</text>
          <spacer grow />
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.R}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.H}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.HR}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.TB}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.SB}</text>
          <text size="small" color="neutral-content-strong" minWidth={11}>{gameInfo.teamStats?.away.LOB}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.E}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.K}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.away.SO}</text>
          <text size="small" color="neutral-content-strong" minWidth={2}>{gameInfo.teamStats?.away.BB}</text>
        </hstack>
        <hstack width="100%" backgroundColor="neutral-border-weak" height="1px" />
        {/* Home team row */}
        <hstack gap="medium" alignment="center middle">
          <text size="small" weight="bold">{gameInfo.homeTeam.abbreviation}</text>
          <spacer grow />
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.R}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.H}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.HR}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.TB}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.SB}</text>
          <text size="small" color="neutral-content-strong" minWidth={11}>{gameInfo.teamStats?.home.LOB}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.E}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.K}</text>
          <text size="small" color="neutral-content-strong" minWidth={8}>{gameInfo.teamStats?.home.SO}</text>
          <text size="small" color="neutral-content-strong" minWidth={2}>{gameInfo.teamStats?.home.BB}</text>
        </hstack>
      </vstack>
    </vstack>
  );
}

// Pagination hook for vertical (up/down) navigation
function useVerticalPagination<ItemType>(items: ItemType[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const pagesCount = Math.ceil(items.length / itemsPerPage);
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pagesCount - 1;
  return {
    currentPage,
    pagesCount,
    currentItems: items.slice(
      currentPage * itemsPerPage,
      currentPage * itemsPerPage + itemsPerPage
    ),
    isFirstPage,
    isLastPage,
    toPrevPage: isFirstPage ? undefined : () => setCurrentPage(currentPage - 1),
    toNextPage: isLastPage ? undefined : () => setCurrentPage(currentPage + 1),
  };
}

export function PlayByPlayTab({ playByPlayData }: { playByPlayData: string | null }) {
  if (!playByPlayData) {
    return <text color="red">No play-by-play data available.</text>;
  }
  let parsed = [];
  try {
    const raw = typeof playByPlayData === 'string' ? JSON.parse(playByPlayData) : playByPlayData;
    parsed = parsePlayByPlay(raw);
  } catch (e) {
    // Only log parsing errors
    console.error('[PlayByPlayTab] Error parsing playByPlayData:', e);
    return <text color="red">Error parsing play-by-play data.</text>;
  }
  if (!parsed.length) {
    return <text color="red">No play-by-play events found.</text>;
  }
  // Helper for ordinal
  const ordinal = (n: number) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  // Vertical pagination: 3 half-innings per page
  const { currentItems, currentPage, pagesCount, toPrevPage, toNextPage, isFirstPage, isLastPage } = useVerticalPagination(parsed, 1);

  return (
    <vstack gap="small" width="100%" minHeight="400px">
      {currentItems.map((half, idx) => (
        <vstack key={String(idx)} gap="small" width="100%">
          <hstack gap="small" alignment="center middle" padding="small">
            <text size="large" weight="bold">{half.team} - {half.half === 'T' ? 'Top' : 'Bottom'} {ordinal(half.inning)}</text>
          </hstack>
          <vstack width="100%" backgroundColor="neutral-background-weak" padding="small" gap="small" cornerRadius="medium">
            {half.plays.map((play: any, pidx: number) => (
              <text key={String(pidx)} size="medium">{play.description}</text>
            ))}
          </vstack>
        </vstack>
      ))}
      <spacer grow />
      {/* Pagination controls */}
      <hstack alignment="middle center" gap="small" backgroundColor="neutral-background-weak" padding="large">
        <button onPress={toPrevPage} icon="left" disabled={isFirstPage} />
        <text size="large" weight="bold">{currentPage + 1} / {pagesCount}</text>
        <button onPress={toNextPage} icon="right" disabled={isLastPage} />
      </hstack>
    </vstack>
  );
} 