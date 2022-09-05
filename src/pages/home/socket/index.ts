import { SOCKETURL } from '@/api/socker';
import { io, Socket } from 'socket.io-client';

// export class SSHSocket {
//   socket: Socket;
//   constructor(config: { on: (data: any) => void; loginData: any }) {
//     this.socket = io();
//     this.socket.on('connect', () => {
//       this.socket.on(this.socket.id, config.on);
//       this.socket.emit('login', config.loginData);
//     });
//   }

//   // connected() {

//   // };

//   send(data: any) {
//     this.socket.emit(this.socket.id, data);
//   }

//   on() {}

//   getId() {
//     return this.socket.id;
//   }
// }
