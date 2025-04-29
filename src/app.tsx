import { Devvit, useState } from '@devvit/public-api';
import { renderPreGame } from './phases/pregame.ts';
import { renderInGame } from './phases/ingame.ts';
import { renderPostGame } from './phases/postgame.ts';
import { GameStateControls } from './ui/components/GameControls.tsx';
import { Header } from './ui/components/Header.tsx';
import { GamePhase } from './types/game.ts';

export function setupBaseballApp() {
    Devvit.configure({
        redditAPI: true,
    });
      
    // Add a menu item to the subreddit menu for instantiating the new experience post
    Devvit.addMenuItem({
        label: 'Add my post',
        location: 'subreddit',
        forUserType: 'moderator',
        onPress: async (_event, context) => {
            const { reddit, ui } = context;
            ui.showToast("Submitting your post - upon completion you'll navigate there.");
        
            const subreddit = await reddit.getCurrentSubreddit();
            const post = await reddit.submitPost({
            title: 'My devvit post',
            subredditName: subreddit.name,
            // The preview appears while the post loads
            preview: (
                <vstack height="100%" width="100%" alignment="middle center">
                <text size="large">Loading ...</text>
                </vstack>
            ),
            });
            ui.navigateTo(post);
        },
    });
      
  Devvit.addCustomPostType({
    name: 'Baseball Scorecard',
    height: 'tall',
    render: () => {
      const [gamePhase, setGamePhase] = useState<GamePhase>('pre');
      const [score, setScore] = useState({ home: 0, away: 0 });
      
      const gameInfo = {
        league: 'MLB',
        date: 'October 6',
        location: 'Fenway Park',
        homeTeam: { name: 'Red Sox', record: '(95-67)' },
        awayTeam: { name: 'Yankees', record: '(92-70)' },
        currentTime: gamePhase === 'pre' ? 'Pre-Game' 
                  : gamePhase === 'live' ? 'Live'
                  : 'Final',
        status: gamePhase === 'pre' ? 'First Pitch 7:05 PM ET' 
             : gamePhase === 'live' ? 'Live'
             : 'Final'
      };

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