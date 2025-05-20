import { Devvit, useState, useAsync } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase, GameInfo, Score, GameBoxscore } from './types/game.ts';
import { setupGameSelectionForm } from './forms/GameSelectionForm.tsx';

const API_KEY = '4cOVnRTFs8wHDprVJejGhuAlLSHqmQl7klxf9yiZ';
const CACHE_DURATION = 300; // Cache duration in seconds (5 minutes)

// Global state to store the game data
let currentGameData: GameBoxscore | null = null;

function parseGameBoxscore(data: GameBoxscore): GameInfo {
  console.log('[parseGameBoxscore] input:', JSON.stringify(data, null, 2));
  const gameTime = new Date(data.scheduled);
  const timezone = data.venue?.timezone || 'America/New_York';
  const formattedTime = gameTime.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const result = {
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
    broadcasts: data.broadcasts?.map(b => b.network).join(', ') || null
  };
  console.log('[parseGameBoxscore] output:', JSON.stringify(result, null, 2));
  return result;
}

export function setupBaseballApp() {
    Devvit.configure({
        redditAPI: true,
        http: true,
        redis: true,
    });

    // Setup the game selection form
    setupGameSelectionForm();
      
    Devvit.addCustomPostType({
        name: 'Baseball Scorecard',
        height: 'tall',
        render: (context) => {
            const [isLoading, setIsLoading] = useState(true);

            // Use useAsync to fetch game data with caching
            const { data: gameData, loading, error } = useAsync(async () => {
                try {
                    // 1. Load gameId from Redis
                    const storedGameStr = await context.redis.get(`game_${context.postId}`);
                    if (!storedGameStr) throw new Error('No game data found in Redis');
                    const storedGame = JSON.parse(storedGameStr);
                    const gameId = storedGame.id;

                    // 2. Check if we have a valid cached boxscore
                    const cachedBoxscoreStr = await context.redis.get(`boxscore_${gameId}`);
                    const cachedTimestampStr = await context.redis.get(`boxscore_${gameId}_timestamp`);
                    
                    const now = Math.floor(Date.now() / 1000);
                    const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr) : 0;
                    const isCacheValid = cachedBoxscoreStr && (now - cachedTimestamp < CACHE_DURATION);

                    if (isCacheValid) {
                        console.log('Using cached boxscore data');
                        return parseGameBoxscore(JSON.parse(cachedBoxscoreStr).game);
                    }

                    // 3. Fetch fresh boxscore from API if cache is invalid
                    console.log('Fetching fresh boxscore data');
                    const response = await fetch(
                        `https://api.sportradar.us/mlb/production/v8/en/games/${gameId}/boxscore.json`,
                        {
                            headers: {
                                'accept': 'application/json',
                                'x-api-key': API_KEY
                            }
                        }
                    );

                    if (!response.ok) {
                        if (response.status === 429) {
                            // If we hit rate limit, try to use cached data even if expired
                            if (cachedBoxscoreStr) {
                                console.log('Rate limit hit, using expired cache');
                                return parseGameBoxscore(JSON.parse(cachedBoxscoreStr).game);
                            }
                            throw new Error('API rate limit exceeded. Please try again in a few minutes.');
                        }
                        throw new Error(`Failed to fetch boxscore: ${response.status}`);
                    }

                    const boxscoreData = await response.json();
                    
                    // Update Redis cache with fresh data and timestamp
                    await context.redis.set(`boxscore_${gameId}`, JSON.stringify(boxscoreData));
                    await context.redis.set(`boxscore_${gameId}_timestamp`, now.toString());
                    
                    return parseGameBoxscore(boxscoreData.game);
                } catch (err) {
                    console.error('Error fetching game data:', err);
                    throw err;
                }
            });

            if (loading) {
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large">Loading Baseball Scorecard...</text>
                    </vstack>
                );
            }

            if (error) {
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large" color="red">Error loading game data</text>
                        <text>{error.message}</text>
                    </vstack>
                );
            }

            if (!gameData) {
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large" color="red">No game data available</text>
                    </vstack>
                );
            }

            // Determine phase
            let phaseComponent;
            if (gameData.status === 'scheduled') {
                phaseComponent = renderPreGame({ gameInfo: gameData });
            } else if (gameData.status === 'in-progress') {
                phaseComponent = renderInGame({ gameInfo: gameData });
            } else {
                phaseComponent = renderPostGame({ gameInfo: gameData });
            }

            return (
                <vstack padding="medium" gap="medium">
                    {phaseComponent}
                </vstack>
            );
        }
    });
} 