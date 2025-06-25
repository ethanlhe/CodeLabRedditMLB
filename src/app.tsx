import { Devvit, useState, useAsync, useChannel, FormOnSubmitEvent } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.tsx';
import { renderInGame } from './phases/ingame.tsx';
import { renderPostGame } from './phases/postgame.tsx';
import { BoxScoreTab } from './phases/BoxScoreTab.tsx';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase, GameInfo, Score, GameBoxscore } from './types/game.ts';
import { setupGameSelectionForm } from './forms/GameSelectionForm.tsx';
import { parseGameBoxscore, extractTeamStats } from './utils/gameParsers.js';
import { PlayByPlayTab } from './phases/PlayByPlayTab.tsx';
import * as chrono from 'chrono-node';

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
        name: 'Baseball Scorecard - Test!!',
        height: 'tall',
        render: (context) => {
            const [isLive, setIsLive] = useState<boolean>(false);
            const [gameData, setGameData] = useState<any>(null);
            const [gameId, setGameId] = useState<string | null>(null);
            const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
            const [API_KEY, setAPI_KEY] = useState<string | null>(null);

            useAsync(async () => {
                const key = await context.settings.get('sportsradar-api-key');
                setAPI_KEY(key as string);
            });


            // Use useAsync for initial data load
            const { loading, error, data: asyncGameData } = useAsync<any>(async () => {
                try {
                    console.log('[Scoreboard] Loading game data for post:', context.postId);
                    const storedGameStr = await context.redis.get(`game_${context.postId}`);
                    let storedGame;
                    let boxscoreData;
                    let extendedSummaryData;
                    let needsUpdate = false;

                    if (!storedGameStr) {
                        console.log('[Scoreboard] No game data in Redis, fetching from API...');
                        needsUpdate = true;
                    } else {
                        storedGame = JSON.parse(storedGameStr);
                        boxscoreData = await context.redis.get(`boxscore_${storedGame.id}`);
                        extendedSummaryData = await context.redis.get(`extended_summary_${storedGame.id}`);
                        
                        // Check if boxscore data is stale (older than 5 minutes)
                        const timestamp = await context.redis.get(`boxscore_${storedGame.id}_timestamp`);
                        if (!timestamp || (Date.now() / 1000 - parseInt(timestamp)) > 300) {
                            console.log('[Scoreboard] Boxscore data is stale, fetching fresh data...');
                            needsUpdate = true;
                        }

                        // Check if extended summary data is stale (older than 5 minutes)
                        const extendedSummaryTimestamp = await context.redis.get(`extended_summary_${storedGame.id}_timestamp`);
                        if (!extendedSummaryTimestamp || (Date.now() / 1000 - parseInt(extendedSummaryTimestamp)) > 300) {
                            console.log('[Scoreboard] Extended summary data is stale, fetching fresh data...');
                            needsUpdate = true;
                        }
                    }

                    if (needsUpdate) {
                        const API_KEY = await context.settings.get('sportsradar-api-key');
                        if (!API_KEY) {
                            throw new Error('SportsRadar API key not configured');
                        }

                        // If we don't have stored game data, we can't proceed
                        if (!storedGame) {
                            throw new Error('No game data available for this post');
                        }

                        // Fetch fresh data from API
                        const response = await fetch(
                            `https://api.sportradar.us/mlb/trial/v8/en/games/${storedGame.id}/boxscore.json`,
                            {
                                headers: {
                                    'accept': 'application/json',
                                    'x-api-key': API_KEY as string
                                }
                            }
                        );

                        if (!response.ok) {
                            throw new Error(`API request failed: ${response.statusText}`);
                        }

                        const newData = await response.json();
                        
                        // Update Redis with fresh data
                        await context.redis.set(`game_${context.postId}`, JSON.stringify(storedGame));
                        await context.redis.set(`boxscore_${storedGame.id}`, JSON.stringify(newData));
                        await context.redis.set(`boxscore_${storedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());
                        
                        boxscoreData = JSON.stringify(newData);

                        // Fetch fresh extended summary data
                        const extendedSummaryResponse = await fetch(
                            `https://api.sportradar.us/mlb/trial/v8/en/games/${storedGame.id}/extended_summary.json`,
                            {
                                headers: {
                                    'accept': 'application/json',
                                    'x-api-key': API_KEY as string
                                }
                            }
                        );

                        if (extendedSummaryResponse.ok) {
                            const newExtendedSummaryData = await extendedSummaryResponse.json();
                            await context.redis.set(`extended_summary_${storedGame.id}`, JSON.stringify(newExtendedSummaryData));
                            await context.redis.set(`extended_summary_${storedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());
                            extendedSummaryData = JSON.stringify(newExtendedSummaryData);
                        } else {
                            console.error('[Scoreboard] Failed to fetch extended summary:', extendedSummaryResponse.status);
                        }
                    }

                    if (!boxscoreData) {
                        throw new Error('No boxscore data available');
                    }

                    const parsedData = JSON.parse(boxscoreData);
                    
                    const isGameLive = parsedData.game.status === 'in-progress';
                    const parsedGameInfo = parseGameBoxscore(parsedData.game);
                    
                    setIsLive(isGameLive);

                    // Add to active games if live
                    if (isGameLive) {
                        await context.redis.hset('active_games', storedGame.id);
                    }
                    
                    // After extracting team stats:
                    const homeStats = extractTeamStats(parsedData.game.home.statistics);
                    const awayStats = extractTeamStats(parsedData.game.away.statistics);

                    // After fetching and parsing extendedSummaryData:
                    let extendedHomeStats, extendedAwayStats;
                    if (extendedSummaryData) {
                        let parsedExtendedSummary = typeof extendedSummaryData === 'string' ? JSON.parse(extendedSummaryData) : extendedSummaryData;
                        if (parsedExtendedSummary?.game) {
                            extendedHomeStats =  extractTeamStats(parsedExtendedSummary.game?.home?.statistics);
                            extendedAwayStats = extractTeamStats(parsedExtendedSummary.game?.away?.statistics);
                            parsedGameInfo.teamStats = { home: extendedHomeStats, away: extendedAwayStats };
                            parsedGameInfo.extendedSummaryData = parsedExtendedSummary;
                        }
                    }

                    // Fetch and store play-by-play data for postgame and closed games
                    let playByPlayData = null;
                    if (["post", "closed", "final"].includes(parsedGameInfo.status)) {
                        console.log('[Scoreboard] Entering play-by-play fetch block for postgame/closed/final');
                        // Use the same API_KEY as above
                        const API_KEY = await context.settings.get('sportsradar-api-key');
                        if (!API_KEY) {
                            throw new Error('SportsRadar API key not configured');
                        }
                        // Try to get from Redis first
                        playByPlayData = await context.redis.get(`pbp_${storedGame.id}`);
                        const pbpTimestamp = await context.redis.get(`pbp_${storedGame.id}_timestamp`);
                        if (!playByPlayData || !pbpTimestamp || (Date.now() / 1000 - parseInt(pbpTimestamp)) > 300) {
                            // Fetch fresh play-by-play data
                            const pbpResponse = await fetch(
                                `https://api.sportradar.us/mlb/trial/v8/en/games/${storedGame.id}/pbp.json`,
                                {
                                    headers: {
                                        'accept': 'application/json',
                                        'x-api-key': API_KEY as string
                                    }
                                }
                            );
                            if (pbpResponse.ok) {
                                const pbpJson = await pbpResponse.json();
                                playByPlayData = JSON.stringify(pbpJson);
                                await context.redis.set(`pbp_${storedGame.id}`, playByPlayData);
                                await context.redis.set(`pbp_${storedGame.id}_timestamp`, Math.floor(Date.now() / 1000).toString());
                            } else {
                                console.error('[Scoreboard] Failed to fetch play-by-play:', pbpResponse.status);
                            }
                        }
                    }

                    return { ...parsedGameInfo, playByPlayData };
                } catch (err) {
                    console.error('[Scoreboard] Error loading game data:', err);
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

            if (isLive && gameId) {
                channel.subscribe();
            }

            if (loading) {
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

            async function voteForTeam(team: string) {
                const currentUser = await context.reddit.getCurrentUser();
                const userId = currentUser?.id;
                const userKey = `poll:${team}:user:${userId}`;
                const hasVoted = await context.redis.get(userKey);
                if (!hasVoted) {
                    await context.redis.set(userKey, '1');
                    const txn = await context.redis.watch(`poll:${team}`);
                    await txn.multi();
                    await txn.incrBy(`poll:${team}`, 1);
                    await txn.exec();
                }

            }

            async function getPollResults(homeTeam: string, awayTeam: string) {
                const [home, away] = await context.redis.mGet([`poll:${homeTeam}`, `poll:${awayTeam}`]);
                const homeVotes = parseInt(home ?? '0', 10);
                const awayVotes = parseInt(away ?? '0', 10);
                const total = homeVotes + awayVotes;
                return {
                    home: homeVotes,
                    away: awayVotes,
                    total,
                    homePct: total ? Math.round((homeVotes / total) * 100) : 0,
                    awayPct: total ? Math.round((awayVotes / total) * 100) : 0,
                };
            }

            // Determine phase and render appropriate component
            let phase: GamePhase;
            if (displayGameData.status === 'scheduled') {
                phase = 'pre';
            } else if (displayGameData.status === 'in-progress') {
                phase = 'live';
            } else {
                phase = 'post';
            }

            // Dynamic tabs based on phase
            let tabs: { key: string; label: string }[] = [];
            if (phase === 'pre') {
                tabs = [
                    { key: 'summary', label: 'Summary' },
                    { key: 'lineups', label: 'Lineups' }
                ];
            } else if (phase === 'live') {
                tabs = [
                    { key: 'summary', label: 'Summary' },
                    { key: 'allplays', label: 'All Plays' },
                    { key: 'boxscore', label: 'Box Score' }
                ];
            } else if (phase === 'post') {
                tabs = [
                    { key: 'summary', label: 'Summary' },
                    { key: 'playbyplay', label: 'Play by Play' },
                    { key: 'boxscore', label: 'Box Score' }
                ];
            }

            // Tab state, reset if phase changes
            const [selectedTab, setSelectedTab] = useState(tabs[0].key);
            // Ensure selectedTab is valid for the current phase
            if (!tabs.some(tab => tab.key === selectedTab)) {
                setSelectedTab(tabs[0].key);
            }

            // Tab content switch
            let tabComponent: JSX.Element;
            if (phase === 'pre') {
                if (selectedTab === 'summary') {
                    const { data: homePlayers } = useAsync(async () => {
                        const playersStr = await context.redis.get(`players_home_${context.postId}`);
                        return playersStr ? JSON.parse(playersStr) : [];
                    });
                    const { data: awayPlayers } = useAsync(async () => {
                        const playersStr2 = await context.redis.get(`players_away_${context.postId}`);
                        return playersStr2 ? JSON.parse(playersStr2) : [];
                    });
                    tabComponent = renderPreGame({ 
                        gameInfo: displayGameData as GameInfo,
                        voteForTeam,
                        getPollResults,
                        homePlayers: homePlayers || [],
                        awayPlayers: awayPlayers || [],
                        context
                    });
                } else if (selectedTab === 'lineups') {
                    tabComponent = (
                        <vstack width="100%" alignment="center middle" padding="large">
                            <text size="large">Lineups coming soon!</text>
                        </vstack>
                    );
                } else {
                    tabComponent = (
                        <vstack width="100%" alignment="center middle" padding="large">
                            <text size="large">Tab not found</text>
                        </vstack>
                    );
                }
            } else if (phase === 'live') {
                if (selectedTab === 'summary') {
                    tabComponent = renderInGame({ gameInfo: displayGameData as GameInfo });
                } else if (selectedTab === 'allplays') {
                    tabComponent = (
                        <PlayByPlayTab context={context} gameId={displayGameData.id} isLive={true} />
                    );
                } else if (selectedTab === 'boxscore') {
                    tabComponent = (
                        <vstack width="100%" alignment="center middle" padding="large">
                            <text size="large">Box Score coming soon!</text>
                        </vstack>
                    );
                } else {
                    tabComponent = (
                        <vstack width="100%" alignment="center middle" padding="large">
                            <text size="large">Tab not found</text>
                        </vstack>
                    );
                }
            } else if (phase === 'post') {
                if (selectedTab === 'summary') {
                    tabComponent = renderPostGame({ gameInfo: displayGameData as GameInfo });
                } else if (selectedTab === 'playbyplay') {
                    tabComponent = (
                        <PlayByPlayTab context={context} gameId={displayGameData.id} isLive={false} />
                    );
                } else if (selectedTab === 'boxscore') {
                    tabComponent = (
                        <BoxScoreTab 
                            gameInfo={displayGameData as GameInfo} 
                            extendedSummaryData={asyncGameData.extendedSummaryData} 
                        />
                    );
                } else {
                    tabComponent = (
                        <vstack width="100%" alignment="center middle" padding="large">
                            <text size="large">Tab not found</text>
                        </vstack>
                    );
                }
            } else {
                tabComponent = (
                    <vstack width="100%" alignment="center middle" padding="large">
                        <text size="large">Tab not found</text>
                    </vstack>
                );
            }

            // Before rendering postgame view:


            return (
                <vstack padding="small" gap="small" backgroundColor="neutral-background-weak" width="100%" minHeight="100%">
                    <Header gameInfo={displayGameData as GameInfo} phase={phase} />
                    {/* Tab Bar */}
                    <hstack gap="small" alignment="center middle">
                        {tabs.map(tab => (
                            <hstack backgroundColor="neutral-background-weak" borderColor="neutral-border-weak" cornerRadius="full">
                            <button
                                key={tab.key}
                                size="small"
                                appearance={selectedTab === tab.key ? 'secondary' : 'plain'}
                                onPress={() => setSelectedTab(tab.key)}
                            >
                                {tab.label}
                                </button>
                                </hstack>
                        ))}
                    </hstack>
                    {/* Tab Content */}
                    {tabComponent}
                </vstack>
            );
        }
    });

    Devvit.addTrigger({
        event: "PostDelete",
        onEvent: async (event, context) => {
            const post = await context.reddit.getPostById(event.postId);
            await post.remove();
        },
    });

    Devvit.addMenuItem({
        label: "Remove Scoreboard Post",
        location: "post",
        forUserType: "moderator",
        onPress: async (_event, context) => {
            const postId = context.postId;
            if (!postId) {
                throw new Error("No postId found in context.");
            }
            const post = await context.reddit.getPostById(postId);
            await post.remove();
        },
    });
}
