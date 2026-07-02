# Discord Bot Bridge

This bot connects Discord slash commands to the existing AuroraLink website and Minecraft API.

## Commands

- `/주식 시장` - public market summary
- `/주식 종목 종목:DMD` - public stock quote with a generated chart image
- `/주식 내계좌` - linked player's stock portfolio
- `/주식 매수 종목:DMD 수량:10` - buy shares with Minecraft server money
- `/주식 매도 종목:DMD 수량:10` - sell shares
- `/주식 지원금` - claim the linked character's daily reward
- `/마크 인증 닉네임:PlayerName` - start Discord-to-Minecraft verification
- `/마크 확인` - finish verification after the player runs `/webauth <code>` in game
- `/마크 상태` - live server status
- `/마크 온라인` - online player list
- `/마크 인벤토리` - linked character inventory summary
- `/마크 공지 내용:...` - send an in-game broadcast, requires Discord Manage Server permission and an admin token
- `/마크 웹` - website links

## Environment

```bash
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
DISCORD_PLAYER_API_BASE=https://api.nfoifsb.kr/minecraft
DISCORD_SITE_URL=https://www.nfoifsb.kr
DISCORD_MINECRAFT_ADDRESS=nfoifsb.kr
DISCORD_MINECRAFT_ADMIN_TOKEN=optional-auroralink-admin-token
DISCORD_BOT_DATA_DIR=discord-bot/data
DISCORD_PUBLIC_ACTION_REPLIES=true
```

`DISCORD_MINECRAFT_ADMIN_TOKEN` is only needed for `/마크 공지`. It must match AuroraLink's `api.admin-token`.

## Register And Run

```bash
npm ci
npm run discord:register
npm run discord:start
```

Guild command registration is used so command changes appear quickly in the configured Discord server.

## Linux Service Example

```ini
[Unit]
Description=NFOIFSB Discord bridge bot
After=network-online.target

[Service]
WorkingDirectory=/home/ad1969/mincraft_server_website
EnvironmentFile=/home/ad1969/discord-bot.env
ExecStart=/usr/bin/npm run discord:start
Restart=always
RestartSec=8
User=ad1969

[Install]
WantedBy=multi-user.target
```

Run `npm run discord:register` once after changing commands, then restart the service.
