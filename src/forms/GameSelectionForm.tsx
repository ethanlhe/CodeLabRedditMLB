import { Devvit, useState, useForm } from '@devvit/public-api';
import { GameBoxscore, GameInfo } from '../types/game.js';

const API_KEY = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';

function parseGameBoxscore(data: GameBoxscore): GameInfo {
  const gameTime = new Date(data.scheduled);
  const timezone = data.venue?.timezone || 'America/New_York';
  const formattedTime = gameTime.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return {
    id: data.id,
    league: 'MLB',
    date: gameTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    location: data.venue?.name || '',
    homeTeam: {
      id: data.home.id,
      name: data.home.name,
      market: data.home.market,
      record: `${data.home.win || 0}-${data.home.loss || 0}`,
      runs: data.home.runs || 0
    },
    awayTeam: {
      id: data.away.id,
      name: data.away.name,
      market: data.away.market,
      record: `${data.away.win || 0}-${data.away.loss || 0}`,
      runs: data.away.runs || 0
    },
    currentTime: formattedTime,
    status: data.status,
    probablePitchers: data.probable_pitchers ? {
      home: data.probable_pitchers.home?.full_name || null,
      away: data.probable_pitchers.away?.full_name || null
    } : null,
    weather: data.weather ? {
      condition: data.weather.condition,
      temp: data.weather.temp
    } : null,
    broadcasts: data.broadcasts?.map((b: { network: string }) => b.network).join(', ') || null
  };
}

const GameSelectionForm = (context: any) => {
  const [games, setGames] = useState([]);
  const [showGameForm, setShowGameForm] = useState(false);

  // Date selection form
  const dateForm = useForm(
    {
      fields: [
        {
          type: 'string',
          name: 'date',
          label: 'Select Date (YYYY/MM/DD)',
          required: true,
          defaultValue: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        }
      ],
    },
    async (values) => {
      try {
        const response = await fetch(`https://api.sportradar.com/mlb/trial/v8/en/games/${values.date}/schedule.json`, {
          headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
        });
        const data = await response.json();
        if (!data.games || data.games.length === 0) {
          context.ui.showToast('No games found for the selected date');
          return;
        }
        setGames(data.games);
        setShowGameForm(true);
      } catch (error) {
        context.ui.showToast('Failed to fetch games');
      }
    }
  );

  // Game selection form (options are dynamic)
  const gameForm = useForm(
    {
      fields: [
        {
          type: 'select',
          name: 'gameId',
          label: 'Select Game',
          required: true,
          options: games.map((game: any) => ({
            label: `${game.away.name} @ ${game.home.name}`,
            value: game.id
          }))
        },
        {
          type: 'string',
          name: 'title',
          label: 'Post Title',
          required: true,
          defaultValue: 'MLB Game Scorecard',
        }
      ],
    },
    async (values) => {
      const { reddit, ui, redis } = context;
      const { gameId, title } = values;
      try {
        const actualGameId = Array.isArray(gameId) ? gameId[0] : gameId;
        const selectedGame = games.find((game: any) => game.id === actualGameId);
        if (!selectedGame) {
          throw new Error(`Selected game not found. Game ID: ${actualGameId}`);
        }
        ui.showToast("Creating your baseball scorecard - you'll be navigated there upon completion.");
        const subreddit = await reddit.getCurrentSubreddit();
        const post = await reddit.submitPost({
          title: title,
          subredditName: subreddit.name,
          preview: (
            <vstack height="100%" width="100%" alignment="middle center">
              <text size="large">Loading Baseball Scorecard...</text>
            </vstack>
          ),
        });
        // Fetch the boxscore for the selected game
        const boxscoreResponse = await fetch(`https://api.sportradar.us/mlb/trial/v8/en/games/${actualGameId}/boxscore.json?api_key=${API_KEY}`);
        if (!boxscoreResponse.ok) {
          throw new Error(`Failed to fetch boxscore: ${boxscoreResponse.status}`);
        }
        const boxscoreData = await boxscoreResponse.json();
        const boxscoreGame = boxscoreData.game;
        // Store the boxscore game data in Redis before navigating
        await redis.set(`game_${post.id}`, JSON.stringify(boxscoreGame));
        // Navigate to the post
        ui.navigateTo(post);
      } catch (error) {
        context.ui.showToast(`Error: ${(error as Error).message}`);
      }
    }
  );

  // Render the correct form
  return showGameForm ? gameForm : dateForm;
};

export default GameSelectionForm;
