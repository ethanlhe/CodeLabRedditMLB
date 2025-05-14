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
      record: data.home.record,
      runs: data.home.runs
    },
    awayTeam: {
      id: data.away.id,
      name: data.away.name,
      market: data.away.market,
      record: data.away.record,
      runs: data.away.runs
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
            
            const [gamePhase, setGamePhase] = useState<GamePhase>('pre');
            const [score, setScore] = useState<Score>({ home: 0, away: 0 });
            const [gameId, setGameId] = useState<string>(() => {
                // Initialize from the global currentGameData if available
                if (currentGameData) {
                    console.log('[Render] Setting game ID from global state:', currentGameData.id);
                    return currentGameData.id;
                }
                console.log('[Render] No game ID available');
                return '';
            });
            const [gameInfo, setGameInfo] = useState<GameInfo>(() => {
                // Initialize from the global currentGameData if available
                if (currentGameData) {
                    const initialInfo: GameInfo = {
                        id: currentGameData.id,
                        league: 'MLB',
                        date: new Date(currentGameData.scheduled).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        location: currentGameData.venue.name,
                        homeTeam: {
                            id: currentGameData.home.id,
                            name: currentGameData.home.name,
                            market: currentGameData.home.market,
                            record: `${currentGameData.home.win}-${currentGameData.home.loss}`,
                            runs: 0
                        },
                        awayTeam: {
                            id: currentGameData.away.id,
                            name: currentGameData.away.name,
                            market: currentGameData.away.market,
                            record: `${currentGameData.away.win}-${currentGameData.away.loss}`,
                            runs: 0
                        },
                        currentTime: new Date(currentGameData.scheduled).toLocaleTimeString('en-US', {
                            timeZone: currentGameData.venue.time_zone,
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }),
                        status: currentGameData.status,
                        probablePitchers: null,
                        weather: null,
                        broadcasts: currentGameData.broadcasts?.map((b: any) => b.network).join(', ') || null
                    };
                    console.log('[Render] Initializing Game Info from global state:', initialInfo);
                    return initialInfo;
                }
                
                console.log('[Render] No game data available');
                return {
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
                };
            });

            // Load game data from Redis when component mounts
            if (context.postId && !gameId) {
                context.redis.get(`game_${context.postId}`).then(storedGameStr => {
                    if (storedGameStr) {
                        const storedGame = JSON.parse(storedGameStr) as GameBoxscore;
                        console.log('[Render] Found game data in Redis:', storedGame);
                        setGameId(storedGame.id);
                        const initialInfo: GameInfo = {
                            id: storedGame.id,
                            league: 'MLB',
                            date: new Date(storedGame.scheduled).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            }),
                            location: storedGame.venue.name,
                            homeTeam: {
                                id: storedGame.home.id,
                                name: storedGame.home.name,
                                market: storedGame.home.market,
                                record: `${storedGame.home.win}-${storedGame.home.loss}`,
                                runs: 0
                            },
                            awayTeam: {
                                id: storedGame.away.id,
                                name: storedGame.away.name,
                                market: storedGame.away.market,
                                record: `${storedGame.away.win}-${storedGame.away.loss}`,
                                runs: 0
                            },
                            currentTime: new Date(storedGame.scheduled).toLocaleTimeString('en-US', {
                                timeZone: storedGame.venue.time_zone,
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            }),
                            status: storedGame.status,
                            probablePitchers: null,
                            weather: null,
                            broadcasts: storedGame.broadcasts?.map((b: any) => b.network).join(', ') || null
                        };
                        setGameInfo(initialInfo);
                    }
                }).catch(error => {
                    console.error('[Render] Error getting game data from Redis:', error);
                });
            }

            const fetchBoxScore = async (id: string) => {
                if (!id) {
                    console.log('[fetchBoxScore] No game ID provided');
                    return;
                }
                
                try {
                    console.log('[fetchBoxScore] Fetching boxscore for game:', id);
                    const response = await fetch(`https://api.sportradar.us/mlb/trial/v8/en/games/${id}/boxscore.json?api_key=${API_KEY}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch boxscore');
                    }
                    const data = await response.json();
                    console.log('[fetchBoxScore] Received data:', data);
                    
                    // Determine game phase based on status
                    const phase = data.game.status === 'scheduled' ? 'pre' : 
                                 data.game.status === 'in-progress' ? 'live' : 'post';
                    setGamePhase(phase);

                    // Parse and update game info
                    const parsedGameInfo: GameInfo = {
                        id: data.game.id,
                        league: 'MLB',
                        date: new Date(data.game.scheduled).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        location: data.game.venue.name,
                        homeTeam: {
                            id: data.game.home.id,
                            name: data.game.home.name,
                            market: data.game.home.market,
                            record: `${data.game.home.win}-${data.game.home.loss}`,
                            runs: data.game.home.runs
                        },
                        awayTeam: {
                            id: data.game.away.id,
                            name: data.game.away.name,
                            market: data.game.away.market,
                            record: `${data.game.away.win}-${data.game.away.loss}`,
                            runs: data.game.away.runs
                        },
                        currentTime: new Date(data.game.scheduled).toLocaleTimeString('en-US', {
                            timeZone: data.game.venue.time_zone,
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }),
                        status: data.game.status,
                        probablePitchers: {
                            home: data.game.home.probable_pitcher?.full_name || null,
                            away: data.game.away.probable_pitcher?.full_name || null
                        },
                        weather: null, // Weather info not available in this endpoint
                        broadcasts: data.game.broadcasts?.map((b: any) => b.network).join(', ') || null
                    };
                    console.log('[fetchBoxScore] Setting game info:', parsedGameInfo);
                    setGameInfo(parsedGameInfo);

                    // Store updated game data in Redis
                    if (context.postId) {
                        await context.redis.set(`game_${context.postId}`, JSON.stringify(data.game));
                    }

                    // Update scores if game is in progress or complete
                    if (phase !== 'pre') {
                        const newScore: Score = {
                            home: data.game.home.runs,
                            away: data.game.away.runs
                        };
                        setScore(newScore);
                    }
                } catch (error) {
                    console.error('[fetchBoxScore] Error:', error);
                }
            };

            // Use the game ID from state to fetch boxscore
            if (gameId) {
                console.log('[Render] Fetching initial boxscore for game:', gameId);
                // Initial fetch
                fetchBoxScore(gameId);
                
                // Schedule periodic updates
                const updateInterval = 30000; // 30 seconds
                const scheduleNextUpdate = () => {
                    setTimeout(() => {
                        if (gameId) {
                            console.log('[Render] Fetching periodic update for game:', gameId);
                            fetchBoxScore(gameId);
                            scheduleNextUpdate();
                        }
                    }, updateInterval);
                };
                
                scheduleNextUpdate();
            }

            return (
                <vstack width="100%" backgroundColor="transparent" gap="medium">
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