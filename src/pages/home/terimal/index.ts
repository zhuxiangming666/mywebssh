import { io, Socket } from 'socket.io-client';
import { Terminal } from 'xterm';

import { ILoginSSH } from '../type';
import { FitAddon } from 'xterm-addon-fit';
import { MyAddon } from '../myAddon/attach';
import { MAX_TIME_NO_INPUT, MAX_TIME_UPDATE_INTERVAL } from '../config';

export enum LoginError {
  TIMEOUT = '登录超时',
  INVALID_CONFIG = '无效配置',
  NETWORK_ERROR = '网络异常',
}

interface Config {
  container: HTMLDivElement;
  offLineEvent: () => void;
}

interface Size {
  w: number;
  h: number;
}

interface LoginProps {
  form: ILoginSSH;
  size: Size;
}

export class YunFanTerminal extends Terminal {
  private _socket: Socket;
  private _fitAddon: FitAddon;
  private _offLineEvent: (msg?: string) => void;
  private _isOnLogin = false;
  private _lastUserInput = Date.now();
  constructor({ container, offLineEvent }: Config) {
    super();
    this._socket = io({
      path: '/ssh',
      reconnection: false,
    });

    // 加载自适应大小插件
    const fitAddon = new FitAddon();
    this._fitAddon = fitAddon;
    this.loadAddon(fitAddon);
    this.open(container);
    this.focus();
    this._offLineEvent = offLineEvent;
  }

  // 断线事件
  private _afterLoginLister() {
    // 添加断线的事件
    this._socket.on('disconnect', () => {
      console.log('[BUTTERFLY][16:36:57]', this._isOnLogin);
      if (!this._isOnLogin) return;
      this._isOnLogin = false;
      this._socket.removeAllListeners();
      // xterm 清楚插件
      this.clear();
      this._offLineEvent();
    });

    // 添加自动退出事件
    this._addNoInputClose();

    // 添加服务端端开链接
    this._socket.once('exit_server', () => {
      if (!this._isOnLogin) return;
      this._isOnLogin = false;
      this._socket.disconnect();
      this._socket.removeAllListeners();
      // xterm 清楚插件
      this.clear();
      this._offLineEvent('已退出登录.');
    });
  }

  private _addNoInputClose() {
    // 创建定时器
    const createTimer = () =>
      setTimeout(() => {
        if (this._socket.connected) {
          this._socket.emit('exit');
        }
      }, MAX_TIME_NO_INPUT);

    let timer = createTimer();
    this.onData(() => {
      const nowDate = Date.now();
      if (nowDate - this._lastUserInput > MAX_TIME_UPDATE_INTERVAL) {
        clearTimeout(timer);
        this._lastUserInput = nowDate;
        timer = createTimer();
      }
    });
    return timer;
  }

  public fitSize(size: { w: number; h: number }) {
    if (!this._isOnLogin) return;
    const { cols, rows } = this._fitAddon.proposeDimensions();
    this._socket.emit('resize', {
      ...size,
      cols,
      rows,
    });
    this._socket.once('resize', () => {
      this._fitAddon.fit();
    });
  }

  public login({ size, form }: LoginProps): Promise<LoginError | undefined> {
    return new Promise((res) => {
      if (!this._socket.connected) return res(LoginError.NETWORK_ERROR);
      // 触发登陆的条件
      this._socket.emit('login', form);

      let timer: any;
      // 监听登陆后的回调
      this._socket.once('login', (data) => {
        if (timer) clearTimeout(timer);
        const status = data.status !== 0;
        const isOffLine = !this._socket.connected;

        if (status || isOffLine) {
          // 登录失败(1.服务端登录失败, 2.网络存在问题)
          return res(
            status ? LoginError.INVALID_CONFIG : LoginError.NETWORK_ERROR,
          );
        }

        this._isOnLogin = true;
        // 适应夫容器的大小
        this.fitSize(size);

        // 创建socket组件
        const comAddon = new MyAddon(this._socket);
        this.loadAddon(comAddon);
        // 添加断线事件
        this._afterLoginLister();
        res(undefined);
      });

      // 登录超时,3s
      timer = setTimeout(() => {
        this._socket.removeListener('login');
        res(LoginError.TIMEOUT);
      }, 3000);
    });
  }

  public destroy() {
    this._socket.removeAllListeners();
    this.dispose();
  }

  public reConnect() {
    return new Promise((res, rej) => {
      this._socket.connect();
      let timer: any;
      this._socket.once('connect', () => {
        timer && clearTimeout(timer);
        res(true);
      });

      timer = setTimeout(() => {
        this._socket.removeListener('connect');
        res(false);
      }, 3000);
    });
  }
}
