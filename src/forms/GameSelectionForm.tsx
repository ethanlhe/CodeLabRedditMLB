import { Devvit, useState, useForm } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  http: true,
});

Devvit.addCustomPostType({
  name: 'block_form_test',
  description: 'Get MLB Boxscore from Game ID',
  height: 'regular',

  render: (context) => {
    const [gameId, setGameId] = useState('');
    const [boxscore, setBoxscore] = useState<string | null>(null);
    const [gamesList, setGamesList] = useState<string | null>(null);
    const [submittedDay, setSubmittedDay] = useState<string | null>(null);
    const [submittedMonth, setSubmittedMonth] = useState<string | null>(null);
    const [submittedYear, setSubmittedYear] = useState<string | null>(null);


    const fetchGameIDs = async (year: string, month:string, day:string) => {
      const apiKey = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';
      const accessLevel = 'trial';
      const languageCode = 'en';
      const format = 'json';

      const url = `https://api.sportradar.com/mlb/${accessLevel}/v8/${languageCode}/games/${year}/${month}/${day}/schedule.${format}?api_key=${apiKey}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setGamesList(JSON.stringify(data, null, 2));
        } else {
          setGamesList(`Failed to fetch games: ${response.status}`);
        }
      } catch (err) {
        setGamesList(`Error: ${(err as Error).message}`);
      }
    };


    const fetchBoxScore = async (id: string) => {
      const apiKey = 'lmTPYOsFUb8uRUQPe2ooVIWqjLpUldelM9wu5EuP';
      const accessLevel = 'trial';
      const languageCode = 'en';
      const format = 'json';

      const url = `https://api.sportradar.us/mlb/${accessLevel}/${languageCode}/games/${id}/boxscore.${format}?api_key=${apiKey}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setBoxscore(JSON.stringify(data, null, 2));
        } else {
          setBoxscore(`Failed to fetch boxscore: ${response.status}`);
        }
      } catch (err) {
        setBoxscore(`Error: ${(err as Error).message}`);
      }
    };

    /*
    const gameForm = useForm(
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
    */
    
    // To enter date for games
    const dateForm = useForm(
      {
        fields: [
          {
            type: 'string',
            name: 'day',
            label: 'Day',
            placeholder: 'Enter day',
          },
          {
            type: 'string',
            name: 'month',
            label: 'Month',
            placeholder: 'Enter month',
          },
          {
            type: 'string',
            name: 'year',
            label: 'Year',
            placeholder: 'Enter year',
          },
        ],
      },
      async (values) => {
        setSubmittedDay(values.day);
        setSubmittedMonth(values.month);
        setSubmittedYear(values.year);
        await fetchGameIDs(values.year, values.month, values.day);
      }
    );

    // Given the date we want to retrieve a list of games

    return (
      <vstack gap="medium" height="100%" alignment="middle center">
        <text>MLB Game ID: {gameId}</text>
        <button onPress={() => context.ui.showForm(gameForm)}>
          Get Boxscore
        </button>
        {boxscore && <text wrap>{boxscore}</text>}
      </vstack>
    );
  },
});

export default Devvit;
