import { defineStore } from "pinia";
import { socket } from "@/socket";

export const useConnectionStore = defineStore("connection", {
  state: () => ({
    isConnected: false,
    socketId: null,
  }),

  actions: {
    bindEvents() {
      socket.on("connect", () => {
        this.isConnected = true;
        this.socketId = socket.id;
      });

      socket.on("disconnect", () => {
        this.isConnected = false;
      });
    },

    connect() {
      socket.connect();
    },

    disconnect() {
      socket.disconnect();
    },
  },
});
