import { defineStore } from 'pinia';
import { socket } from '@/socket';
import router from '@/router';
import { useGameStore } from '@/stores/game';

export const useGcStore = defineStore('gc', {
  state: () => ({
    clients: new Map(),
    settings: null,
  }),
  getters: {
    currentClient: (state) => state.clients.get(socket.id), 
  },
  actions: {
    bootstrap() {
      socket.connect();
      socket.on('gc', ({ method, payload }) => {
        console.log(method, payload);
        this[`${method}Res`](payload);
      });
    },
    createRoom() {
      this.bootstrap();
      socket.emit('gc', { method: 'createRoom' });
    },
    createRoomRes({ roomId }) {
      router.push({ name: 'Room', params: { id: roomId } });
    },
    joinRoom(roomId) {
      const gameStore = useGameStore();
      if (!socket.connected) {
        this.bootstrap();
      }
      gameStore.bootstrap();
      socket.emit('gc', { method: 'joinRoom', payload: { roomId } });
    },
    setRoomConfiguration(roomId) {
      this.emit('gc', { 
        time: 30000,
      });
    },
    joinRoomRes({ clients }) {
      this.clients = new Map(clients.filter(Boolean).map((it) => [it.id, it]));
    },
    leaveRoomRes(result) {
      this.clients = new Map(result.map((it) => [it.id, it]));
    },
  },
});
