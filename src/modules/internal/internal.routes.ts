import { Router } from "express";
import { apiKeyAuth } from "../../core/middleware/apiKeyAuth";
import * as service from "./internal.service";

export const internalRoutes = Router();

// บังคับใช้ API Key ทุก request
internalRoutes.use(apiKeyAuth);

internalRoutes.post("/find-user", async (req, res, next) => {
  try {
    const { email, id, provider, oauthId } = req.body;
    let user = null;
    if (id) user = await service.findUserById(id);
    else if (email) user = await service.findUserByEmail(email);
    else if (provider && oauthId) user = await service.findUserByOAuth(provider, oauthId);
    
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});

internalRoutes.post("/create-user-email", async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await service.createUserByEmail(email);
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});

internalRoutes.post("/store-verification-code", async (req, res, next) => {
  try {
    const { userId, code, expiresAt } = req.body;
    await service.storeVerificationCode(userId, code, expiresAt);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

internalRoutes.post("/verify-code", async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await service.validateAndConsumeCode(email, code);
    res.json(result);
  } catch (e) { next(e); }
});

internalRoutes.post("/set-username-password", async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const user = await service.setUsernameAndPassword(email, username, password);
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});

internalRoutes.post("/set-oauth-user", async (req, res, next) => {
  try {
    const user = await service.setOAuthUser(req.body);
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});

internalRoutes.post("/create-reset-token", async (req, res, next) => {
  try {
    const { email, token, expiresAt } = req.body;
    const user = await service.createPasswordResetToken(email, token, expiresAt);
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});

internalRoutes.post("/consume-reset-token", async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await service.consumePasswordResetToken(token);
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});

internalRoutes.post("/set-password", async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;
    const user = await service.setPassword(userId, newPassword);
    res.json({ ok: true, data: user });
  } catch (e) { next(e); }
});