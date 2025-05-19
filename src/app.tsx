import { Devvit, useState } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase, GameInfo, Score, GameBoxscore } from './types/game.ts';
import { setupGameSelectionForm } from './forms/GameSelectionForm.tsx';

const API_KEY = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';

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
            const [gameInfo, setGameInfo] = useState<GameInfo>({
                id: '',
                league: 'MLB',
                date: '',
                location: '',
                homeTeam: { id: '', name: '', market: '', record: '', runs: 0 },
                awayTeam: { id: '', name: '', market: '', record: '', runs: 0 },
                currentTime: '',
                status: '',
                probablePitchers: null,
                weather: null,
                broadcasts: null
            });

            context.useState(async () => {
                try {
                    // 1. Load gameId from Redis
                    const storedGameStr = await context.redis.get(`game_${context.postId}`);
                    if (!storedGameStr) throw new Error('No game data found in Redis');
                    const storedGame = JSON.parse(storedGameStr);
                    const gameId = storedGame.id;

                    // 2. Fetch boxscore from API (with cache fallback)
                    let boxscoreData;
                    try {
                        const response = await fetch(`https://api.sportradar.us/mlb/trial/v8/en/games/${gameId}/boxscore.json?api_key=${API_KEY}`);
                        if (!response.ok) throw new Error();
                        boxscoreData = await response.json();
                        await context.redis.set(`boxscore_${gameId}`, JSON.stringify(boxscoreData));
                    } catch {
                        // fallback to cache
                        const cached = await context.redis.get(`boxscore_${gameId}`);
                        if (!cached) throw new Error('No boxscore data available');
                        boxscoreData = JSON.parse(cached);
                    }

                    // 3. Update state
                    setGameInfo(parseGameBoxscore(boxscoreData.game));
                } catch (err) {
                    context.ui.showToast('Failed to load game data');
                } finally {
                    setIsLoading(false);
                }
            });

            if (isLoading) {
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large">Loading Baseball Scorecard...</text>
                    </vstack>
                );
            }

            // Determine phase
            let phaseComponent;
            if (gameInfo.status === 'scheduled') {
                phaseComponent = renderPreGame({ gameInfo });
            } else if (gameInfo.status === 'in-progress') {
                phaseComponent = renderInGame({ gameInfo });
            } else {
                phaseComponent = renderPostGame({ gameInfo });
            }

            return (
                <vstack padding="medium" gap="medium">
                    {phaseComponent}
                </vstack>
            );
        }
    });
} 