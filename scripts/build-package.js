/**
 * Official Zepp OS Package Builder with Preview Mode Patching
 * 
 * 1. Invokes Zeus CLI to compile native QuickJS bytecode and TGA assets.
 * 2. Patches `packageInfo.mode = "preview"` inside all device bundles so
 *    the Zepp App Developer Mode scanner accepts the app without
 *    "Only Preview apps are supported" errors.
 * 3. Outputs valid, signed .zab and .zpk to dist/ and public/.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import JSZip from 'jszip';

async function patchZpk(zpkBuffer) {
  const zpkZip = await JSZip.loadAsync(zpkBuffer);

  // 1. Patch device.zip
  const deviceZipFile = zpkZip.file('device.zip');
  if (deviceZipFile) {
    const deviceZipBuffer = await deviceZipFile.async('nodebuffer');
    const deviceZip = await JSZip.loadAsync(deviceZipBuffer);
    const appJsonFile = deviceZip.file('app.json');
    if (appJsonFile) {
      const appJsonStr = await appJsonFile.async('string');
      const appJson = JSON.parse(appJsonStr);
      if (!appJson.packageInfo) appJson.packageInfo = {};
      appJson.packageInfo.mode = 'preview';
      deviceZip.file('app.json', JSON.stringify(appJson));

      const updatedDeviceBuffer = await deviceZip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });
      zpkZip.file('device.zip', updatedDeviceBuffer);
    }
  }

  // 2. Patch app-side.zip if present
  const appSideZipFile = zpkZip.file('app-side.zip');
  if (appSideZipFile) {
    const appSideZipBuffer = await appSideZipFile.async('nodebuffer');
    const appSideZip = await JSZip.loadAsync(appSideZipBuffer);
    const appJsonFile = appSideZip.file('app.json');
    if (appJsonFile) {
      const appJsonStr = await appJsonFile.async('string');
      const appJson = JSON.parse(appJsonStr);
      if (!appJson.packageInfo) appJson.packageInfo = {};
      appJson.packageInfo.mode = 'preview';
      appSideZip.file('app.json', JSON.stringify(appJson));

      const updatedAppSideBuffer = await appSideZip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });
      zpkZip.file('app-side.zip', updatedAppSideBuffer);
    }
  }

  return await zpkZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });
}

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  console.log('⚡ Compiling Zepp OS package with Zeus CLI...');
  try {
    execSync('npx zeus build', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.error('Zeus build failed:', err.message);
    process.exit(1);
  }

  // Find newly generated .zab in dist/
  const zabFiles = fs.readdirSync(distDir)
    .filter(f => f.endsWith('.zab') && f !== 'zepphello.zab')
    .map(f => ({ name: f, time: fs.statSync(path.join(distDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  if (zabFiles.length === 0) {
    console.error('No .zab bundle found in dist/');
    process.exit(1);
  }

  const latestZabPath = path.join(distDir, zabFiles[0].name);
  console.log(`📦 Found compiled bundle: ${zabFiles[0].name}`);

  // Load and patch all .zpk files inside the .zab to mode: "preview"
  console.log('🔧 Patching packageInfo.mode = "preview" for Zepp App Developer Mode...');
  const zabBuffer = fs.readFileSync(latestZabPath);
  const zabZip = await JSZip.loadAsync(zabBuffer);

  let primaryZpkBuffer = null;

  for (const [filename, fileObj] of Object.entries(zabZip.files)) {
    if (filename.endsWith('.zpk') && !fileObj.dir) {
      const originalZpkBuffer = await fileObj.async('nodebuffer');
      const patchedZpkBuffer = await patchZpk(originalZpkBuffer);
      zabZip.file(filename, patchedZpkBuffer);
      if (!primaryZpkBuffer) {
        primaryZpkBuffer = patchedZpkBuffer;
      }
    }
  }

  const updatedZabBuffer = await zabZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  // Write updated packages
  fs.writeFileSync(path.join(distDir, 'zepphello.zab'), updatedZabBuffer);
  fs.writeFileSync(path.join(publicDir, 'zepphello.zab'), updatedZabBuffer);
  console.log('✅ Generated preview-mode zepphello.zab in dist/ and public/');

  if (primaryZpkBuffer) {
    fs.writeFileSync(path.join(distDir, 'zepphello.zpk'), primaryZpkBuffer);
    fs.writeFileSync(path.join(publicDir, 'zepphello.zpk'), primaryZpkBuffer);
    console.log('✅ Generated preview-mode zepphello.zpk in dist/ and public/');
  }

  console.log('🎉 Zepp OS packages are fully compiled and configured for Developer Mode preview!');
}

main().catch(err => {
  console.error('Build package script error:', err);
  process.exit(1);
});
