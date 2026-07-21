// 毎日1回、楽天トラベルAPIから全24軒の最新情報（価格・評価・代表写真）を取得し、
// Netlify Blobs（サイト専用の保存領域）に保存しておくプログラム。
// スケジュール実行の設定は netlify.toml 側で行う。

const { getStore } = require("@netlify/blobs");

function getHotelStore() {
  return getStore({
    name: "hotel-data",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

// サイトに掲載している全ホテルの「内部ID」と「楽天のホテル番号(hotelNo)」の対応表
const HOTEL_MAP = [
  ["ryukyu-nashiro", 183412],
  ["uza-terrace", 176665],
  ["shigira-alamanda", 56662],
  ["mifuneyama-rakuen", 13417],
  ["ond-hotel", 188195],
  ["ureshino-kotan", 197359],
  ["enowa-yufuin", 187963],
  ["hoshinoya-kyoto", 172992],
  ["glamday-yomitan", 172439],
  ["ando-hotel-nara", 8045],
  ["kitakobushi-shiretoko", 8312],
  ["chalet-ivy-jozankei", 176809],
  ["lakeview-toya", 139962],
  ["kaho-koshinosato", 136986],
  ["inatorisou", 30928],
  ["izusan-karaku", 197470],
  ["hiramatsu-karuizawa", 181982],
  ["mikaharaonsen-shoho", 38930],
  ["fufu-nara", 179808],
  ["amahara", 75314],
  ["ento-oki", 18535],
  ["senomoto-kogen", 37963],
  ["kanigoten", 53097],
  ["risonare-kohama", 178403],
];

const SITE_URL = "https://sparkling-bunny-d12e12.netlify.app/";

async function fetchOneHotel(appId, accessKey, hotelNo) {
  const url =
    "https://openapi.rakuten.co.jp/engine/api/Travel/SimpleHotelSearch/20170426" +
    `?format=json&applicationId=${encodeURIComponent(appId)}&hotelNo=${hotelNo}`;

  const res = await fetch(url, {
    headers: {
      accessKey: accessKey,
      Referer: SITE_URL,
      Origin: SITE_URL.replace(/\/$/, ""),
    },
  });

  if (!res.ok) {
    return { error: `status ${res.status}` };
  }

  const data = await res.json();
  const info = data?.hotels?.[0]?.hotel?.[0]?.hotelBasicInfo;
  if (!info) return { error: "no hotelBasicInfo" };

  return {
    price: info.hotelMinCharge ?? null,
    rating: info.reviewAverage ?? null,
    reviewCount: info.reviewCount ?? null,
    hero: info.hotelImageUrl || null,
    access: info.access || null,
    address: `${info.address1 || ""}${info.address2 || ""}`,
    tel: info.telephoneNo || null,
    updatedAt: new Date().toISOString(),
  };
}

exports.handler = async function () {
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!appId || !accessKey) {
    return { statusCode: 500, body: "環境変数が未設定です" };
  }

  const store = getHotelStore();
  const result = {};
  const errors = [];

  // 楽天側への負荷を抑えるため、1件ずつ順番に・少し間隔をあけて取得する
  for (const [id, hotelNo] of HOTEL_MAP) {
    try {
      const info = await fetchOneHotel(appId, accessKey, hotelNo);
      result[id] = info;
      if (info.error) errors.push(`${id}: ${info.error}`);
    } catch (err) {
      errors.push(`${id}: ${String(err)}`);
      result[id] = { error: String(err) };
    }
    // 連続アクセスを避けるための小休止（登録したQPS制限「1秒に1回」に合わせて1.2秒）
    await new Promise((r) => setTimeout(r, 1200));
  }

  await store.setJSON("latest", {
    updatedAt: new Date().toISOString(),
    hotels: result,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "同期完了",
        count: Object.keys(result).length,
        errors,
      },
      null,
      2
    ),
  };
};
