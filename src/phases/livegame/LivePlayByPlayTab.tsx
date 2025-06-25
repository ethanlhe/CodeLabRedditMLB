import { Devvit, useState, useAsync, useInterval} from '@devvit/public-api';

interface PlayByPlayTabProps {
  gameId: string;
  context: any;
  isLive: boolean;
}

export function PlayByPlayTab({gameId, context, isLive}: PlayByPlayTabProps) {

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

    const maxPages = descriptions ? Math.ceil(descriptions.length / PAGE_SIZE) : 1;
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