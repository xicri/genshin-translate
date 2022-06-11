/* global NODE_ENV, MINHON_API_KEY, MINHON_API_SECRET, MINHON_LOGIN_ID */

import { Router } from "itty-router";

const login = async () => {
  const params = new URLSearchParams();

  params.append("grant_type", "client_credentials");
  params.append("client_id", MINHON_API_KEY);
  params.append("client_secret", MINHON_API_SECRET);
  params.append("urlAccessToken", "https://mt-auto-minhon-mlt.ucri.jgn-x.jp/oauth2/token.php");

  try {
    const res = await fetch("https://mt-auto-minhon-mlt.ucri.jgn-x.jp/oauth2/token.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (400 <= res.status) {
      throw new Error(`HTTP Status ${res.status} / response:\n${JSON.stringify(await res.json(), null, 2)}`);
    }

    const json = await res.json();
    const accessToken = json.access_token;

    if (!accessToken) {
      console.log(json);
    }

    return accessToken;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const translate = async ({ sourceText, sourceLang, accessToken }) => {
  let apiParam;

  if (NODE_ENV === "production") {
    apiParam = sourceLang === "ja" ? "c-1688_ja_en" : "c-1689_en_ja";
  } else {
    apiParam = sourceLang === "ja" ? "c-1685_ja_en" : "c-1687_en_ja";
  }

  const params = new URLSearchParams();

  params.append("type", "json");
  params.append("access_token", accessToken);
  params.append("key", MINHON_API_KEY);
  params.append("name", MINHON_LOGIN_ID);
  params.append("api_name", "mt");
  params.append("api_param", apiParam);
  params.append("text", sourceText);
  params.append("history", 2); // 文脈利用翻訳で前2文を利用

  const res = await fetch("https://mt-auto-minhon-mlt.ucri.jgn-x.jp/api/", {
    method: "POST",
    body: params,
  });

  const { resultset } = await res.json();

  if (resultset.code === 0) {
    return resultset.result.text;
  } else {
    throw new Error(`Failed to upload MinHon glossary. (code: ${resultset.code})` + "\n" + JSON.stringify(resultset, null, 2));
  }
};

const router = Router();

let accessControlAllowOrigin;

if (NODE_ENV === "production") {
  accessControlAllowOrigin = "https://translate.genshin-dictionary.com";
} else if (NODE_ENV === "preview") {
  accessControlAllowOrigin = "*";
} else if (NODE_ENV === "development") {
  accessControlAllowOrigin = "*";
} else {
  throw new Error(`Unexpected NODE_ENV: ${NODE_ENV}`);
}

router.post("/translate", async request => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response("400 Bad Request", { status: 400 });
  }

  const { sourceText, sourceLang } = await request.json();

  const accessToken = await login();
  const translation = await translate({
    sourceText,
    sourceLang,
    accessToken,
  });


  return new Response(
    JSON.stringify({
      translation,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": accessControlAllowOrigin,
      },
    }
  );
});

router.options("*", () => new Response(null, {
  status: 204,
  headers: {
    "Access-Control-Allow-Origin": accessControlAllowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": 86400,
  },
}));


router.all("*", () => new Response("404 Not Found", { status: 404 }));

addEventListener("fetch", (event) => {
  event.respondWith(router.handle(event.request));
});
