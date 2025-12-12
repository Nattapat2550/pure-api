import path from "path";
import { env } from "../../config/env";
import { AppError } from "../../core/errors/AppError";

export function getWindowsPath() {
  const p = env.DOWNLOAD_WINDOWS_PATH;
  if (!p) throw new AppError("Windows path not configured", 500, "DOWNLOAD_NOT_CONFIGURED");
  return path.resolve(p);
}

export function getAndroidPath() {
  const p = env.DOWNLOAD_ANDROID_PATH;
  if (!p) throw new AppError("Android path not configured", 500, "DOWNLOAD_NOT_CONFIGURED");
  return path.resolve(p);
}
