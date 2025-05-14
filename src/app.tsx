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

                console.log('Schedule API Response:', JSON.stringify(data, null, 2));
                console.log('Available Games:', data.games.map((g: any) => ({ id: g.id, teams: `${g.away.name} @ ${g.home.name}` })));

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
                        
                        console.log('Selected Game ID:', gameId);
                        console.log('Available Games in Selection:', data.games.map((g: any) => g.id));
                        
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
            const [gamePhase, setGamePhase] = useState<GamePhase>('pre');
            const [score, setScore] = useState<Score>({ home: 0, away: 0 });
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

            const fetchBoxScore = async (gameId: string) => {
                try {
                    const response = await fetch(`https://api.sportradar.us/mlb/trial/v8/en/games/${gameId}/boxscore.json?api_key=${API_KEY}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch boxscore');
                    }
                    const data = await response.json();
                    
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
                    setGameInfo(parsedGameInfo);

                    // Update scores if game is in progress or complete
                    if (phase !== 'pre') {
                        const newScore: Score = {
                            home: data.game.home.runs,
                            away: data.game.away.runs
                        };
                        setScore(newScore);
                    }
                } catch (error) {
                    console.error('Error fetching boxscore:', error);
                }
            };

            // Use the global game data to fetch boxscore
            if (currentGameData) {
                fetchBoxScore(currentGameData.id);
                // Clear the game data after using it
                currentGameData = null;
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