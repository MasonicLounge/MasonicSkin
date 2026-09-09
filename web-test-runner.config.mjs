import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, json: true, tsconfig: 'tsconfig.json' })],
  browsers: [playwrightLauncher({ browserName: 'chromium' })],
  testFramework: {
    config: {
      timeout: 10000,
    },
  },
};