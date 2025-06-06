import { Devvit, useState, useForm } from '@devvit/public-api';
import { GameBoxscore, GameInfo } from '../types/game.js';
import { parseGameBoxscore, extractTeamStats } from '../utils/gameParsers.js';

export function setupGameSelectionForm() {
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
            const API_KEY = await context.settings.get('sportsradar-api-key');
            if (!API_KEY) {
                throw new Error('SportsRadar API key not configured. Please set it in the app settings.');
            }
            
            const { date } = event.values;
            const { ui } = context;

            try {
                // Parse the date into components
                const [year, month, day] = date.split('/');
                
                // Validate date format
                if (!year || !month || !day) {
                    throw new Error('Invalid date format. Please use YYYY/MM/DD');
                }
                
                const cacheKey = `schedule_${year}_${month}_${day}`;

                // Try to get cached data first
                const cachedData = await context.redis.get(cacheKey);
                let data;
                
                if (cachedData) {
                    console.log('Using cached schedule data');
                    data = JSON.parse(cachedData);
                } else {
                    console.log('Fetching fresh schedule data');
                    const response = await fetch(
                        `https://api.sportradar.us/mlb/trial/v8/en/games/${year}/${month}/${day}/schedule.json`,
                        {
                            headers: {
                                'accept': 'application/json',
                                'x-api-key': API_KEY as string
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`Failed to fetch games: ${response.status} - ${await response.text()}`);
                    }

                    data = await response.json();
                    
                    if (!data || !data.games) {
                        throw new Error('Invalid response format from API');
                    }
                    
                    // Cache the data
                    await context.redis.set(cacheKey, JSON.stringify(data));
                }
                
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

                            // Store the game data in Redis before navigating
                            await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));

                            // Fetch and store the initial boxscore data
                            const boxscoreResponse = await fetch(
                                `https://api.sportradar.us/mlb/trial/v8/en/games/${selectedGame.id}/boxscore.json`,
                                {
                                    headers: {
                                        'accept': 'application/json',
                                        'x-api-key': API_KEY as string
                                    }
                                }
                            );

                            if (boxscoreResponse.ok) {
                                const boxscoreData = await boxscoreResponse.json();
                                await gameContext.redis.set(`boxscore_${selectedGame.id}`, JSON.stringify(boxscoreData));
                                await gameContext.redis.set(`boxscore_${selectedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());

                                // Update the game data in Redis to reflect the live status from the boxscore
                                if (boxscoreData && boxscoreData.game && boxscoreData.game.status) {
                                    selectedGame.status = boxscoreData.game.status;
                                    await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));
                                    
                                    // Add to active games if live
                                    if (boxscoreData.game.status === 'in-progress') {
                                        await gameContext.redis.hset('active_games', selectedGame.id);
                                    }
                                }
                            } else {
                                console.error('Failed to fetch initial boxscore:', boxscoreResponse.status);
                                // Still store the initial game data even if boxscore fetch fails
                                await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));
                                ui.showToast('Created scorecard with initial game data. Live updates may be delayed.');
                            }

                            // Fetch and store the initial extended summary data
                            const extendedSummaryResponse = await fetch(
                                `https://api.sportradar.us/mlb/trial/v8/en/games/${selectedGame.id}/extended_summary.json`,
                                {
                                    headers: {
                                        'accept': 'application/json',
                                        'x-api-key': API_KEY as string
                                    }
                                }
                            );

                            if (extendedSummaryResponse.ok) {
                                const extendedSummaryData = await extendedSummaryResponse.json();
                                await gameContext.redis.set(`extended_summary_${selectedGame.id}`, JSON.stringify(extendedSummaryData));
                                await gameContext.redis.set(`extended_summary_${selectedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());

                                const homeStats = extractTeamStats(extendedSummaryData.home.statistics);
                                const awayStats = extractTeamStats(extendedSummaryData.away.statistics);

                                selectedGame.teamStats = {
                                    home: homeStats,
                                    away: awayStats
                                };
                            } else {
                                console.error('Failed to fetch initial extended summary:', extendedSummaryResponse.status);
                            }

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
        label: 'Add Baseball Scorecard-main',
        location: 'subreddit',
        forUserType: 'moderator',
        onPress: (_event, context) => {
            context.ui.showForm(dateSelectionForm);
        },
    });
}

export default Devvit;
