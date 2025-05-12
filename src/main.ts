import { Devvit } from '@devvit/public-api';
import { setupBaseballApp } from './app.tsx';
import sportradarBaseball from '@api/sportradar-baseball';

Devvit.configure({
    redditAPI: true,
    http: true,
  });

setupBaseballApp();

Devvit.addCustomPostType({
    name: 'block_form_test',
    description: 'Get MLB Boxscore from Game ID',
    height: 'regular',
  
    render: (context) => {
      const [gameId, setGameId] = useState('');
      const [boxscore, setBoxscore] = useState<string | null>(null);
  
      const fetchBoxScore = async (id: string) => {
        try {
          const { data } = await sportradarBaseball.mlbGameBoxscore({
            access_level: 'trial',
            language_code: 'en',
            game_id: id,
            format: 'json',
          });
          setBoxscore(JSON.stringify(data, null, 2));
        } catch (err) {
          setBoxscore(`Error: ${(err as Error).message}`);
        }
      };
  
      const form = useForm(
        {
          fields: [
            {
              type: 'string',
              name: 'name',
              label: 'Enter Game ID',
            },
          ],
        },
        async (values) => {
          const id = values.name;
          setGameId(id);
          await fetchBoxScore(id);
        }
      );
  
      return (
        <vstack gap="medium" alignment="middle center">
          <text>Game ID: {gameId}</text>
          <button onPress={() => context.ui.showForm(form)}>Get Boxscore</button>
          {boxscore && <text wrap>{boxscore}</text>}
        </vstack>
      );
    },
  });
  
export default Devvit; 