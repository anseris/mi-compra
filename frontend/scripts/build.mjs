import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const configPath = fileURLToPath(new URL('../public/runtime-config.js', import.meta.url));
const angularCliPath = fileURLToPath(
  new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url),
);
const originalConfig = await readFile(configPath, 'utf8');
const apiHost = process.env['API_HOST']?.trim() ?? '';
const runtimeConfig = `window.__MI_COMPRA_CONFIG__ = ${JSON.stringify({ apiHost })};\n`;

try {
  await writeFile(configPath, runtimeConfig);

  const exitCode = await new Promise((resolve, reject) => {
    const build = spawn(
      process.execPath,
      [angularCliPath, 'build', '--configuration', 'production'],
      { stdio: 'inherit' },
    );

    build.once('error', reject);
    build.once('close', (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    process.exitCode = Number(exitCode);
  }
} finally {
  await writeFile(configPath, originalConfig);
}
