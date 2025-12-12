import { Router } from "express";
import * as service from "./download.service";

export const downloadRoutes = Router();

downloadRoutes.get("/windows", (req, res, next) => {
  try {
    const filePath = service.getWindowsPath();
    res.download(filePath, "MyAppSetup.exe");
  } catch (e) {
    next(e);
  }
});

downloadRoutes.get("/android", (req, res, next) => {
  try {
    const filePath = service.getAndroidPath();
    res.download(filePath, "app-release.apk");
  } catch (e) {
    next(e);
  }
});
