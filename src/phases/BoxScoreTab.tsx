import { Devvit, useState } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';

interface BoxScoreTabProps {
  gameInfo: GameInfo;
  extendedSummaryData: any;
}

interface PlayerStats {
  name: string;
  pos: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  lob: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
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

export function BoxScoreTab({ gameInfo, extendedSummaryData }: BoxScoreTabProps) {
  if (!extendedSummaryData) {
    return <text color="red">No boxscore data available.</text>;
  }

  // Extract player stats from extended summary data
  const homePlayers = extendedSummaryData.game?.home?.players || [];
  const awayPlayers = extendedSummaryData.game?.away?.players || [];

  // Helper function to format decimal numbers
  const formatDecimal = (num: number): string => {
    return isNaN(num) ? '.000' : num.toFixed(3);
  };

  // Helper function to format player stats
  const formatPlayerStats = (player: any): PlayerStats => {
    const stats = player.statistics?.hitting?.overall || {};
    return {
      name: player.full_name || 'Unknown',
      pos: player.position || '-',
      ab: Number(stats.ab) || 0,
      r: Number(stats.runs?.total) || 0,
      h: Number(stats.onbase?.h) || 0,
      rbi: Number(stats.rbi) || 0,
      bb: Number(stats.onbase?.bb) || 0,
      so: Number(stats.outcome?.ktotal) || 0,
      lob: Number(stats.lob) || 0,
      avg: Number(stats.avg) || 0,
      obp: Number(stats.obp) || 0,
      slg: Number(stats.slg) || 0,
      ops: Number(stats.ops) || 0,
    };
  };

  // Sort players by batting order
  const sortPlayers = (players: any[]): PlayerStats[] => {
    return players
      .filter(p => p.statistics?.hitting?.overall)
      .map(formatPlayerStats)
      .sort((a, b) => b.ab - a.ab);
  };

  const homePlayerStats = sortPlayers(homePlayers);
  const awayPlayerStats = sortPlayers(awayPlayers);

  // Team switcher state
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('away');

  // Pagination for player stats
  const players = selectedTeam === 'away' ? awayPlayerStats : homePlayerStats;
  const { currentItems, currentPage, pagesCount, toPrevPage, toNextPage, isFirstPage, isLastPage } =
    useVerticalPagination(players, 8); // Show 8 players per page

  // Render team switcher tabs
  const teamTabs = (
    <hstack gap="small" alignment="center middle">
      {(['away', 'home'] as const).map(teamKey => (
        <hstack
          key={teamKey}
          backgroundColor="neutral-background-weak"
          borderColor="neutral-border-weak"
          cornerRadius="full"
        >
          <button
            size="small"
            appearance={selectedTeam === teamKey ? 'secondary' : 'plain'}
            onPress={() => setSelectedTeam(teamKey)}
          >
            {teamKey === 'away' ? gameInfo.awayTeam.name : gameInfo.homeTeam.name}
          </button>
        </hstack>
      ))}
    </hstack>
  );

  // Render player stats table
  const renderPlayerStatsTable = (players: PlayerStats[], teamName: string) => (
    <vstack width="100%" maxHeight="320px">
      <text size="medium" weight="bold">{teamName} Hitting</text>
      {/* Header */}
      <hstack gap="small" padding="small" backgroundColor="neutral-background-weak">
        <text size="xsmall" weight="bold" width="120px">PLAYER</text>
        <text size="xsmall" weight="bold" width="20px">AB</text>
        <text size="xsmall" weight="bold" width="20px">R</text>
        <text size="xsmall" weight="bold" width="20px">H</text>
        <text size="xsmall" weight="bold" width="20px">RBI</text>
        <text size="xsmall" weight="bold" width="20px">BB</text>
        <text size="xsmall" weight="bold" width="20px">SO</text>
        <text size="xsmall" weight="bold" width="30px">LOB</text>
        <text size="xsmall" weight="bold" width="40px">AVG</text>
        <text size="xsmall" weight="bold" width="40px">OBP</text>
        <text size="xsmall" weight="bold" width="40px">SLG</text>
        <text size="xsmall" weight="bold" width="40px">OPS</text>
      </hstack>
      {/* Player rows */}
      {players.map((player, idx) => (
        <hstack key={String(idx)} gap="small" padding="small">
          <text size="small" width="120px">{player.name}</text>
          <text size="small" width="20px">{player.ab.toString()}</text>
          <text size="small" width="20px">{player.r.toString()}</text>
          <text size="small" width="20px">{player.h.toString()}</text>
          <text size="small" width="20px">{player.rbi.toString()}</text>
          <text size="small" width="20px">{player.bb.toString()}</text>
          <text size="small" width="20px">{player.so.toString()}</text>
          <text size="small" width="30px">{player.lob.toString()}</text>
          <text size="small" width="40px">{formatDecimal(player.avg)}</text>
          <text size="small" width="40px">{formatDecimal(player.obp)}</text>
          <text size="small" width="40px">{formatDecimal(player.slg)}</text>
          <text size="small" width="40px">{formatDecimal(player.ops)}</text>
        </hstack>
      ))}
    </vstack>
  );

  // Show only the selected team's table with pagination
  return (
    <vstack width="100%" height="380px">
      {renderPlayerStatsTable(currentItems, selectedTeam === 'away' ? gameInfo.awayTeam.name : gameInfo.homeTeam.name)}
      <spacer grow />
      <hstack alignment="end middle" padding="small" gap="small" backgroundColor="neutral-background-weak">
        {teamTabs}
        <spacer grow />
        <button onPress={toPrevPage} icon="up" disabled={isFirstPage} />
        <button onPress={toNextPage} icon="down" disabled={isLastPage} />
      </hstack>
    </vstack>
  );
} 