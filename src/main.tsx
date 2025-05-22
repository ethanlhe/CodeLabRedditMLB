import { Devvit , SettingScope } from '@devvit/public-api';
import { setupBaseballApp } from './app.tsx';

Devvit.configure({ redditAPI: true, http:true });

Devvit.addSettings([
  {
    name: 'sportsradar-api-key',
    label: 'SportsRadar API key',
    type: 'string',
    isSecret: true,
    scope: SettingScope.App,
  },
]);

setupBaseballApp();
export default Devvit;