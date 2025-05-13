import { Devvit, useState, useForm } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase, GameInfo } from './types/game.ts';

// Global state to store the game data
let currentGameData: any = null;

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
                        
                        // Store the game data in our global state
                        currentGameData = data.games.find((game: any) => game.id === gameId);
                        
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
                        ui.navigateTo(post);
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
            const [score, setScore] = useState({ home: 0, away: 0 });
            const [gameInfo, setGameInfo] = useState<GameInfo>({
                league: 'MLB',
                date: 'October 6',
                location: 'Fenway Park',
                homeTeam: { name: 'Red Sox', record: '(95-67)' },
                awayTeam: { name: 'Yankees', record: '(92-70)' },
                currentTime: 'Pre-Game',
                status: 'First Pitch 7:05 PM ET',
                probablePitchers: {
                    home: undefined,
                    away: undefined
                }
            });

            // Fetch game data when the post is created
            const fetchBoxScore = async (id: string) => {
                const apiKey = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';
                const accessLevel = 'trial';
                const languageCode = 'en';
                const format = 'json';

                const url = `https://api.sportradar.us/mlb/${accessLevel}/${languageCode}/games/${id}/boxscore.${format}?api_key=${apiKey}`;

                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Update game info with data from the API
                        if (data.game) {
                            setGameInfo({
                                league: 'MLB',
                                date: new Date(data.game.scheduled).toLocaleDateString(),
                                location: data.game.venue?.name || 'Unknown Venue',
                                homeTeam: {
                                    name: data.game.home?.name || 'Home Team',
                                    record: data.game.home?.record || '(0-0)'
                                },
                                awayTeam: {
                                    name: data.game.away?.name || 'Away Team',
                                    record: data.game.away?.record || '(0-0)'
                                },
                                currentTime: gamePhase === 'pre' ? 'Pre-Game' 
                                          : gamePhase === 'live' ? 'Live'
                                          : 'Final',
                                status: gamePhase === 'pre' ? 'First Pitch ' + new Date(data.game.scheduled).toLocaleTimeString()
                                     : gamePhase === 'live' ? 'Live'
                                     : 'Final',
                                probablePitchers: {
                                    home: data.game.home?.probable_pitcher?.name,
                                    away: data.game.away?.probable_pitcher?.name
                                }
                            });

                            // Update score if available
                            if (data.game.home && data.game.away) {
                                setScore({
                                    home: data.game.home.runs || 0,
                                    away: data.game.away.runs || 0
                                });
                            }
                        }
                    } else {
                        context.ui.showToast(`Failed to fetch boxscore: ${response.status}`);
                    }
                } catch (err) {
                    context.ui.showToast(`Error: ${(err as Error).message}`);
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
                    {gamePhase === 'pre' && renderPreGame(gameInfo)}
                    {gamePhase === 'live' && renderInGame({ gameInfo, score })}
                    {gamePhase === 'post' && renderPostGame({ gameInfo, score })}
                </vstack>
            );
        }
    });
} 