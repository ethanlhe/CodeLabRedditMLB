import { Devvit, useState } from '@devvit/public-api';
import { GameInfo, Player } from '../../types/game.ts';

interface LineupsTabProps {
  gameInfo: GameInfo;
  homePlayers: Player[];
  awayPlayers: Player[];
}

export function LineupsTab({ gameInfo, homePlayers, awayPlayers }: LineupsTabProps) {
  const safeHomePlayers = Array.isArray(homePlayers) ? homePlayers : [];
  const safeAwayPlayers = Array.isArray(awayPlayers) ? awayPlayers : [];

  // Lineup stats columns
  const statColumns = [
    { key: 'ab', label: 'AB', width: 36 },
    { key: 'r', label: 'R', width: 36 },
    { key: 'h', label: 'H', width: 36 },
    { key: 'rbi', label: 'RBI', width: 36 },
    { key: 'hr', label: 'HR', width: 36 },
    { key: 'bb', label: 'BB', width: 36 },
    { key: 'k', label: 'K', width: 36 },
    { key: 'avg', label: 'AVG', width: 44 },
    { key: 'obp', label: 'OBP', width: 44 },
    { key: 'slg', label: 'SLG', width: 44 },
  ];

  const [selectedLineupTeam, setSelectedLineupTeam] = useState<'home' | 'away'>('home');
  const [homePage, setHomePage] = useState(0);
  const [awayPage, setAwayPage] = useState(0);

  const itemsPerPage = 10;
  
  // Get current team data
  const currentPlayers = selectedLineupTeam === 'home' ? safeHomePlayers : safeAwayPlayers;
  const currentPage = selectedLineupTeam === 'home' ? homePage : awayPage;
  const setCurrentPage = selectedLineupTeam === 'home' ? setHomePage : setAwayPage;
  
  const pagesCount = Math.ceil(currentPlayers.length / itemsPerPage);
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pagesCount - 1;
  
  const currentItems = currentPlayers.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  // Set up horizontal pagination state
  const isCompact = false; // or true for testing
  const [statPage, setStatPage] = useState(0);
  const statsPerPage = isCompact ? 4 : statColumns.length;
  const statPagesCount = Math.ceil(statColumns.length / statsPerPage);
  // const isFirstStatPage = statPage === 0;
  // const isLastStatPage = statPage === statPagesCount - 1;
  const currentStatColumns = statColumns.slice(
    statPage * statsPerPage,
    statPage * statsPerPage + statsPerPage
  );

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <vstack width="100%" height="380px" gap="none" backgroundColor="neutral-background-weak" cornerRadius="medium" padding="none">
      {/* Table Header */}
      <hstack width="100%" gap="medium" alignment="start middle" padding="xsmall">
        <text size="small" weight="bold" color="#000000" width="120px">Players</text>
        {currentStatColumns.map(col => (
          <text key={col.key} size="small" weight="bold" color="#000000" width={`${col.width}px`}>
            {col.label}
          </text>
        ))}
      </hstack>
      {/* Table Rows */}
      {currentItems.map((player: Player, idx: number) => {
        return (
          <hstack key={String(idx)} width="100%" gap="medium" alignment="start middle" padding="xsmall" backgroundColor={idx % 2 === 0 ? "neutral-background-weak" : "neutral-background-strong"}>
            <hstack gap="small" width="120px">
              <text size="small" color="#000000">{player.firstName[0]}. {player.lastName}</text>
              <text size="small" color="#5A7684">{player.primaryPosition}</text>
            </hstack>
            {currentStatColumns.map(col => (
              <text key={col.key} size="small" color="#000000" width={`${col.width}px`}>
                {player[col.key] ?? '-'}
              </text>
            ))}
          </hstack>
        );
      })}
      <spacer grow />
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
        <button onPress={handlePrevPage} icon="up" disabled={isFirstPage} />
        <button onPress={handleNextPage} icon="down" disabled={isLastPage} />
      </hstack>
    </vstack>
  );
} 