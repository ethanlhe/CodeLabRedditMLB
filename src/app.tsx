import { Devvit, useState, useAsync, useInterval, FormOnSubmitEvent } from '@devvit/public-api';
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

    Devvit.addCustomPostType({
        name: 'Baseball Scorecard - Test!!',
        height: 'tall',
        render: (context) => {
            const [isLive, setIsLive] = useState<boolean>(false);
            const [gameId, setGameId] = useState<string | null>(null);
            const [timer, setTimer] = useState(0);

            // Set up interval for live game updates
            useInterval(() => {
                if (isLive && gameId) {
                    setTimer(t => t + 1);
                }
            }, 1000).start();

            // Use useAsync for initial data load
            const { loading, error, data: asyncGameData } = useAsync<any>(async () => {
                try {
                    console.log('[Scoreboard] Loading game data for post:', context.postId);
                    const storedGameStr = await context.redis.get(`game_${context.postId}`);
                    
                    if (!storedGameStr) {
                        throw new Error('No game data available for this post');
                    }

                    const storedGame = JSON.parse(storedGameStr);
                    const API_KEY = await context.settings.get('sportsradar-api-key');
                    
                    if (!API_KEY) {
                        throw new Error('SportsRadar API key not configured');
                    }

                    // Use context.cache for automatic caching and TTL management
                    const boxscoreData = await context.cache(
                        async () => {
                            console.log('[Scoreboard] Fetching fresh boxscore data for game:', storedGame.id);
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

                            return await response.json();
                        },
                        {
                            key: `boxscore-${storedGame.id}`,
                            ttl: 10000, // Default 10 seconds, will be adjusted based on game status
                        }
                    );

                    const parsedData = boxscoreData;
                    const isGameLive = parsedData.game.status === 'in-progress';
                    const parsedGameInfo = parseGameBoxscore(parsedData.game);
                    
                    setIsLive(isGameLive);
                    setGameId(storedGame.id);

                    // Add to active games if live
                    if (isGameLive) {
                        await context.redis.hset('active_games', storedGame.id);
                    }
                    
                    // After extracting team stats:
                    const homeStats = extractTeamStats(parsedData.game.home.statistics);
                    const awayStats = extractTeamStats(parsedData.game.away.statistics);

                    // Fetch extended summary data with caching
                    let extendedSummaryData = null;
                    if (isGameLive) {
                        extendedSummaryData = await context.cache(
                            async () => {
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
                                    return await extendedSummaryResponse.json();
                                } else {
                                    console.error('[Scoreboard] Failed to fetch extended summary:', extendedSummaryResponse.status);
                                    return null;
                                }
                            },
                            {
                                key: `extended-summary-${storedGame.id}`,
                                ttl: 10000, // 10 seconds for live games
                            }
                        );
                    }

                    // After fetching and parsing extendedSummaryData:
                    let extendedHomeStats, extendedAwayStats;
                    if (extendedSummaryData) {
                        if (extendedSummaryData?.game) {
                            extendedHomeStats = extractTeamStats(extendedSummaryData.game?.home?.statistics);
                            extendedAwayStats = extractTeamStats(extendedSummaryData.game?.away?.statistics);
                            parsedGameInfo.teamStats = { home: extendedHomeStats, away: extendedAwayStats };
                            parsedGameInfo.extendedSummaryData = extendedSummaryData;
                        }
                    }

                    // Fetch and store play-by-play data for live games and postgame games
                    let playByPlayData = null;
                    if (isGameLive || ["post", "closed", "final"].includes(parsedGameInfo.status)) {
                        console.log('[Scoreboard] Fetching play-by-play data for game:', storedGame.id);
                        
                        playByPlayData = await context.cache(
                            async () => {
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
                                    return await pbpResponse.json();
                                } else {
                                    console.error('[Scoreboard] Failed to fetch play-by-play:', pbpResponse.status);
                                    return null;
                                }
                            },
                            {
                                key: `pbp-${storedGame.id}`,
                                ttl: isGameLive ? 10000 : 1000 * 60 * 5, // 10 seconds for live games, 5 minutes for postgame
                            }
                        );
                    }

                    return { ...parsedGameInfo, playByPlayData };
                } catch (err) {
                    console.error('[Scoreboard] Error loading game data:', err);
                    throw err;
                }
            }, { depends: [gameId, timer] }); // Re-run when gameId changes or timer updates for live games

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

            // Use the most up-to-date game data (now just asyncGameData since we're using automatic refresh)
            const displayGameData = asyncGameData;

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
                        <PlayByPlayTab playByPlayData={displayGameData.playByPlayData} />
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
                        <PlayByPlayTab playByPlayData={displayGameData.playByPlayData} />
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
