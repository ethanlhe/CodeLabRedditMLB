import { Devvit, useState, useForm } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase, GameInfo, Score, GameBoxscore } from './types/game.ts';

const API_KEY = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';

// Global state to store the game data
let currentGameData: GameBoxscore | null = null;

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
    broadcasts: data.broadcasts?.map(b => b.network).join(', ') || null
  };
}

export function setupBaseballApp() {
    Devvit.configure({
        redditAPI: true,
        http: true,
        redis: true,
    });

    // Register the date selection form
    const dateSelectionForm = Devvit.createForm(
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
        async (event, context) => {
            const { date } = event.values;
            const { ui } = context;

            try {
                const response = await fetch(
                    `https://api.sportradar.com/mlb/trial/v8/en/games/${date}/schedule.json`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': '4cOVnRTFs8wHDprVJejGhuAlLSHqmQl7klxf9yiZ'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch games: ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.games || data.games.length === 0) {
                    ui.showToast('No games found for the selected date');
                    return;
                }

                // Create game selection form with the fetched games
                const gameSelectionForm = Devvit.createForm(
                    {
                        fields: [
                            {
                                type: 'select',
                                name: 'gameId',
                                label: 'Select Game',
                                required: true,
                                options: data.games.map((game: any) => ({
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
                    async (gameEvent, gameContext) => {
                        const { reddit, ui } = gameContext;
                        const { gameId, title } = gameEvent.values;
                        
                        try {
                            // Extract the game ID from the array if it's in that format
                            const actualGameId = Array.isArray(gameId) ? gameId[0] : gameId;
                            
                            // Store the game data in our global state
                            const selectedGame = data.games.find((game: any) => game.id === actualGameId);
                            
                            console.log('Found Game:', selectedGame ? {
                                id: selectedGame.id,
                                teams: `${selectedGame.away.name} @ ${selectedGame.home.name}`
                            } : 'Not Found');
                            
                            if (!selectedGame) {
                                throw new Error(`Selected game not found. Game ID: ${actualGameId}`);
                            }

                            // Store the complete game data
                            currentGameData = selectedGame;
                            
                            // Initialize the game info with the selected game data
                            const initialGameInfo: GameInfo = {
                                id: selectedGame.id,
                                league: 'MLB',
                                date: new Date(selectedGame.scheduled).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                }),
                                location: selectedGame.venue.name,
                                homeTeam: {
                                    id: selectedGame.home.id,
                                    name: selectedGame.home.name,
                                    market: selectedGame.home.market,
                                    record: `${selectedGame.home.win}-${selectedGame.home.loss}`,
                                    runs: 0
                                },
                                awayTeam: {
                                    id: selectedGame.away.id,
                                    name: selectedGame.away.name,
                                    market: selectedGame.away.market,
                                    record: `${selectedGame.away.win}-${selectedGame.away.loss}`,
                                    runs: 0
                                },
                                currentTime: new Date(selectedGame.scheduled).toLocaleTimeString('en-US', {
                                    timeZone: selectedGame.venue.time_zone,
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }),
                                status: selectedGame.status,
                                probablePitchers: null,
                                weather: null,
                                broadcasts: selectedGame.broadcasts?.map((b: any) => b.network).join(', ') || null
                            };

                            console.log('[Game Selection] Initial Game Info:', initialGameInfo);
                            
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

                            // Store the game data in Redis before navigating
                            await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));

                            // Navigate to the post
                            ui.navigateTo(post);
                        } catch (error) {
                            console.error('Game Selection Error:', error);
                            ui.showToast(`Error: ${(error as Error).message}`);
                        }
                    }
                );

                // Show the game selection form
                ui.showForm(gameSelectionForm);
            } catch (error) {
                ui.showToast(`Error: ${(error as Error).message}`);
            }
        }
    );

    // Add a menu item to the subreddit menu for instantiating the new experience post
    Devvit.addMenuItem({
        label: 'Add Baseball Scorecard-ehe',
        location: 'subreddit',
        forUserType: 'moderator',
        onPress: (_event, context) => {
            context.ui.showForm(dateSelectionForm);
        },
    });
      
    Devvit.addCustomPostType({
        name: 'Baseball Scorecard-ehe',
        height: 'tall',
        render: (context) => {
            console.log('[Render] Context:', context);
            
            const [isLoading, setIsLoading] = useState(true);
            const [gamePhase, setGamePhase] = useState<GamePhase>('pre');
            const [score, setScore] = useState<Score>({ home: 0, away: 0 });
            const [gameId, setGameId] = useState<string>('');
            const [gameInfo, setGameInfo] = useState<GameInfo>({
                id: '',
                league: 'MLB',
                date: '',
                location: '',
                homeTeam: {
                    id: '',
                    name: '',
                    market: '',
                    record: '',
                    runs: 0
                },
                awayTeam: {
                    id: '',
                    name: '',
                    market: '',
                    record: '',
                    runs: 0
                },
                currentTime: '',
                status: '',
                probablePitchers: null,
                weather: null,
                broadcasts: null
            });

            // Helper function to update game state
            const updateGameState = (gameData: GameBoxscore) => {
                const phase = gameData.status === 'scheduled' ? 'pre' : 
                            gameData.status === 'in-progress' ? 'live' : 
                            gameData.status === 'closed' ? 'post' : 'pre';
                            
                const parsedGameInfo = parseGameBoxscore(gameData);
                const newScore = phase !== 'pre' ? {
                    home: gameData.home.runs || 0,
                    away: gameData.away.runs || 0
                } : { home: 0, away: 0 };
                
                // Batch all state updates together
                setGamePhase(phase);
                setGameInfo(parsedGameInfo);
                setScore(newScore);
            };

            // Load game data from Redis when component mounts
            if (context.postId) {
                context.useState(async () => {
                    try {
                        const storedGameStr = await context.redis.get(`game_${context.postId}`);
                        if (storedGameStr) {
                            const storedGame = JSON.parse(storedGameStr) as GameBoxscore;
                            console.log('[Render] Found game data in Redis:', storedGame);
                            
                            setGameId(storedGame.id);
                            updateGameState(storedGame);
                        } else {
                            console.log('[Render] No game data found in Redis');
                        }
                    } catch (error) {
                        console.error('[Render] Error getting game data from Redis:', error);
                        context.ui.showToast(`Error loading game data: ${(error as Error).message}`);
                    } finally {
                        setIsLoading(false);
                    }
                });
            }

            const fetchBoxScore = async (id: string) => {
                if (!id) {
                    console.log('[fetchBoxScore] No game ID provided');
                    return;
                }
                
                try {
                    // Check Redis cache first
                    const cachedData = await context.redis.get(`boxscore_${id}`);
                    if (cachedData) {
                        const data = JSON.parse(cachedData);
                        console.log('[fetchBoxScore] Using cached data for game:', id);
                        updateGameState(data.game);
                        return;
                    }

                    console.log('[fetchBoxScore] Fetching boxscore for game:', id);
                    const response = await fetch(`https://api.sportradar.us/mlb/trial/v8/en/games/${id}/boxscore.json?api_key=${API_KEY}`);
                    
                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    // Cache the data in Redis
                    await context.redis.set(`boxscore_${id}`, JSON.stringify(data));
                    
                    updateGameState(data.game);
                    
                } catch (error) {
                    console.error('[fetchBoxScore] Error:', error);
                    // Show error to user
                    context.ui.showToast(`Error updating game data: ${(error as Error).message}`);
                    
                    // If we have cached data, use it as fallback
                    const cachedData = await context.redis.get(`boxscore_${id}`);
                    if (cachedData) {
                        const data = JSON.parse(cachedData);
                        updateGameState(data.game);
                    }
                }
            };

            // Use the game ID from state to fetch boxscore
            if (gameId && !isLoading) {
                console.log('[Render] Fetching initial boxscore for game:', gameId);
                // Initial fetch
                fetchBoxScore(gameId);
                
                // Schedule periodic updates with rate limiting
                const updateInterval = 60000; // 1 minute to avoid rate limits
                let lastFetchTime = Date.now();
                let updateTimer: number | null = null;
                
                const scheduleNextUpdate = () => {
                    if (updateTimer) {
                        clearTimeout(updateTimer);
                    }
                    
                    updateTimer = setTimeout(() => {
                        if (gameId) {
                            const now = Date.now();
                            if (now - lastFetchTime >= updateInterval) {
                                console.log('[Render] Fetching periodic update for game:', gameId);
                                lastFetchTime = now;
                                fetchBoxScore(gameId);
                            }
                        }
                        // Schedule next update only if we still have a valid gameId
                        if (gameId) {
                            scheduleNextUpdate();
                        }
                    }, updateInterval);
                };
                
                scheduleNextUpdate();
            }

            if (isLoading) {
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large">Loading Baseball Scorecard...</text>
                    </vstack>
                );
            }

            return (
                <vstack padding="medium" gap="medium">
                    <GameStateControls onPhaseChange={setGamePhase} />
                    <Header gamePhase={gamePhase} gameInfo={gameInfo} />
                    {gamePhase === 'pre' && renderPreGame({ gameInfo })}
                    {gamePhase === 'live' && renderInGame({ gameInfo, score })}
                    {gamePhase === 'post' && renderPostGame({ gameInfo, score })}
                </vstack>
            );
        }
    });
} 