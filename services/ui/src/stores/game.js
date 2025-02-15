import { defineStore } from 'pinia';
import { socket } from '@/socket';
import router from '@/router';
import { useGcStore } from './gc';
import usa from '@/modules/game/const/game.map.entity';
import { GAME_STATE, QUESTION_STATE, QUESTION_TYPE } from '@/modules/game/const/game.enum';
import { useConnectionStore } from './connection';

export const useGameStore = defineStore('game', {
  state: () => ({
    selectedLocations: new Map(),
    activeUserId: null,
    map: {},
    neightboursLocations: usa,
    question: null,
    questionState: QUESTION_STATE.INNACTIVE,
    gameState: GAME_STATE.LOBBY,
    selectedChoice: null,
    time: null,
    timer: null,
    answer: null,
    userAnswers: null,
    responseTimeStart: null,
    disput: [],
  }),
  
  getters: {
    currentUserId() {
      const connection = useConnectionStore();
      return connection.socketId;
    },
    isActiveUser(state) {
      return state.activeUserId === this.currentUserId;
    },
    flatSelectedLocations(state) {
      return [...state.selectedLocations.keys()];
    },
    getAvailableLocations(state) {
      const availableLocations = new Set();
      const notAvailableLocations = new Set();

      state.map.locations.forEach(({ id }) => {
        const userId = state.selectedLocations.get(id);
        const locationAndNeightbours = state.neightboursLocations[id].concat(id);

        if (state.gameState === GAME_STATE.PREPARE) {
          this.updateAvailableLocations(userId, locationAndNeightbours, availableLocations, notAvailableLocations);
        } else if (userId === this.currentUserId) {
          this.addAvailableLocations(locationAndNeightbours, availableLocations, notAvailableLocations);
        }
      });

      return availableLocations;
    },
    isAvailableLocation(state) {
      return (locationId) => this.getAvailableLocations.has(locationId);
    },
    getMap(state) {
      const gcStore = useGcStore();
      return {
        ...state.map,
        locations: state.map.locations.map(location => this.mapLocation(location, gcStore, state)),
      };
    },
    getClientAnswers(state) {
      const gcStore = useGcStore();
      const answerMap = new Map();

      Object.entries(state.userAnswers).forEach(([userId, answer]) => {
        const user = gcStore.clients.get(userId);
        if (!answerMap.has(answer)) {
          answerMap.set(answer, []);
        }
        answerMap.get(answer).push(user);
      });

      return answerMap;
    },
  },

  actions: {
    bootstrap() {
      socket.on('game', ({ method, payload }) => {
        console.log(method, payload);
        if (this[`${method}Res`]) {
          this[`${method}Res`](payload);
        }
      });
    },
    startGame(roomId) {
      socket.emit('game', { method: 'startGame', payload: { roomId } });
    },
    startGameRes({ roomId, gameState }) {
      if (roomId) {
        router.push({ name: 'Game', params: { id: roomId } });
        this.gameState = gameState;
      }
    },
    selectPosition(position) {
      if (!this.isActiveUser || !position || !this.getAvailableLocations.has(position) || this.selectedLocations.get(position) === this.currentUserId) {
        return;
      }
      socket.emit('game', {
        method: 'selectPosition',
        payload: {
          roomId: router.currentRoute.value.params.id,
          position,
        },
      });
    },
    selectPositionRes({ position, userId }) {
      this.selectedLocations.set(position, userId);
    },
    setActiveUserRes({ userId }) {
      this.activeUserId = userId;
      this.questionState = QUESTION_STATE.INNACTIVE;
    },
    setStateRes(gameState) {
      this.gameState = gameState;
    },
    setMap(map) {
      this.map = map;
    },
    selectChoice(choice) {
      this.stopTimer();
      this.selectedChoice = choice;
      socket.emit('game', {
        method: 'selectChoice',
        payload: {
         
          choice,
          roomId: router.currentRoute.value.params.id,
          responseRate: Date.now() - this.responseTimeStart,
        },
      });
    },
    sendQuestionRes({ question, options }) {
      const preparedQuestion = question.type === QUESTION_TYPE.OPTION_SELECTION
        ? { ...question, choices: JSON.parse(question.choices) }
        : question;

      this.resetQuestionState();
      this.responseTimeStart = Date.now();
      this.startTimer(options.time);

      const isForCurrentUser = this.disput.includes(this.currentUserId);
      this.questionState = this.gameState !== GAME_STATE.BATTLE || isForCurrentUser
        ? QUESTION_STATE.ACTIVE
        : QUESTION_STATE.ONLY_SHOW;

      this.question = preparedQuestion;
    },
    startTimer(time) {
      this.time = time;
      this.timer = setInterval(() => {
        if (this.time <= 0) {
          this.selectChoice(0);
        }
        this.time -= 1000;
      }, 1000);
    },
    stopTimer() {
      this.time = 0;
      this.questionState = QUESTION_STATE.ONLY_SHOW;
      clearInterval(this.timer);
    },
    finishContestRes({ answer, usersAnswers }) {
      this.answer = answer;
      this.userAnswers = usersAnswers;
    },
    setDisputRes({ userId, rivalUserId }) {
      this.disput = [userId, rivalUserId];
    },

    // Вспомогательные методы
    updateAvailableLocations(userId, locationAndNeightbours, availableLocations, notAvailableLocations) {
      if (userId && userId !== this.currentUserId) {
        locationAndNeightbours.forEach(location => {
          notAvailableLocations.add(location);
          availableLocations.delete(location);
        });
      } else {
        this.addAvailableLocations(locationAndNeightbours, availableLocations, notAvailableLocations);
      }
    },
    addAvailableLocations(locationAndNeightbours, availableLocations, notAvailableLocations) {
      locationAndNeightbours.forEach(neighbour => {
        if (!notAvailableLocations.has(neighbour)) {
          availableLocations.add(neighbour);
        }
      });
    },
    mapLocation(location, gcStore, state) {
      const styleClasses = [];
      const userId = state.selectedLocations.get(location.id);

      if (!this.getAvailableLocations.has(location.id)) {
        styleClasses.push('disabled');
      }

      if (userId) {
        const { color } = gcStore.clients.get(userId);
        styleClasses.push(`fill-${color}`);
      }

      return {
        ...location,
        class: styleClasses,
      };
    },
    resetQuestionState() {
      this.selectedChoice = null;
      this.answer = null;
    },
  },
});
