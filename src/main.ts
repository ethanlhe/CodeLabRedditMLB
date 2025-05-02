import { Devvit } from '@devvit/public-api';
import { setupBaseballApp } from './app.tsx';

Devvit.configure({ redditAPI: true });
setupBaseballApp();
export default Devvit; 