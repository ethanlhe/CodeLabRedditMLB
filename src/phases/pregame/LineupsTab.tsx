import { Devvit, useState } from '@devvit/public-api';
import { GameInfo, Player } from '../../types/game.ts';

interface LineupsTabProps {
  gameInfo: GameInfo;
  homePlayers: Player[];
  awayPlayers: Player[];
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

export function LineupsTab({ gameInfo, homePlayers, awayPlayers }: LineupsTabProps) {
  const safeHomePlayers = Array.isArray(homePlayers) ? homePlayers : [];
  const safeAwayPlayers = Array.isArray(awayPlayers) ? awayPlayers : [];

  const homePagination = useVerticalPagination(safeHomePlayers, 10);
  const awayPagination = useVerticalPagination(safeAwayPlayers, 10);

  const [selectedLineupTeam, setSelectedLineupTeam] = useState<'home' | 'away'>('home');

  const {
    currentPage,
    currentItems,
    toNextPage,
    toPrevPage
  } = selectedLineupTeam === 'home' ? homePagination : awayPagination;

  return (
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
      {(selectedLineupTeam === 'home' ? homePagination : awayPagination).currentItems.map((player: Player, idx: number) => {
        return (
          <hstack key={String(idx)} width="100%" gap="medium" alignment="start middle" padding="xsmall" backgroundColor={idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF"}>
            <hstack gap="small" width="120px">
              <text size="small" color="#000000">{player.firstName[0]}. {player.lastName}</text>
              <text size="small" color="#5A7684">{player.primaryPosition}</text>
            </hstack>
            <text size="small" color="#000000" width="45px">{player.ab ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.r ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.h ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.rbi ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.hr ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.bb ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.k ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.avg ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.obp ?? '-'}</text>
            <text size="small" color="#000000" width="45px">{player.slg ?? '-'}</text>
          </hstack>
        );
      })}
      {/* Rendering pagination controls */}
      <hstack alignment="middle center" gap="small" padding="medium">
        <button onPress={(selectedLineupTeam === 'home' ? homePagination : awayPagination).toPrevPage} icon="up"/>
        <text>{currentPage}</text>
        <button onPress={(selectedLineupTeam === 'home' ? homePagination : awayPagination).toNextPage} icon="down"/>
      </hstack>
    </vstack>
  );
} 