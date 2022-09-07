import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import 'xterm/css/xterm.css';
import { FitAddon } from 'xterm-addon-fit';
import styles from './index.module.less';
import { Socket } from 'socket.io-client';
import { useClientWHHook } from '@/hook/useClientWHHook';
import { LoginError, YunFanTerminal } from './terimal';
import { ILoginSSH } from './type';
const formItemLayout = {
  labelCol: { span: 4 },
};

interface LoginModalProps {
  isShow: boolean;
  onSubmit: (data: ILoginSSH) => Promise<Boolean>;
}

const handleLoginMsgError = (errMsg: LoginError) => {
  switch (errMsg) {
    case LoginError.NETWORK_ERROR:
      return '请确保网络正常';
    case LoginError.INVALID_CONFIG:
      return '请输入正确的信息';
    case LoginError.TIMEOUT:
      return '连接ssh超时';
    default:
      return '登录失败';
  }
};

const LoginModal = ({ isShow, onSubmit }: LoginModalProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isShow) setIsLoading(false);
  }, [isShow]);

  const login = async () => {
    setIsLoading(true);
    const data = await form.validateFields();
    await onSubmit(data);
    setIsLoading(false);
  };

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
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            style={{ width: '100%' }}
            onClick={login}
            loading={isLoading}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
const Home = () => {
  const sshRef = useRef<Socket>(null) as MutableRefObject<Socket>;
  const termRef = useRef<YunFanTerminal>(
    null,
  ) as MutableRefObject<YunFanTerminal>;
  const fitAddonRef = useRef<FitAddon>(null) as MutableRefObject<FitAddon>;
  const [isShow, setIsShow] = useState(true);
  const [isReConnecting, setIsReConnecting] = useState(false);

  const { containerRef, size } = useClientWHHook();

  useEffect(() => {
    if (!containerRef.current) return;
    termRef.current = new YunFanTerminal({
      container: containerRef.current,
      offLineEvent: (msg?: string) => {
        Modal.info({
          width: 500,
          title: (
            <div style={{ fontSize: 15 }}>
              <div style={{ marginBottom: 16 }}>
                {msg || '断线啦,请确保网络无误后,重新登录'}
              </div>
            </div>
          ),
          okText: '确认',
          okButtonProps: {
            loading: isReConnecting,
          },
          onOk: async () => {
            if (!termRef.current) return;
            setIsReConnecting(true);
            const isConnect = await termRef.current?.reConnect();
            if (!isConnect) return message.error('请确保网络正常,并刷新页面后');
            setIsShow(true);
            setIsReConnecting(false);
          },
        });
      },
    });
    return () => {
      termRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    termRef.current.fitSize(size);
  }, [size]);

  const handleLogin = async (form: ILoginSSH) => {
    try {
      const msg = await termRef.current.login({
        form,
        size,
      });
      if (!msg) {
        setIsShow(false);
        return true;
      }
      message.error(handleLoginMsgError(msg));
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <>
      <LoginModal isShow={isShow} onSubmit={handleLogin} />
      <div ref={containerRef} className={styles.containeTerm}></div>
    </>
  );
};
export default Home;
