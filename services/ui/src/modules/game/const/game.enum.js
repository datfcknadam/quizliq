export const GAME_STATE = {
  LOBBY: 0,
  PREPARE: 1,
  CONTEST: 2,
  LAND_GRAB: 3,
  BATTLE: 4,
  FINISH: 5,
}

export const QUESTION_STATE = {
  INNACTIVE: 0,
  ACTIVE: 1,
  WAIT_OTHER: 2,
  ONLY_SHOW: 3,
}

export const QUESTION_TYPE = {
  EXACT: 'exact',
  OPTION_SELECTION: 'option_selection'
}