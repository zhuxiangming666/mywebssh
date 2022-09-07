import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', component: '@/pages/home/index1' }],
  fastRefresh: {},
  proxy: {
    '/ssh': {
      // target: 'http://10.81.138.205:30080/', // test
      target: 'http://127.0.0.1:8081', // dev
      ws: true,
      changeOrigin: true,
    },
  },
});
