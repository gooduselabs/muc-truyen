import { execSync } from 'child_process';
export default async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://story:story@localhost:5432/story_test';
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', { cwd: __dirname + '/..', env: process.env, stdio: 'ignore' });
};
