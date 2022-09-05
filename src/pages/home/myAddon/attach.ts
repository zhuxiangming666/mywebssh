import { Socket } from 'socket.io-client';
import { Terminal, IDisposable, ITerminalAddon } from 'xterm';

interface IAttachOptions {
  bidirectional?: boolean;
}

export class MyAddon implements ITerminalAddon {
  private _socket: Socket;
  private _bidirectional: boolean;
  private _disposables: IDisposable[] = [];

  constructor(socket: Socket, options?: IAttachOptions) {
    this._socket = socket;
    // always set binary type to arraybuffer, we do not handle blobs
    // this._socket.binaryType = 'arraybuffer';
    this._bidirectional = !(options && options.bidirectional === false);
  }

  public activate(terminal: Terminal): void {
    this._disposables.push(
      addSocketListener(this._socket, `${this._socket.id}`, (data) => {
        console.log('[BUTTERFLY][14:25:13]', this._socket.id);
        terminal.write(typeof data === 'string' ? data : new Uint8Array(data));
      }),
    );

    if (this._bidirectional) {
      this._disposables.push(terminal.onData((data) => this._sendData(data)));
      this._disposables.push(
        terminal.onBinary((data) => this._sendBinary(data)),
      );
    }

    this._disposables.push(
      addSocketListener(this._socket, 'disconnect', () => this.dispose()),
    );
    this._disposables.push(
      addSocketListener(this._socket, 'connect_error', () => this.dispose()),
    );
  }

  public dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
  }

  private _sendData(data: string): void {
    if (!this._socket.connected) {
      return;
    }
    this._socket.emit('user_input',data);
  }

  private _sendBinary(data: string): void {
    if (this._socket.connected) {
      return;
    }
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; ++i) {
      buffer[i] = data.charCodeAt(i) & 255;
    }
    this._socket.send(buffer);
  }
}

function addSocketListener(
  socket: Socket,
  type: string,
  handler: (data: any) => any,
): IDisposable {
  socket.on(type, handler);
  return {
    dispose: () => {
      if (!handler) {
        // Already disposed
        return;
      }
      socket.off(type, handler);
    },
  };
}
