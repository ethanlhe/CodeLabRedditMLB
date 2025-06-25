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

                const lineup_response = await fetch(
                    `https://api.sportradar.us/mlb/trial/v8/en/games/${year}/${month}/${day}/schedule.json`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': API_KEY as string
                        }
                    }
                );
                if (lineup_response.ok) {
                    const lineupData = await lineup_response.json();
                    console.log("Lineup Data:", JSON.stringify(lineupData, null, 2));
                    // Store the extended summary data in Redis
                    //await gameContext.redis.set(`extended_summary_${selectedGame.id}`, JSON.stringify(extendedsumData));
                } else {
                    console.error('Failed to fetch lineup data:', lineup_response.status);
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
                            let selectedGame = data.games.find((game: any) => game.id === actualGameId);
                            
                            // If game not found in cache, fetch fresh data
                            if (!selectedGame) {
                                console.log('Game not found in cache, fetching fresh schedule data...');
                                const freshResponse = await fetch(
                                    `https://api.sportradar.us/mlb/trial/v8/en/games/${year}/${month}/${day}/schedule.json`,
                                    {
                                        headers: {
                                            'accept': 'application/json',
                                            'x-api-key': API_KEY as string
                                        }
                                    }
                                );

                                if (!freshResponse.ok) {
                                    throw new Error(`Failed to fetch fresh games: ${freshResponse.status} - ${await freshResponse.text()}`);
                                }

                                const freshData = await freshResponse.json();
                                if (!freshData || !freshData.games) {
                                    throw new Error('Invalid response format from fresh API data');
                                }

                                // Update cache with fresh data
                                await gameContext.redis.set(cacheKey, JSON.stringify(freshData));
                                
                                // Try to find the game in fresh data
                                selectedGame = freshData.games.find((game: any) => game.id === actualGameId);
                                
                                if (!selectedGame) {
                                    throw new Error(`Selected game not found in fresh data. Game ID: ${actualGameId}`);
                                }
                            }

                            ui.showToast("Creating your baseball scorecard - you'll be navigated there upon completion.");
                        
                            // Store the game data in Redis before navigating
                            if (!selectedGame || !selectedGame.id) {
                                throw new Error('Invalid game data selected');
                            }

                            // Create the post first
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

                            try {
                                // Fetch and store the initial boxscore data first
                                const boxscoreResponse = await fetch(
                                    `https://api.sportradar.us/mlb/trial/v8/en/games/${selectedGame.id}/boxscore.json`,
                                    {
                                        headers: {
                                            'accept': 'application/json',
                                            'x-api-key': API_KEY as string
                                        }
                                    }
                                );

                                if (!boxscoreResponse.ok) {
                                    throw new Error(`Failed to fetch initial boxscore: ${boxscoreResponse.status}`);
                                }

                                const boxscoreData = await boxscoreResponse.json();
                                if (!boxscoreData || !boxscoreData.game) {
                                    throw new Error('Invalid boxscore data received');
                                }

                                // Update the game data with boxscore info
                                selectedGame.status = boxscoreData.game.status;
                                
                                // Store the complete game data in Redis
                                await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));
                                await gameContext.redis.set(`boxscore_${selectedGame.id}`, JSON.stringify(boxscoreData));
                                await gameContext.redis.set(`boxscore_${selectedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());
                                
                                // Add to active games if live
                                if (boxscoreData.game.status === 'in-progress') {
                                    await gameContext.redis.hset('active_games', selectedGame.id);
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
                                    if (extendedSummaryData?.home?.statistics && extendedSummaryData?.away?.statistics) {
                                        const homeStats = extractTeamStats(extendedSummaryData.home.statistics);
                                        const awayStats = extractTeamStats(extendedSummaryData.away.statistics);

                                        selectedGame.teamStats = {
                                            home: homeStats,
                                            away: awayStats
                                        };
                                    } else {
                                        console.warn('Extended summary data missing statistics:', extendedSummaryData);
                                        selectedGame.teamStats = {
                                            home: { R: 0, H: 0, HR: 0, TB: 0, SB: 0, LOB: 0, E: 0, K: 0, SO: 0, BB: 0 },
                                            away: { R: 0, H: 0, HR: 0, TB: 0, SB: 0, LOB: 0, E: 0, K: 0, SO: 0, BB: 0 }
                                        };
                                    }
                                    
                                    await gameContext.redis.set(`extended_summary_${selectedGame.id}`, JSON.stringify(extendedSummaryData));
                                    await gameContext.redis.set(`extended_summary_${selectedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());
                                    
                                    // Update the game data with team stats
                                    await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));
                                } else {
                                    console.warn('Failed to fetch extended summary, using default stats');
                                    selectedGame.teamStats = {
                                        home: { R: 0, H: 0, HR: 0, TB: 0, SB: 0, LOB: 0, E: 0, K: 0, SO: 0, BB: 0 },
                                        away: { R: 0, H: 0, HR: 0, TB: 0, SB: 0, LOB: 0, E: 0, K: 0, SO: 0, BB: 0 }
                                    };
                                    await gameContext.redis.set(`game_${post.id}`, JSON.stringify(selectedGame));
                                }

                                ui.showToast('Baseball scorecard created successfully!');
                            } catch (error) {
                                console.error('Error setting up game data:', error);
                                // We can't delete the post, but we can show an error message
                                ui.showToast(`Failed to set up game data: ${(error as Error).message}`);
                                throw error;
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
        label: 'Add Baseball Scorecard-mainv2',
        location: 'subreddit',
        forUserType: 'moderator',
        onPress: (_event, context) => {
            context.ui.showForm(dateSelectionForm);
        },
    });
}

export default Devvit;
