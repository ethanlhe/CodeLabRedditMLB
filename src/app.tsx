import { Devvit, useState, useAsync, useChannel } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase, GameInfo, Score, GameBoxscore } from './types/game.ts';
import { setupGameSelectionForm, parseGameBoxscore } from './forms/GameSelectionForm.tsx';

export function setupBaseballApp() {
    Devvit.configure({
        redditAPI: true,
        http: true,
        redis: true,
    });

    // Setup the game selection form
    setupGameSelectionForm();

    // Add scheduled job for live game updates
    Devvit.addSchedulerJob({
        name: 'update_live_games',
        onRun: async (_: unknown, context) => {
            try {
                // Get all active game posts from Redis
                const activeGames = await context.redis.hkeys('active_games');
                
                for (const gameId of activeGames) {
                    const gameData = await context.redis.get(`game_${gameId}`);
                    if (!gameData) continue;

                    const game = JSON.parse(gameData);
                    const boxscoreData = await context.redis.get(`boxscore_${game.id}`);
                    
                    if (boxscoreData) {
                        const parsedData = JSON.parse(boxscoreData);
                        if (parsedData.game.status === 'in-progress') {
                            // Fetch fresh data for live games
                            const API_KEY = await context.settings.get('sportsradar-api-key');
                            if (!API_KEY) {
                                console.error('SportsRadar API key not configured');
                                continue;
                            }

                            const response = await fetch(
                                `https://api.sportradar.us/mlb/trial/v8/en/games/${game.id}/boxscore.json`,
                                {
                                    headers: {
                                        'accept': 'application/json',
                                        'x-api-key': API_KEY as string
                                    }
                                }
                            );

                            if (response.ok) {
                                const newData = await response.json();
                                await context.redis.set(`boxscore_${game.id}`, JSON.stringify(newData));
                                await context.redis.set(`boxscore_${game.id}_timestamp`, Math.floor(Date.now() / 1000).toString());
                                
                                // Broadcast update to all clients
                                context.realtime.send(`game_updates_${game.id}`, newData);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error in update_live_games job:', error);
            }
        },
    });

    // Add AppInstall trigger to schedule the updater job
    Devvit.addTrigger({
        event: 'AppInstall',
        onEvent: async (_event, context) => {
            await context.scheduler.runJob({
                name: 'update_live_games',
                cron: '*/30 * * * * *'
            });
        }
    });
      
    Devvit.addCustomPostType({
        name: 'Baseball Scorecard',
        height: 'tall',
        render: (context) => {
            const [isLive, setIsLive] = useState(false);
            const [gameData, setGameData] = useState<GameInfo | null>(null);
            const [gameId, setGameId] = useState<string | null>(null);
            const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

            // Use useAsync for initial data load
            const { loading, error, data: asyncGameData } = useAsync<GameInfo>(async () => {
                try {
                    console.log('[Scoreboard] Loading game data for post:', context.postId);
                    const storedGameStr = await context.redis.get(`game_${context.postId}`);
                    if (!storedGameStr) {
                        console.error('[Scoreboard] No game data found in Redis for post:', context.postId);
                        throw new Error('No game data found in Redis');
                    }
                    
                    const storedGame = JSON.parse(storedGameStr);
                    console.log('[Scoreboard] Found stored game:', storedGame);
                    setGameId(storedGame.id);
                    
                    const boxscoreData = await context.redis.get(`boxscore_${storedGame.id}`);
                    if (!boxscoreData) {
                        console.error('[Scoreboard] No boxscore data found for game:', storedGame.id);
                        throw new Error('No boxscore data available');
                    }
                    
                    const parsedData = JSON.parse(boxscoreData);
                    console.log('[Scoreboard] Parsed boxscore data:', parsedData);
                    
                    const isGameLive = parsedData.game.status === 'in-progress';
                    const parsedGameInfo = parseGameBoxscore(parsedData.game);
                    
                    console.log('[Scoreboard] Setting game data:', parsedGameInfo);
                    setIsLive(isGameLive);

                    // Add to active games if live
                    if (isGameLive) {
                        await context.redis.hset('active_games', storedGame.id);
                    }
                    
                    return parsedGameInfo;
                } catch (err) {
                    console.error('[Scoreboard] Error loading initial game data:', err);
                    throw err;
                }
            });

            // Set up realtime updates for live games
            const channelName = gameId ? `game_updates_${gameId}` : 'waiting_for_gameid';
            const channel = useChannel({
                name: channelName,
                onMessage: (updatedData: any) => {
                    if (updatedData?.game) {
                        console.log('[Scoreboard] Received game update:', updatedData);
                        setGameData(parseGameBoxscore(updatedData.game));
                        setLastUpdateTime(Date.now());
                    }
                },
            });

            console.log('[Scoreboard] State:', { gameId, isLive, loading, error, asyncGameData, gameData });
            if (isLive && gameId) {
                console.log('[Scoreboard] Subscribing to channel:', `game_updates_${gameId}`);
                channel.subscribe();
            }

            if (loading) {
                console.log('[Scoreboard] Still loading...');
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large">Loading Baseball Scorecard...</text>
                    </vstack>
                );
            }

            if (error) {
                console.log('[Scoreboard] Error state:', error);
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large" color="red">Error loading game data</text>
                        <text>{error.message}</text>
                    </vstack>
                );
            }

            // Use the most up-to-date game data (live update or async load)
            const displayGameData = gameData ?? asyncGameData;

            if (!displayGameData) {
                console.log('[Scoreboard] No game data available after loading.');
                return (
                    <vstack padding="medium" gap="medium" alignment="middle center">
                        <text size="large" color="red">No game data available</text>
                        <text>Please try refreshing the page</text>
                    </vstack>
                );
            }

            // Determine phase and render appropriate component
            let phase: GamePhase;
            let phaseComponent;
            if (displayGameData.status === 'scheduled') {
                phase = 'pre';
                phaseComponent = renderPreGame({ gameInfo: displayGameData as GameInfo });
            } else if (displayGameData.status === 'in-progress') {
                phase = 'live';
                phaseComponent = renderInGame({ gameInfo: displayGameData as GameInfo });
            } else {
                phase = 'post';
                phaseComponent = renderPostGame({ gameInfo: displayGameData as GameInfo });
            }

            // Render the scoreboard UI
            const pollingStatus = Date.now() - lastUpdateTime < 35000;
            return (
                <vstack padding="medium" gap="medium" backgroundColor="#F6F8F9" width="100%" minHeight="100%">
                    <Header gameInfo={displayGameData as GameInfo} />
                    {phaseComponent}
                </vstack>
            );
        }
    });
} 