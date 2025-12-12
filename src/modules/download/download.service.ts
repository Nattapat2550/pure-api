import fs from 'fs';
import path from 'path';
import { Response } from 'express';

const APP_DIR = path.join(__dirname, '..', '..', 'app');
const WINDOWS_INSTALLER = path.join(APP_DIR, 'MyAppSetup.exe');
const ANDROID_APK = path.join(APP_DIR, 'app-release.apk');

function safeDownload(res: Response, filePath: string, downloadName: string) {
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
    res.download(filePath, downloadName);
  });
}

export function downloadWindows(res: Response) {
  safeDownload(res, WINDOWS_INSTALLER, 'MyAppSetup.exe');
}

export function downloadAndroid(res: Response) {
  safeDownload(res, ANDROID_APK, 'app-release.apk');
}
