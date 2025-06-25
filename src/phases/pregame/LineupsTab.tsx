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
    <vstack width="100%" gap="none" backgroundColor="neutral-background-weak" cornerRadius="medium" padding="none">
      {/* Table Header */}
      <hstack width="100%" gap="medium" alignment="start middle" padding="xsmall">
        <text size="small" weight="bold" color="#000000" width="120px">Players</text>
        <text size="small" weight="bold" color="#000000" width="36px">AB</text>
        <text size="small" weight="bold" color="#000000" width="36px">R</text>
        <text size="small" weight="bold" color="#000000" width="36px">H</text>
        <text size="small" weight="bold" color="#000000" width="36px">RBI</text>
        <text size="small" weight="bold" color="#000000" width="36px">HR</text>
        <text size="small" weight="bold" color="#000000" width="36px">BB</text>
        <text size="small" weight="bold" color="#000000" width="36px">K</text>
        <text size="small" weight="bold" color="#000000" width="44px">AVG</text>
        <text size="small" weight="bold" color="#000000" width="44px">OBP</text>
        <text size="small" weight="bold" color="#000000" width="44px">SLP</text>
      </hstack>
      {/* Table Rows */}
      {(selectedLineupTeam === 'home' ? homePagination : awayPagination).currentItems.map((player: Player, idx: number) => {
        return (
          <hstack key={String(idx)} width="100%" gap="medium" alignment="start middle" padding="xsmall" backgroundColor={idx % 2 === 0 ? "neutral-background-weak" : "neutral-background-strong"}>
            <hstack gap="small" width="120px">
              <text size="small" color="#000000">{player.firstName[0]}. {player.lastName}</text>
              <text size="small" color="#5A7684">{player.primaryPosition}</text>
            </hstack>
            <text size="small" color="#000000" width="36px">{player.ab ?? '-'}</text>
            <text size="small" color="#000000" width="36px">{player.r ?? '-'}</text>
            <text size="small" color="#000000" width="36px">{player.h ?? '-'}</text>
            <text size="small" color="#000000" width="36px">{player.rbi ?? '-'}</text>
            <text size="small" color="#000000" width="36px">{player.hr ?? '-'}</text>
            <text size="small" color="#000000" width="36px">{player.bb ?? '-'}</text>
            <text size="small" color="#000000" width="36px">{player.k ?? '-'}</text>
            <text size="small" color="#000000" width="44px">{player.avg ?? '-'}</text>
            <text size="small" color="#000000" width="44px">{player.obp ?? '-'}</text>
            <text size="small" color="#000000" width="44px">{player.slg ?? '-'}</text>
          </hstack>
        );
      })}
      {/* Bottom row with team tabs and pagination controls */}
      <hstack alignment="end middle" padding="small" gap="small" backgroundColor="neutral-background-weak">
        {/* Team Switch Buttons */}
        <hstack gap="small" alignment="center middle">
          <hstack backgroundColor="neutral-background-weak" borderColor="neutral-border-weak" cornerRadius="full">
            <button
              appearance={selectedLineupTeam === 'home' ? 'secondary' : 'plain'}
              size="small"
              onPress={() => setSelectedLineupTeam('home')}
            >
              {gameInfo.homeTeam.name}
            </button>
          </hstack>
          <hstack backgroundColor="neutral-background-weak" borderColor="neutral-border-weak" cornerRadius="full">
            <button
              appearance={selectedLineupTeam === 'away' ? 'secondary' : 'plain'}
              size="small"
              onPress={() => setSelectedLineupTeam('away')}
            >
              {gameInfo.awayTeam.name}
            </button>
          </hstack>
        </hstack>
        <spacer grow />
        <button onPress={(selectedLineupTeam === 'home' ? homePagination : awayPagination).toPrevPage} icon="up"/>
        <button onPress={(selectedLineupTeam === 'home' ? homePagination : awayPagination).toNextPage} icon="down"/>
      </hstack>
    </vstack>
  );
} 