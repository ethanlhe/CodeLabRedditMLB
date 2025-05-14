import { Devvit } from '@devvit/public-api';
import { setupBaseballApp } from './app.tsx';
import { useAsync } from '@devvit/public-api';

Devvit.configure({ redditAPI: true });
setupBaseballApp();

const { data: gameInfo, loading } = useAsync(async () => {
  if (!gameId) return initialEmptyGameInfo;
  return await fetchBoxScore(gameId);
}, [gameId]);

export default Devvit; 