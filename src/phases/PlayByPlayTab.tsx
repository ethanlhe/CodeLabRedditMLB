// import { Devvit, useState } from '@devvit/public-api';
// import { parsePlayByPlay } from '../utils/gameParsers.js';

// export function PlayByPlayTab({ playByPlayData }: { playByPlayData: string | null }) {
//   if (!playByPlayData) {
//     return <text color="red">No play-by-play data available.</text>;
//   }
//   let parsed = [];
//   try {
//     const raw = typeof playByPlayData === 'string' ? JSON.parse(playByPlayData) : playByPlayData;
//     parsed = parsePlayByPlay(raw);
//   } catch (e) {
//     // Only log parsing errors
//     console.error('[PlayByPlayTab] Error parsing playByPlayData:', e);
//     return <text color="red">Error parsing play-by-play data.</text>;
//   }
//   if (!parsed.length) {
//     return <text color="red">No play-by-play events found.</text>;
//   }
//   // Helper for ordinal
//   const ordinal = (n: number) => {
//     if (n === 1) return '1st';
//     if (n === 2) return '2nd';
//     if (n === 3) return '3rd';
//     return `${n}th`;
//   };

//   // Vertical pagination: 1 half-inning per page
//   const { currentItems, currentPage, pagesCount, toPrevPage, toNextPage, isFirstPage, isLastPage } = useVerticalPagination(parsed, 1);

//   return (
//     <vstack gap="small" width="100%" height="380px">
//       {currentItems.map((half, idx) => (
//         <vstack key={String(idx)} gap="small" width="100%">
//           <hstack gap="small" alignment="center middle" padding="small">
//             <text size="large" weight="bold">{half.team} - {half.half === 'T' ? 'Top' : 'Bottom'} {ordinal(half.inning)}</text>
//           </hstack>
//           <vstack width="100%" backgroundColor="neutral-background-weak" padding="small" gap="small" cornerRadius="medium">
//             {half.plays.map((play: any, pidx: number) => (
//               <text key={String(pidx)} size="medium">{play.description}</text>
//             ))}
//           </vstack>
//         </vstack>
//       ))}
//       <spacer grow />
//       {/* Pagination controls */}
//       <hstack alignment="end middle" padding="small" gap="small" backgroundColor="neutral-background-weak">
//         <button onPress={toPrevPage} icon="up" disabled={isFirstPage} />
//         <button onPress={toNextPage} icon="down" disabled={isLastPage} />
//       </hstack>
//     </vstack>
//   );
// }

// // Pagination hook for vertical (up/down) navigation
// function useVerticalPagination<ItemType>(items: ItemType[], itemsPerPage: number) {
//   const [currentPage, setCurrentPage] = useState(0);
//   const pagesCount = Math.ceil(items.length / itemsPerPage);
//   const isFirstPage = currentPage === 0;
//   const isLastPage = currentPage === pagesCount - 1;
//   return {
//     currentPage,
//     pagesCount,
//     currentItems: items.slice(
//       currentPage * itemsPerPage,
//       currentPage * itemsPerPage + itemsPerPage
//     ),
//     isFirstPage,
//     isLastPage,
//     toPrevPage: isFirstPage ? undefined : () => setCurrentPage(currentPage - 1),
//     toNextPage: isLastPage ? undefined : () => setCurrentPage(currentPage + 1),
//   };
// } 

import { Devvit, useState, useAsync, useInterval} from '@devvit/public-api';

interface PlayByPlayTabProps {
  gameId: string;
  context: any;
  isLive: boolean;
}

export function PlayByPlayTab({gameId, context, isLive}: PlayByPlayTabProps) {

  // console.log('PlayByPlayTab', gameId);
    const [page, setPage] = useState(1);
    const [timer, setTimer] = useState(0);
    const PAGE_SIZE = 10;

    if (isLive) {
      useInterval(() => {
        setTimer((t) => t + 1);
      }, 1000).start();
    }
    else{
      useInterval(() => {
        setTimer((t) => t + 1);
      }, 1000 * 60 * 30).start();
    }

    async function getPbp() {
      console.log('getting pbp for ' + gameId);
      if (!gameId) {
        return;
      }
      const result = await context.cache(
        async () => {
          const API_KEY = await context.settings.get('sportsradar-api-key');
          const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-api-key': API_KEY
            }
          };

          console.log('fetching pbp for ' + gameId);
          
          const response = await fetch('https://api.sportradar.com/mlb/trial/v8/en/games/' + gameId + '/pbp.json', options)
          
          if (!response.ok) {
            throw Error(`HTTP error ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          return data;
        },
        {
          key: 'game-pbp-' + gameId,
          ttl: 10000,
        }
      );

      function getDescriptions(pbp: any) {
        const descriptions : any[] = [];
        if (!pbp?.game?.innings) return descriptions;
      
        for (let i = pbp.game.innings.length - 1; i > 0; i--) {
          const inning = pbp.game.innings[i];
          if (!inning) continue;
      
          for (const halfIndex of [1, 0]) {
            const half = inning.halfs?.[halfIndex];
            if (!half) continue;
      
            const label = halfIndex === 1 ? `BOT ${inning.number}` : `TOP ${inning.number}`;
            descriptions.push({ type: 'label', text: label });
      
            if (half.events) {
              for (let e = half.events.length - 1; e >= 0; e--) {
                const event = half.events[e];
                if (event?.at_bat?.description) {
                  descriptions.push({ type: 'desc', text: event.at_bat.description });
                }
              }
            }
          }
        }
        return descriptions;
      }
      

      const descriptions = getDescriptions(result);
      return descriptions;
    }

    const { data: descriptions, loading, error } = useAsync<any[]>(
      async () => {
        console.log('getting descriptions for ' + gameId);
        if (!gameId) return [{'type': 'label', 'text': 'No game selected'}];
        const ans = await getPbp();
        if (!ans) return [{'type': 'label', 'text': 'No game selected'}];
        return ans;
      },
      { depends: [gameId, timer] }
    );

    const maxPages = Math.ceil(descriptions?.length ?? 0 / PAGE_SIZE);
    const currentItems = descriptions?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function toPrevPage() {
      if (page > 1 && descriptions) {
        setPage(page - 1);
      }
    }
    function toNextPage() {
      if (page < maxPages && descriptions) {
        setPage(page + 1);
      }
    }


    return (
      <vstack>
          <vstack gap="small" padding="small" minHeight="150px">
            {
              currentItems?.map((item, idx) =>
                item.type === 'label' ? (
                  <text key={`label-${idx}`} size="large" weight="bold">{item.text}</text>
                ) : (
                  <text key={`desc-${idx}`}>{item.text}</text>
                )
              )
            }
          </vstack>
          <hstack alignment="middle center" gap="small">
            <button onPress={toPrevPage} icon="left"/>
            <text>{page}</text>
            <button onPress={toNextPage} icon="right"/>
          </hstack>
        </vstack>
    );
}