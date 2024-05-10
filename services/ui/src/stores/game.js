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
  }),
  getters: {
    currentUserId: () => {
      const connection = useConnectionStore();
      return connection.socketId;
    },
    isActiveUser: function(state) { return state.activeUserId === this.currentUserId },
    flatSelectedLocations: state => [...state.selectedLocations.keys()],
    getAvailableLocations: function(state) {
      const availableLocations = new Set();
      const notAvailableLocations = new Set();
      state.map.locations.forEach(({ id }) => {
        const clientId = state.selectedLocations.get(id);
        const locationAndNeightbours = state.neightboursLocations[id].concat(id);

        if (state.gameState === GAME_STATE.PREPARE) {
          if (clientId && clientId !== this.currentUserId) {
            locationAndNeightbours.forEach(location => {
              notAvailableLocations.add(location);
              availableLocations.delete(location);
            });
            return;
          }
          locationAndNeightbours.map(neigthbours => {
            if (notAvailableLocations.has(neigthbours)) {
              return;
            }
            availableLocations.add(neigthbours)
          });
        } 
        if (clientId === this.currentUserId) {
          locationAndNeightbours.map(neigthbours => {
            if (notAvailableLocations.has(neigthbours)) {
              return;
            }
            availableLocations.add(neigthbours)
          });
        }
      });
      return availableLocations;
    },
    isAvailableLocation: function (state) {
      return (locationId) => {
        
        return this.getAvailableLocations.has(locationId);
      }
    },
    getMap(state) {
      const gcStore = useGcStore();
      return ({
        ...state.map,
        locations: state.map.locations.map(location => {
          const styleClasses = [];
          const clientId = state.selectedLocations.get(location.id);

          if (!this.getAvailableLocations.has(location.id)) {
            styleClasses.push('disabled')
          }

          if (!clientId) {
            return {
              ...location,
              class: styleClasses, 
            };
          }

          const { color } = gcStore.clients.get(clientId);
          
          styleClasses.push(`fill-${color}`);
          return {
            ...location,
            class: styleClasses,
          }
        }),
      });
    },
    getClientAnswers(state) {
      const gcStore = useGcStore();
      const answerMap = new Map();
      Object.entries(state.userAnswers).forEach(([userId, answer]) => {
        const user = gcStore.clients.get(userId);
        if (answerMap.has(answer)) {
          return answerMap.set(answer, [user])
        }
        return answerMap.get(answer).push(user);
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
      if (!this.isActiveUser
          || !position
          || !this.getAvailableLocations.has(position)
          || this.selectedLocations.get(position) === this.currentUserId) {
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
    selectPositionRes({ position, clientId }) {
      this.selectedLocations.set(position, clientId);
    },
    setActiveUserRes({ clientId }) {
      this.activeUserId = clientId;
      this.questionState = QUESTION_STATE.INNACTIVE;
    },
    setStateRes(gameState) {
      this.gameState = gameState;
    },
    setMap(map) {
      this.map = map;
    },
    setChoice(choice) {
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
      ? { ...question, choices: JSON.parse(question.choices)} : question;
      this.selectedChoice = null;
      this.answer = null;
      this.responseTimeStart = Date.now();
      this.startTimer(options.time);
      this.questionState = QUESTION_STATE.ACTIVE;
      this.question = preparedQuestion;
    },
    startTimer(time) {
      this.time = time;
      this.timer = setInterval(() => {
        if (this.time <= 0) {
          this.setChoice(null);
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
      this.usersAnswers = usersAnswers;
    },
  },
});
