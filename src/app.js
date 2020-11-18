import { errorResponse, successResponse } from "./utils/response";
import { error, debug } from "./utils/logger";

async function tgPost(method, data = {}) {
  const url = `https://api.telegram.org/bot${TG_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const json = await response.json();
    await error("telegram", "Telegram API Error", { json });
    throw new Error("Telegram API request failed");
  }

  return await response.json();
}

async function setWebhook(url) {
  const res = await tgPost("setWebhook", {
    url: url,
  });

  await debug("setWebhook", "setWebhook response", {
    url,
    res,
  });

  return res;
}

async function handleControlRequest(request, body) {
  switch (body.method) {
    case "register":
      await debug("control", "register");
      await setWebhook(request.url);
      break;
  }
}

function isCommand(text, command) {
  const cmd = "/" + command;
  return text === cmd || text.startsWith(cmd + " ");
}

function checkRedditLink(text) {
  // match links:
  // https://www.reddit.com/r/battlestations/comments/jwbd8p/minimalist_with_a_pinch_of_steampunk/
  // https://old.reddit.com/r/battlestations/comments/jwbd8p/minimalist_with_a_pinch_of_steampunk/
  // https://reddit.com/r/battlestations/comments/jwbd8p
  // https://redd.it/jwbd8p
  const match = text.match(
    /(reddit\.com|redd\.it)(\/r\/([\w\d\_]+)\/comments|)\/(?<id>[\w\d]+)(.*)/
  );
  if (!match) return null;
  return match.groups.id;
}

async function handleRedditPost(to, postId) {
  const url = `https://www.reddit.com/comments/${postId}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Reddit request failed");
  const json = await response.json();

  const post = json?.[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error("Reddit request returned bad response");

  const postTitle = post.title;
  const postSubreddit = post.subreddit;
  const postAuthor = post.author;
  const postUrl = post.url;
  const postPreview = post?.preview?.images?.[0]?.source?.url.replace(
    /&amp;/,
    "&"
  );
  const isNsfw = post.over_18;

  const text = postTitle;

  await debug("handleRedditLink", "reddit post data", { to, post });

  if (isNsfw) {
    throw new Error("Access denied to NSFW posts through proxy");
  }

  const keys = {
    inline_keyboard: [
      [
        {
          text: "u/" + postAuthor,
          url: "https://reddit.com/u/" + postAuthor,
        },

        {
          text: "r/" + postSubreddit,
          url: "https://reddit.com/r/" + postSubreddit,
        },
      ],
      [
        {
          text: "Comments",
          url: "https://redd.it/" + postId,
        },

        {
          text: "URL",
          url: postUrl,
        },
      ],
    ],
  };

  if (postPreview) {
    await debug("handleRedditLink", "sending photo", {
      to,
      postTitle,
      postSubreddit,
      postAuthor,
      postUrl,
      postPreview,
      keys,
    });

    await tgPost("sendPhoto", {
      chat_id: to,
      caption: text,
      photo: postPreview,
      reply_markup: keys,
    });
  } else {
    await debug("handleRedditLink", "sending text", {
      to,
      postTitle,
      postSubreddit,
      postAuthor,
      postUrl,
      postPreview,
      keys,
    });

    await tgPost("sendMessage", {
      chat_id: to,
      message: text,
      reply_markup: keys,
    });
  }
}

async function handleIncomingMessage(request, body) {
  const message = body.message;
  const { text } = message;
  const { id, first_name: firstName, last_name: lastName } = message.from;

  if (isCommand(text, "start")) {
    await debug("telegram", "Start command", { id, firstName, lastName });
    await sendTextMessage(
      id,
      [
        `Hi, ${firstName}!`,
        `Your ID: ${id}.`,
        `Send me a reddit link or forward me a message with reddit link.`,
      ].join("\n")
    );
    return;
  }

  const postId = checkRedditLink(text);
  if (postId) {
    await handleRedditPost(id, postId).catch(async err => {
      await sendTextMessage(id, `Unable to proxy this link: ${err.message}`);
    });

    return;
  }

  sendTextMessage(
    id,
    `Send me a reddit link or forward me a message with reddit link.`
  );
}

async function sendTextMessage(to, message) {
  return await tgPost("sendMessage", {
    chat_id: to,
    text: message,
  });
}

async function handleRequestBody(request, body) {
  if (body === null) {
    throw new Error("Request body is empty");
  }

  await debug("handleRequestBody", "start", { body });

  if ("method" in body) {
    return await handleControlRequest(request, body);
  }

  if ("message" in body) {
    return await handleIncomingMessage(request, body);
  }
}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const appSecretRequest = url.pathname.split("/")[1] ?? null;
  await debug("handleRequest", "start", { url: request.url, method });
  let body = null;

  // trick to check if constants are defined
  try {
    const tmp = { TG_TOKEN, TG_WEBHOOK_SECRET };
  } catch (_) {
    return await errorResponse(
      "Required environment parameters are not defined"
    );
  }

  if (appSecretRequest !== TG_WEBHOOK_SECRET) {
    return await errorResponse("Unauthorized", 401);
  }

  if (method === "POST") {
    try {
      body = await request.json();
    } catch (e) {
      return await errorResponse("Unable to parse request body", 400);
    }
  }

  try {
    await handleRequestBody(request, body);
    return await successResponse("ok");
  } catch (e) {
    await error("handleRequest", "Unable to parse incoming request", {
      message: e.message,
      exception: e,
    });

    return await errorResponse("Unable to parse incoming request", 400);
  }
}

export { handleRequest };
