import { defineStore } from 'pinia';
import { socket } from '@/socket';
import router from '@/router';
import { useGcStore } from './gc';
import usa from '@/modules/game/const/game.map.entity';
import { QUESTION_STATE, QUESTION_TYPE } from '@/modules/game/const/game.enum';

export const useGameStore = defineStore('game', {
  state: () => ({
    selectedLocations: new Map(),
    activeUserId: null,
    map: {},
    neightboursLocations: usa,
    question: null,
    questionState: QUESTION_STATE.INNACTIVE,
    selectedChoice: null,
    time: null,
    timer: null,
    answer: null,
    userAnswers: null,
  }),
  getters: {
    isActiveUser: (state) => state.activeUserId === socket.id,
    flatSelectedLocations: state => [...state.selectedLocations.keys()],
    getMap: (state) => {
      const gcStore = useGcStore();
      return ({
        ...state.map,
        locations: state.map.locations.map(location => {
          const clientId = state.selectedLocations.get(location.id);
          if (!clientId) {
            return location;
          }
          const { color } = gcStore.clients.get(clientId);
          return {
            ...location,
            class: `fill-${color}`,
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
    startGameRes({ roomId, gameStatus }) {
      if (roomId) {
        router.push({ name: 'Game', params: { id: roomId } });
        this.gameStatus = gameStatus;
      }
    },
    selectPosition(position) {
      if (!this.isActiveUser || !position) {
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
    setActiveUserRes({ clientId, gameStatus }) {
      this.activeUserId = clientId;
      this.gameStatus = gameStatus;
    },
    setMap(map) {
      this.map = map;
    },
    setChoice(choice) {
      if (this.questionState !== QUESTION_STATE.ACTIVE) {
        return;
      }
      this.stopTimer();
      this.selectedChoice = choice;
      socket.emit('game', {
        method: 'selectChoice',
        payload: { choice, roomId: router.currentRoute.value.params.id }
      });
    },
    sendQuestionRes({ question, options }) {
      const preparedQuestion = question.type === QUESTION_TYPE.OPTION_SELECTION
      ? { ...question, choices: JSON.parse(question.choices)} : question;

      this.startTimer(options.time);
      this.questionState = QUESTION_STATE.ACTIVE;
      this.question = preparedQuestion;
    },
    startTimer(time) {
      this.time = time;
      this.timer = setInterval(() => {
        if (this.time <= 0) {
          this.stopTimer()
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
