import { Devvit, useState, useChannel } from '@devvit/public-api';
import { parsePlayByPlay } from '../../utils/gameParsers.js';

interface LivePlayByPlayTabProps {
  playByPlayData: string | null;
  gameId: string;
}

export function LivePlayByPlayTab({ playByPlayData, gameId }: LivePlayByPlayTabProps) {
  const [livePlayByPlayData, setLivePlayByPlayData] = useState(playByPlayData);

  // Set up realtime updates for live games
  const channel = useChannel({
    name: `game_updates_${gameId}`,
    onMessage: (updatedData: any) => {
      if (updatedData?.game) {
        console.log('[LivePlayByPlayTab] Received game update:', updatedData);
        // For live games, we might need to fetch fresh play-by-play data
        // This would typically be done by the parent component
        // For now, we'll just update the existing data if it's provided
        if (updatedData.playByPlayData) {
          setLivePlayByPlayData(updatedData.playByPlayData);
        }
      }
    },
  });

  // Subscribe to live updates
  channel.subscribe();

  if (!livePlayByPlayData) {
    return <text color="red">No play-by-play data available.</text>;
  }

  let parsed = [];
  try {
    const raw = typeof livePlayByPlayData === 'string' ? JSON.parse(livePlayByPlayData) : livePlayByPlayData;
    parsed = parsePlayByPlay(raw);
  } catch (e) {
    // Only log parsing errors
    console.error('[LivePlayByPlayTab] Error parsing playByPlayData:', e);
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

  // Vertical pagination: 1 half-inning per page
  const { currentItems, currentPage, pagesCount, toPrevPage, toNextPage, isFirstPage, isLastPage } = useVerticalPagination(parsed, 1);

  return (
    <vstack gap="small" width="100%" height="380px">
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
      <hstack alignment="end middle" padding="small" gap="small" backgroundColor="neutral-background-weak">
        <button onPress={toPrevPage} icon="up" disabled={isFirstPage} />
        <button onPress={toNextPage} icon="down" disabled={isLastPage} />
      </hstack>
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