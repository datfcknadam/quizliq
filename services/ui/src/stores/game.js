import { defineStore } from 'pinia';
import { socket } from '@/socket';
import router from '@/router';
import { useGcStore } from './gc';
import usa from '@/modules/game/game.map.entity';

export const useGameStore = defineStore('game', {
  state: () => ({
    selectedLocations: new Map(),
    activeUserId: null,
    map: {},
    neightboursLocations: usa, 
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
      if (!this.isActiveUser) {
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
    }
  },
});
