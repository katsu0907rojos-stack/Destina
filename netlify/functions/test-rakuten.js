// 楽天トラベルAPIの疎通確認用テスト関数
// アクセス方法: https://[あなたのサイト]/.netlify/functions/test-rakuten

exports.handler = async function (event, context) {
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!appId || !accessKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "環境変数が見つかりません。RAKUTEN_APP_ID と RAKUTEN_ACCESS_KEY が正しく設定されているか確認してください。"
      })
    };
  }

  // サイト自身のURL（Application URLに登録したドメインと一致させる）
  const siteUrl = "https://sparkling-bunny-d12e12.netlify.app/";

  // テスト対象: 琉球ホテル&リゾート 名城ビーチ（hotelNo=183412）
  const apiUrl =
    "https://openapi.rakuten.co.jp/engine/api/Travel/SimpleHotelSearch/20170426" +
    `?format=json&applicationId=${encodeURIComponent(appId)}&hotelNo=183412`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        accessKey: accessKey,
        Referer: siteUrl,
        Origin: siteUrl.replace(/\/$/, "")
      }
    });

    const text = await res.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(
        {
          rakuten_status: res.status,
          rakuten_response: text
        },
        null,
        2
      )
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};
