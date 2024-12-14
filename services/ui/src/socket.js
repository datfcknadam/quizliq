import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://192.168.3.116:8080';

export const socket = io(URL, {
  autoConnect: false,
});
