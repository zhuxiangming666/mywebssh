import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import 'xterm/css/xterm.css';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import styles from './index.module.less';
import { MyAddon } from './myAddon/attach';
import { io, Socket } from 'socket.io-client';
import { useClientWHHook } from '@/hook/useClientWHHook';
const formItemLayout = {
  labelCol: { span: 4 },
};

interface LoginModalProps {
  isShow: boolean;
  onSubmit: (data: any) => void;
}

const LoginModal = ({ isShow, onSubmit }: LoginModalProps) => {
  const [form] = Form.useForm();
  const [isLoading,setIsLoading] = useState(false);
  const login = async () => {
    setIsLoading(false);
    const data = await form.validateFields();
    onSubmit(data);
  };

  useEffect(() => {
    if(!isShow) setIsLoading(false);
  },[isShow])

  return (
    <Modal visible={isShow} title={'标准登录｜Linux实例'} footer={null}>
      <Form form={form} labelAlign="right" {...formItemLayout}>
        <Form.Item label="实例IP：" name="ip">
          <Input />
        </Form.Item>
        <Form.Item label="端口：" name="port" initialValue="22">
          <Input />
        </Form.Item>
        <Form.Item label="用户名：" name="username">
          <Input />
        </Form.Item>
        <Form.Item label="密码：" name="password">
          <Input type="password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" style={{ width: '100%' }} onClick={login} loading={isLoading}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
const Home = () => {
  const sshRef = useRef<Socket>(null) as MutableRefObject<Socket>;
  const termRef = useRef<Terminal>(null) as MutableRefObject<Terminal>;
  const fitAddonRef = useRef<FitAddon>(null) as MutableRefObject<FitAddon>;
  const [isShow, setIsShow] = useState(true);

  const { containerRef, size } = useClientWHHook();

  useEffect(() => {
    if (!fitAddonRef.current || !sshRef.current || !sshRef.current.connected)
      return;
    const { cols, rows } = fitAddonRef.current.proposeDimensions();
    fitAddonRef.current.fit();
    sshRef.current.emit('resize', {
      ...size,
      cols,
      rows,
    });
  }, [size]);

  const handleLogin = (form: any) => {
    const socket = io({
      path: '/ssh',
    });

    socket.on('connect', () => {
      if (termRef.current) {
        // 销毁上一个termRef.current终端
        // termRef.current.dispose();
        socket.off('login');
      }

      if (!containerRef.current) return;
      var term = new Terminal();
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      // const CommunicateAddon= new MyAddon();
      term.loadAddon(fitAddon);
      //@ts-ignore
      term.open(containerRef.current);
      term.focus();
      fitAddon.fit();

      termRef.current = term;

      socket.emit('login', form);
      socket.once('login', (data) => {
        if (data.status !== 0) {
          message.error('登录失败');
        } else {
          // 初始化窗口大小
          if (
            !fitAddonRef.current ||
            !sshRef.current ||
            !sshRef.current.connected
          )
            return;
          const { cols, rows } = fitAddonRef.current.proposeDimensions();
          fitAddonRef.current.fit();
          sshRef.current.emit('resize', {
            ...size,
            cols,
            rows,
          });
          message.success('登录成功');
          setIsShow(false);
          const comAddon = new MyAddon(socket);
          termRef.current.loadAddon(comAddon);
        }
      });
      socket.once('error',(data)=>{

      });
    });

    sshRef.current = socket;
  };

  return (
    <>
      <LoginModal isShow={isShow} onSubmit={handleLogin} />
      <div ref={containerRef} className={styles.containeTerm}></div>
    </>
  );
};
export default Home;
