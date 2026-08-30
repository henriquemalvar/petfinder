import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { TEST_DATABASE_URL } from './testDatabase';

export default function setup(): void {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: path.resolve(__dirname, '../../..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
    },
  });
}
