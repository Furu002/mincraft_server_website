import fs from "node:fs/promises";
import path from "node:path";

export class LinkStore {
  constructor(dataDir) {
    this.filePath = path.join(dataDir, "discord-links.json");
    this.data = {
      linksByDiscordId: {},
      pendingByDiscordId: {},
    };
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.data = {
        linksByDiscordId: parsed.linksByDiscordId && typeof parsed.linksByDiscordId === "object"
          ? parsed.linksByDiscordId
          : {},
        pendingByDiscordId: parsed.pendingByDiscordId && typeof parsed.pendingByDiscordId === "object"
          ? parsed.pendingByDiscordId
          : {},
      };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await this.save();
    }
  }

  async save() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const next = JSON.stringify(this.data, null, 2);
    const tempPath = `${this.filePath}.tmp`;
    await fs.writeFile(tempPath, next, "utf8");
    await fs.rename(tempPath, this.filePath);
  }

  getLink(discordId) {
    return this.data.linksByDiscordId[discordId] || null;
  }

  async setLink(discordId, link) {
    this.data.linksByDiscordId[discordId] = {
      discordId,
      nickname: link.nickname,
      uuid: link.uuid || "",
      webToken: link.webToken,
      verifiedAt: link.verifiedAt || new Date().toISOString(),
      tokenExpiresAt: link.tokenExpiresAt || "",
    };
    delete this.data.pendingByDiscordId[discordId];
    await this.save();
    return this.data.linksByDiscordId[discordId];
  }

  getPending(discordId) {
    return this.data.pendingByDiscordId[discordId] || null;
  }

  async setPending(discordId, pending) {
    this.data.pendingByDiscordId[discordId] = {
      discordId,
      nickname: pending.nickname,
      code: pending.code,
      expiresAt: pending.expiresAt || "",
      requestedAt: new Date().toISOString(),
    };
    await this.save();
    return this.data.pendingByDiscordId[discordId];
  }

  async clearPending(discordId) {
    delete this.data.pendingByDiscordId[discordId];
    await this.save();
  }
}
