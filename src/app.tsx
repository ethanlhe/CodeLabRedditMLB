import { Devvit, useAsync } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';

const API_KEY = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';

Devvit.addCustomPostType({
  name: 'Baseball Scorecard-ehe',
  height: 'tall',
  render: (context) => {
    const { data: boxscore, loading, error } = useAsync(async () => {
      const gameIdStr = await context.redis.get(`game_${context.postId}`);
      if (!gameIdStr) return null;
      const { id: gameId } = JSON.parse(gameIdStr);
      const url = `https://api.sportradar.us/mlb/trial/v8/en/games/${gameId}/boxscore.json?api_key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    });

    let content;
    if (loading) {
      content = <text>Loading scoreboard data...</text>;
    } else if (error) {
      content = <text color="red">Error loading scoreboard: {error.message}</text>;
    } else if (boxscore && boxscore.game) {
      const game = boxscore.game;
      const status = game.status;
      const score = { home: game.home.runs, away: game.away.runs };
      const gameInfo = {
        id: game.id || '',
        league: 'MLB',
        date: '',
        status: game.status,
        homeTeam: { name: game.home.name, id: '', market: '', record: '', runs: 0 },
        awayTeam: { name: game.away.name, id: '', market: '', record: '', runs: 0 },
        currentTime: game.scheduled,
        location: game.venue?.name || '',
        probablePitchers: null,
        weather: null,
        broadcasts: null,
      };
      if (status === 'scheduled') {
        content = renderPreGame({ gameInfo });
      } else if (status === 'in-progress') {
        content = renderInGame({ gameInfo, score });
      } else if (status === 'closed') {
        content = renderPostGame({ gameInfo, score });
      } else {
        content = <text>Unknown game status</text>;
      }
    } else {
      content = <text>No scoreboard data available</text>;
    }

    return (
      <vstack padding="medium" gap="medium">
        {content}
      </vstack>
    );
  }
}); 