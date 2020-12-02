# Reddit Proxy Telegram Bot

A simple Telegram bot which receives links to Reddit posts and sends back an information and preview of the post.

> ⚠ Project is no longer supported.

## Worker Environment

### Production
```
wrangler secret put TG_TOKEN --env production
wrangler secret put TG_WEBHOOK_SECRET --env production
wrangler secret put TIMBER_API_KEY --env production
wrangler secret put TIMBER_SOURCE_ID --env production
```

### Development
```
wrangler secret put TG_TOKEN
wrangler secret put TG_WEBHOOK_SECRET
wrangler secret put TIMBER_API_KEY
wrangler secret put TIMBER_SOURCE_ID
```

## Register Webhook
```
curl 'https://reddit-proxy-bot.namespace.workers.dev/TG_WEBHOOK_SECRET/' \
  --data '{"method":"register"}'
```

Replace `TG_WEBHOOK_SECRET` and `reddit-proxy-bot.namespace` with actual values.
