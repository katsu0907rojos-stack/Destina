// サイト側(index.html)がページ読み込み時に呼び出す窓口。
// 保存済みの最新データ(価格・評価・代表写真など)をJSON形式で返す。
const { getStore } = require("@netlify/blobs");

// サイト本体はGitHub Pagesの独自ドメインで公開されているため、
// このNetlify Functionを別ドメインから呼び出せるよう許可する。
// ここは実際の独自ドメインに置き換えること（例: "https://destina.com"）。
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://destinahotels.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function getHotelStore() {
  return getStore({
    name: "hotel-data",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

exports.handler = async function (event) {
  // ブラウザがプリフライト(OPTIONS)を送ってきた場合に備えて用意しておく。
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  try {
    const store = getHotelStore();
    const data = await store.get("latest", { type: "json" });
    if (!data) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...CORS_HEADERS,
        },
        body: JSON.stringify({ updatedAt: null, hotels: {} }),
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        ...CORS_HEADERS,
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
