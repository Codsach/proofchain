const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc src/app/(dashboard)/investigator/submit/page.tsx --noEmit --esModuleInterop --skipLibCheck --jsx react-jsx --moduleResolution bundler --target esnext --module esnext --baseUrl . --paths "@/*": ["src/*"]', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.log(error.stdout);
  console.log(error.stderr);
}
