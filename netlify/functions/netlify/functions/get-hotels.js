// サイト側(index.html)がページ読み込み時に呼び出す窓口。
// 保存済みの最新データ(価格・評価・代表写真など)をJSON形式で返す。

const { getStore } = require("@netlify/blobs");

exports.handler = async function () {
  try {
    const store = getStore("hotel-data");
    const data = await store.get("latest", { type: "json" });

    if (!data) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ updatedAt: null, hotels: {} }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
