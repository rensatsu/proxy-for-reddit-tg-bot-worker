async function warn(prefix, message, data = {}) {
  await sendLog("warning", prefix, message, data);
}

async function error(prefix, message, data = {}) {
  await sendLog("error", prefix, message, data);
}

async function info(prefix, message, data = {}) {
  await sendLog("info", prefix, message, data);
}

async function debug(prefix, message, data = {}) {
  await sendLog("debug", prefix, message, data);
}

async function sendLog(level, prefix, message, data = {}) {
  let cMethod = "log";
  switch (level) {
    case "info":
      cMethod = "info";
      break;
    case "warn":
    case "warning":
      cMethod = "warn";
      break;
    case "err":
    case "error":
      cMethod = "error";
      break;
    default:
      cMethod = "log";
  }

  console[cMethod](`[${prefix}]`, message, data);

  try {
    const tmp = { TIMBER_SOURCE_ID, TIMBER_API_KEY };
  } catch (_) {
    return;
  }

  await fetch(
    `https://logs.timber.io/sources/${TIMBER_SOURCE_ID}/frames`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${TIMBER_API_KEY}`,
      },
      body: JSON.stringify({
        level: level,
        prefix: prefix,
        message: `${prefix}: ${message}`,
        data: data,
      }),
    }
  );
}

export { error, warn, info, debug };
