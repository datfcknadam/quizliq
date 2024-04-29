import { defineStore } from 'pinia';
import { socket } from '@/socket';
import { useRoute } from 'vue-router';
import router from '@/router';

function getLocationName(node) {
  return node && node?.attributes?.name?.value;
}

export const useGameStore = defineStore('game', {
  state: () => ({
    selectedLocations: [],
    activeUserId: null,
  }),
  getters: {
    isActiveUser: (state) => state.activeUserId === socket.id,
  },
  actions: {
    bootstrap() {
      socket.on('game', ({ method, payload }) => {
        console.log(method, payload);
        this[`${method}Res`](payload);
      });
    },
    startGame(roomId) {
      socket.emit('game', { method: 'startGame', payload: { roomId } });
    },
    startGameRes(roomId) {
      if (roomId) {
        router.push({ name: 'Game', params: { id: roomId } });
      }
    },
    selectPosition(position) {
      if (!this.isActiveUser) {
        return;
      }
      const route = useRoute();
      socket.emit('game', {
        method: 'selectPosition',
        payload: {
          roomId: route.params.id,
          position,
        },
      });
    },
    selectPositionRes({ position }) {
      this.selectedLocations = this.selectedLocations.concat(position);
    },
    setActiveUserRes({ clientId }) {
      this.activeUserId = clientId;
    },
  },
});
