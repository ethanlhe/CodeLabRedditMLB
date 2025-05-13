import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'sportradar-baseball/8 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * **MLB Daily Change Log** provides IDs and timestamps for teams, players, game
   * statistics, schedules, and standings that have been modified on a given date. To receive
   * the data updates, use these unique IDs to pull relevant API feeds.
   *
   * @summary Daily Change Log
   */
  mlbDailyChangeLog(metadata: types.MlbDailyChangeLogMetadataParam): Promise<FetchResponse<200, types.MlbDailyChangeLogResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/{year}/{month}/{day}/changes.{format}', 'get', metadata);
  }

  /**
   * **MLB Daily Summary** provides team lineups as well as team and player statistics for
   * all games on a given MLB defined day.
   *
   * @summary Daily Summary
   */
  mlbDailySummary(metadata: types.MlbDailySummaryMetadataParam): Promise<FetchResponse<200, types.MlbDailySummaryResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{year}/{month}/{day}/summary.{format}', 'get', metadata);
  }

  /**
   * **MLB Daily Boxscore** provides inning-by-inning scoring breakdown, top-level runs, hits
   * and errors by team, as well as details on run-scoring events for all games on a given
   * MLB defined day.
   *
   * @summary Daily Boxscore
   */
  mlbDailyBoxscore(metadata: types.MlbDailyBoxscoreMetadataParam): Promise<FetchResponse<200, types.MlbDailyBoxscoreResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{year}/{month}/{day}/boxscore.{format}', 'get', metadata);
  }

  /**
   * **MLB Game Extended Summary** provides inning-by-inning scoring, key game events,
   * lineups, and team and player statistics for the given game and season-to-date.
   *
   * @summary Game Extended Summary
   */
  mlbGameExtendedSummary(metadata: types.MlbGameExtendedSummaryMetadataParam): Promise<FetchResponse<200, types.MlbGameExtendedSummaryResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{game_id}/extended_summary.{format}', 'get', metadata);
  }

  /**
   * **MLB Daily Transactions** provides information concerning all transactions taking place
   * on a given MLB defined day.
   *
   * @summary Daily Transactions
   */
  mlbDailyTransactions(metadata: types.MlbDailyTransactionsMetadataParam): Promise<FetchResponse<200, types.MlbDailyTransactionsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/{year}/{month}/{day}/transactions.{format}', 'get', metadata);
  }

  /**
   * **MLB Daily Schedule** provides the date, time and location for all games on a given MLB
   * defined day.
   *
   * @summary Daily Schedule
   */
  mlbDailySchedule(metadata: types.MlbDailyScheduleMetadataParam): Promise<FetchResponse<200, types.MlbDailyScheduleResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{year}/{month}/{day}/schedule.{format}', 'get', metadata);
  }

  /**
   * **MLB Game Boxscore** provides inning-by-inning scoring breakdown, hits and errors by
   * team, win/loss results, as well as details on run-scoring events for a given game.
   *
   * @summary Game Boxscore
   */
  mlbGameBoxscore(metadata: types.MlbGameBoxscoreMetadataParam): Promise<FetchResponse<200, types.MlbGameBoxscoreResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{game_id}/boxscore.{format}', 'get', metadata);
  }

  /**
   * **MLB Game Summary** provides team lineups as well as team and player statistics for a
   * given game.
   *
   * @summary Game Summary
   */
  mlbGameSummary(metadata: types.MlbGameSummaryMetadataParam): Promise<FetchResponse<200, types.MlbGameSummaryResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{game_id}/summary.{format}', 'get', metadata);
  }

  /**
   * **MLB Glossary** provides full text descriptions for pitch ids, player status ids,
   * outcome ids, and game status ids.
   *
   * @summary Glossary
   */
  mlbGlossary(metadata: types.MlbGlossaryMetadataParam): Promise<FetchResponse<200, types.MlbGlossaryResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/glossary.{format}', 'get', metadata);
  }

  /**
   * **MLB League Depth Chart** provides current depth chart positions for every MLB team.
   *
   * @summary League Depth Chart
   */
  mlbLeagueDepthChart(metadata: types.MlbLeagueDepthChartMetadataParam): Promise<FetchResponse<200, types.MlbLeagueDepthChartResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/depth_charts.{format}', 'get', metadata);
  }

  /**
   * **MLB League Leaders** provides AL, NL, and MLB leader information for various hitting
   * and pitching statistics.
   *
   * @summary League Leaders
   */
  mlbLeagueLeaders(metadata: types.MlbLeagueLeadersMetadataParam): Promise<FetchResponse<200, types.MlbLeagueLeadersResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/seasons/{season_year}/{season_type}/leaders/statistics.{format}', 'get', metadata);
  }

  /**
   * **MLB Player Profile** provides player biographical information, including current and
   * historical seasonal statistics and splits.
   *
   * @summary Player Profile
   */
  mlbPlayerProfile(metadata: types.MlbPlayerProfileMetadataParam): Promise<FetchResponse<200, types.MlbPlayerProfileResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/players/{player_id}/profile.{format}', 'get', metadata);
  }

  /**
   * **MLB Injuries** provides information concerning all current injuries across the league.
   *
   * @summary Injuries
   */
  mlbInjuries(metadata: types.MlbInjuriesMetadataParam): Promise<FetchResponse<200, types.MlbInjuriesResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/injuries.{format}', 'get', metadata);
  }

  /**
   * **MLB League Schedule** provides complete schedule information for a given season,
   * including venue and broadcast info.
   *
   * @summary League Schedule
   */
  mlbLeagueSchedule(metadata: types.MlbLeagueScheduleMetadataParam): Promise<FetchResponse<200, types.MlbLeagueScheduleResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{season_year}/{season_type}/schedule.{format}', 'get', metadata);
  }

  /**
   * **MLB Game Pitch Metrics** provides detailed metrics on pitch type, velocity, and
   * results for all pitchers in a given game.
   *
   * @summary Game Pitch Metrics
   */
  mlbGamePitchMetrics(metadata: types.MlbGamePitchMetricsMetadataParam): Promise<FetchResponse<200, types.MlbGamePitchMetricsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{game_id}/pitch_metrics.{format}', 'get', metadata);
  }

  /**
   * **MLB Seasonal Pitch Metrics** provides detailed metrics on pitch type, velocity, and
   * results for a given pitcher by season.
   *
   * @summary Seasonal Pitch Metrics
   */
  mlbSeasonalPitchMetrics(metadata: types.MlbSeasonalPitchMetricsMetadataParam): Promise<FetchResponse<200, types.MlbSeasonalPitchMetricsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/players/{player_id}/pitch_metrics.{format}', 'get', metadata);
  }

  /**
   * **MLB League Hierarchy** provides top-level information for each team, including league
   * and division distinction, and venue information.
   *
   * @summary League Hierarchy
   */
  mlbLeagueHierarachy(metadata: types.MlbLeagueHierarachyMetadataParam): Promise<FetchResponse<200, types.MlbLeagueHierarachyResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/hierarchy.{format}', 'get', metadata);
  }

  /**
   * **MLB Seasonal Splits** provides detailed splits for a given team and all players on the
   * roster.
   *
   * @summary Seasonal Splits
   */
  mlbSeasonalSplits(metadata: types.MlbSeasonalSplitsMetadataParam): Promise<FetchResponse<200, types.MlbSeasonalSplitsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/seasons/{season_year}/{season_type}/teams/{team_id}/splits.{format}', 'get', metadata);
  }

  /**
   * **MLB Seasonal Transactions** provides information concerning all transactions taking
   * place in a given MLB season.
   *
   * @summary Seasonal Transactions
   */
  mlbSeasonalTransactions(metadata: types.MlbSeasonalTransactionsMetadataParam): Promise<FetchResponse<200, types.MlbSeasonalTransactionsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/{season_year}/transactions.{format}', 'get', metadata);
  }

  /**
   * **MLB Game Play-by-Play** provides detailed, real-time information on every pitch and
   * game event.
   *
   * @summary Game Play-by-Play
   */
  mlbPlayByPlay(metadata: types.MlbPlayByPlayMetadataParam): Promise<FetchResponse<200, types.MlbPlayByPlayResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{game_id}/pbp.{format}', 'get', metadata);
  }

  /**
   * **MLB Series Schedule** provides postseason participant information as well as the date,
   * time, location, and other event details for every match-up taking place for the entire
   * postseason.
   *
   * @summary Series Schedule
   */
  mlbSeriesSchedule(metadata: types.MlbSeriesScheduleMetadataParam): Promise<FetchResponse<200, types.MlbSeriesScheduleResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/series/{season_year}/{season_type}/schedule.{format}', 'get', metadata);
  }

  /**
   * **MLB Rankings** provides league and division rank for each team, including postseason
   * clinching status.
   *
   * @summary Rankings
   */
  mlbRankings(metadata: types.MlbRankingsMetadataParam): Promise<FetchResponse<200, types.MlbRankingsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/seasons/{season_year}/{season_type}/rankings.{format}', 'get', metadata);
  }

  /**
   * **MLB Standings** provides detailed standings information for each MLB division.
   *
   * @summary Standings
   */
  mlbStandings(metadata: types.MlbStandingsMetadataParam): Promise<FetchResponse<200, types.MlbStandingsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/seasons/{season_year}/{season_type}/standings.{format}', 'get', metadata);
  }

  /**
   * **MLB Seasonal Statistics** provides detailed season-to-date stats for given team and
   * all players on the roster.
   *
   * @summary Seasonal Statistics
   */
  mlbSeasonalStatistics(metadata: types.MlbSeasonalStatisticsMetadataParam): Promise<FetchResponse<200, types.MlbSeasonalStatisticsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/seasons/{season_year}/{season_type}/teams/{team_id}/statistics.{format}', 'get', metadata);
  }

  /**
   * **MLB Series Statistics** provides detailed statistics for a given postseason series and
   * participating team.
   *
   * @summary Series Statistics
   */
  mlbSeriesStatistics(metadata: types.MlbSeriesStatisticsMetadataParam): Promise<FetchResponse<200, types.MlbSeriesStatisticsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/series/{series_id}/teams/{team_id}/statistics.{format}', 'get', metadata);
  }

  /**
   * **MLB Team Depth Chart** provides current depth chart for all positions on a given team.
   *
   * @summary Team Depth Chart
   */
  mlbTeamDepthChart(metadata: types.MlbTeamDepthChartMetadataParam): Promise<FetchResponse<200, types.MlbTeamDepthChartResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/teams/{team_id}/depth_chart.{format}', 'get', metadata);
  }

  /**
   * **MLB Seasons** provides a complete list of historical season information available in
   * the API.
   *
   * @summary Seasons
   */
  mlbSeasons(metadata: types.MlbSeasonsMetadataParam): Promise<FetchResponse<200, types.MlbSeasonsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/seasons.{format}', 'get', metadata);
  }

  /**
   * **MLB Series Summary** provides team and player statistics for a given postseason
   * series.
   *
   * @summary Series Summary
   */
  mlbSeriesSummary(metadata: types.MlbSeriesSummaryMetadataParam): Promise<FetchResponse<200, types.MlbSeriesSummaryResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/series/{series_id}/summary.{format}', 'get', metadata);
  }

  /**
   * **MLB Team Profile** provides top-level team information including all players currently
   * on the 25-man roster, 40-man roster, or expected to join the team.
   *
   * @summary Team Profile
   */
  mlbTeamProfile(metadata: types.MlbTeamProfileMetadataParam): Promise<FetchResponse<200, types.MlbTeamProfileResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/teams/{team_id}/profile.{format}', 'get', metadata);
  }

  /**
   * **MLB Venues** provides the name, location, and capacity of each venue, along with the
   * dimensions of each field.
   *
   * @summary Venues
   */
  mlbVenues(metadata: types.MlbVenuesMetadataParam): Promise<FetchResponse<200, types.MlbVenuesResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/venues.{format}', 'get', metadata);
  }

  /**
   * **MLB Event Tracking** provides in-depth tracking information for all players on the
   * field during a given event.
   *
   * @summary Event Tracking
   */
  mlbEventTracking(metadata: types.MlbEventTrackingMetadataParam): Promise<FetchResponse<200, types.MlbEventTrackingResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/games/{game_id}/events/{event_id}/tracking.{format}', 'get', metadata);
  }

  /**
   * **MLB Teams** provides a complete list of active teams in the MLB API database.
   *
   * @summary Teams
   */
  mlbTeams(metadata: types.MlbTeamsMetadataParam): Promise<FetchResponse<200, types.MlbTeamsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/teams.{format}', 'get', metadata);
  }

  /**
   * **MLB Officials** provides a complete list of officials in the MLB API database.
   *
   * @summary Officials
   */
  mlbOfficials(metadata: types.MlbOfficialsMetadataParam): Promise<FetchResponse<200, types.MlbOfficialsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/officials.{format}', 'get', metadata);
  }

  /**
   * **MLB Free Agents** provides a list of all current free agents in the league.
   *
   * @summary Free Agents
   */
  mlbFreeAgents(metadata: types.MlbFreeAgentsMetadataParam): Promise<FetchResponse<200, types.MlbFreeAgentsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/free_agents.{format}', 'get', metadata);
  }

  /**
   * **MLB Awards List** provides a list of all MLB awards available in the API.
   *
   * @summary Awards List
   */
  mlbAwardsList(metadata: types.MlbAwardsListMetadataParam): Promise<FetchResponse<200, types.MlbAwardsListResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/league/awards/list.{format}', 'get', metadata);
  }

  /**
   * **MLB Seasonal Awards** provides a list of all MLB awards for a given season and season
   * type.
   *
   * @summary Seasonal Awards
   */
  mlbSeasonalAwards(metadata: types.MlbSeasonalAwardsMetadataParam): Promise<FetchResponse<200, types.MlbSeasonalAwardsResponse200>> {
    return this.core.fetch('/{access_level}/v8/{language_code}/seasons/{season_year}/{season_type}/awards.{format}', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { MlbAwardsListMetadataParam, MlbAwardsListResponse200, MlbDailyBoxscoreMetadataParam, MlbDailyBoxscoreResponse200, MlbDailyChangeLogMetadataParam, MlbDailyChangeLogResponse200, MlbDailyScheduleMetadataParam, MlbDailyScheduleResponse200, MlbDailySummaryMetadataParam, MlbDailySummaryResponse200, MlbDailyTransactionsMetadataParam, MlbDailyTransactionsResponse200, MlbEventTrackingMetadataParam, MlbEventTrackingResponse200, MlbFreeAgentsMetadataParam, MlbFreeAgentsResponse200, MlbGameBoxscoreMetadataParam, MlbGameBoxscoreResponse200, MlbGameExtendedSummaryMetadataParam, MlbGameExtendedSummaryResponse200, MlbGamePitchMetricsMetadataParam, MlbGamePitchMetricsResponse200, MlbGameSummaryMetadataParam, MlbGameSummaryResponse200, MlbGlossaryMetadataParam, MlbGlossaryResponse200, MlbInjuriesMetadataParam, MlbInjuriesResponse200, MlbLeagueDepthChartMetadataParam, MlbLeagueDepthChartResponse200, MlbLeagueHierarachyMetadataParam, MlbLeagueHierarachyResponse200, MlbLeagueLeadersMetadataParam, MlbLeagueLeadersResponse200, MlbLeagueScheduleMetadataParam, MlbLeagueScheduleResponse200, MlbOfficialsMetadataParam, MlbOfficialsResponse200, MlbPlayByPlayMetadataParam, MlbPlayByPlayResponse200, MlbPlayerProfileMetadataParam, MlbPlayerProfileResponse200, MlbRankingsMetadataParam, MlbRankingsResponse200, MlbSeasonalAwardsMetadataParam, MlbSeasonalAwardsResponse200, MlbSeasonalPitchMetricsMetadataParam, MlbSeasonalPitchMetricsResponse200, MlbSeasonalSplitsMetadataParam, MlbSeasonalSplitsResponse200, MlbSeasonalStatisticsMetadataParam, MlbSeasonalStatisticsResponse200, MlbSeasonalTransactionsMetadataParam, MlbSeasonalTransactionsResponse200, MlbSeasonsMetadataParam, MlbSeasonsResponse200, MlbSeriesScheduleMetadataParam, MlbSeriesScheduleResponse200, MlbSeriesStatisticsMetadataParam, MlbSeriesStatisticsResponse200, MlbSeriesSummaryMetadataParam, MlbSeriesSummaryResponse200, MlbStandingsMetadataParam, MlbStandingsResponse200, MlbTeamDepthChartMetadataParam, MlbTeamDepthChartResponse200, MlbTeamProfileMetadataParam, MlbTeamProfileResponse200, MlbTeamsMetadataParam, MlbTeamsResponse200, MlbVenuesMetadataParam, MlbVenuesResponse200 } from './types';
