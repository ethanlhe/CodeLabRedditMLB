import { Devvit } from '@devvit/public-api';
import { GameInfo } from '../types/game.ts';
import { MLB_LOGOS } from '../assets/logos/mlb.ts';

interface PostGameProps {
  gameInfo: GameInfo;
}

export function renderPostGame({ gameInfo }: PostGameProps) {
  const awayAbbr = gameInfo.awayTeam.abbreviation;
  const homeAbbr = gameInfo.homeTeam.abbreviation;
  const awayLogo = MLB_LOGOS[awayAbbr];
  const homeLogo = MLB_LOGOS[homeAbbr];

  // Debug output
  console.log('Away Abbreviation:', awayAbbr);
  console.log('Home Abbreviation:', homeAbbr);
  console.log('Away Logo URL:', awayLogo, 'Exists:', Boolean(MLB_LOGOS[awayAbbr]));
  console.log('Home Logo URL:', homeLogo, 'Exists:', Boolean(MLB_LOGOS[homeAbbr]));

  return (
    <vstack gap="medium" padding="medium">
      <hstack gap="large" alignment="center">
        <vstack alignment="center">
          {awayLogo && (
            <image url={awayLogo} imageWidth={48} imageHeight={48} description={`${gameInfo.awayTeam.name} logo`} />
          )}
          <text>{gameInfo.awayTeam.name}</text>
        </vstack>
        <text size="xxlarge" weight="bold">
          {gameInfo.awayTeam.runs} - {gameInfo.homeTeam.runs}
        </text>
        <vstack alignment="center">
          {homeLogo && (
            <image url={homeLogo} imageWidth={48} imageHeight={48} description={`${gameInfo.homeTeam.name} logo`} />
          )}
          <text>{gameInfo.homeTeam.name}</text>
        </vstack>
      </hstack>
      <text>Venue: {gameInfo.location}</text>
    </vstack>
  );
} 