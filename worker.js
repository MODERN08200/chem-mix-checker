/**
 * worker.js — 국내 화학물질 Open API 중계 프록시 (KOSHA MSDS + 한국환경공단 화학물질정보)
 *
 * 왜 필요한가
 * -----------
 * 아래 두 API 모두 브라우저(GitHub Pages 등 다른 도메인)에서 직접 호출할 수 없습니다.
 *   1) data.go.kr에서 신청해 받은 개인 serviceKey가 있어야 하고,
 *   2) CORS를 지원하지 않으며,
 *   3) serviceKey를 사이트 코드에 그대로 넣으면 누구나 볼 수 있어 위험합니다.
 * 이 Worker가 서버 쪽에서 serviceKey를 안전하게 보관한 채 대신 호출하고,
 * 결과를 간단한 JSON으로 바꿔서 CORS 헤더와 함께 돌려줍니다.
 *
 * 지원하는 출처(source)
 * ----------------------
 * - kosha  : 안전보건공단 MSDS (http://msds.kosha.or.kr/openapi/service/msdschem/chemlist)
 * - kreach : 한국환경공단 화학물질 정보 조회 서비스 (kreach.mcee.go.kr 화학물질정보처리시스템의 데이터 출처)
 *            ⚠️ 이 API는 data.go.kr 검색 결과에 정확한 요청 URL(Endpoint)이 나오지 않습니다.
 *            data.go.kr에서 "한국환경공단_화학물질 정보 조회 서비스"를 신청해 승인받은 뒤,
 *            마이페이지 > 활용신청 현황 > 상세보기에서 보이는 정확한 요청 URL을
 *            아래 KREACH_BASE_URL 시크릿에 넣어주세요. (요청 파라미터 이름은 이미 맞춰 놨습니다.)
 *
 * 배포 방법 (무료)
 * -----------------
 * 1. https://dash.cloudflare.com 에서 무료 계정을 만듭니다.
 * 2. Workers & Pages → Create → Worker 를 선택하고 아무 이름이나 지어줍니다. (예: chem-mix-proxy)
 * 3. 편집기에 이 파일 내용을 그대로 붙여넣고 Deploy를 누릅니다.
 * 4. Settings → Variables and Secrets 에서 아래 시크릿을 추가합니다.
 *      - KOSHA_SERVICE_KEY   : KOSHA MSDS API 인증키 (kosha 기능을 쓸 경우 필수)
 *      - KREACH_SERVICE_KEY  : 한국환경공단 화학물질정보 API 인증키 (kreach 기능을 쓸 경우 필수)
 *      - KREACH_BASE_URL     : 위 API의 정확한 요청 URL (data.go.kr 승인 후 확인, kreach 기능을 쓸 경우 필수)
 *    필요한 기능의 키만 넣으면 되고, 나머지는 비워두면 그 기능만 꺼집니다.
 * 5. 배포된 주소(예: https://chem-mix-proxy.내계정.workers.dev)를
 *    script.js 맨 위 KOSHA_PROXY_URL / KREACH_PROXY_URL 에 붙여넣습니다.
 *
 * 사용 예
 * --------
 * GET {워커주소}?source=kosha&q=벤젠&cnd=0
 *   cnd : 검색구분 (0=국문명, 1=CAS No, 2=UN No, 3=KE No, 4=EN No / 기본값 0)
 * GET {워커주소}?source=kreach&q=71-43-2
 */

const KOSHA_BASE_URL = "http://msds.kosha.or.kr/openapi/service/msdschem/chemlist";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return withCORS(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const source = url.searchParams.get("source") || "kosha";
    const q = url.searchParams.get("q");

    if (!q) {
      return withCORS(jsonResponse({ error: "q 파라미터(검색어)가 필요합니다." }, 400));
    }

    if (source === "kosha") return withCORS(await handleKosha(q, url, env));
    if (source === "kreach") return withCORS(await handleKreach(q, env));

    return withCORS(jsonResponse({ error: `알 수 없는 source: ${source} (kosha 또는 kreach만 지원)` }, 400));
  }
};

/* ---------------- KOSHA MSDS ---------------- */
async function handleKosha(searchWrd, url, env) {
  if (!env.KOSHA_SERVICE_KEY) {
    return jsonResponse({ error: "서버에 KOSHA_SERVICE_KEY 시크릿이 설정되어 있지 않습니다." }, 500);
  }
  const searchCnd = url.searchParams.get("cnd") || "0";
  const apiUrl = `${KOSHA_BASE_URL}?serviceKey=${env.KOSHA_SERVICE_KEY}` +
    `&searchWrd=${encodeURIComponent(searchWrd)}` +
    `&searchCnd=${encodeURIComponent(searchCnd)}` +
    `&numOfRows=5&pageNo=1`;

  try {
    const upstream = await fetch(apiUrl);
    const xml = await upstream.text();
    if (!upstream.ok) {
      return jsonResponse({ error: "KOSHA API 호출에 실패했습니다.", status: upstream.status }, 502);
    }
    const items = parseXmlItems(xml, ["casNo", "chemId", "chemNameKor", "enNo", "keNo", "unNO"]);
    return jsonResponse({ source: "kosha", items });
  } catch (err) {
    return jsonResponse({ error: "KOSHA 프록시 처리 중 오류: " + err.message }, 500);
  }
}

/* ---------------- 한국환경공단 화학물질 정보 (K-REACH) ---------------- */
async function handleKreach(searchNm, env) {
  if (!env.KREACH_SERVICE_KEY) {
    return jsonResponse({ error: "서버에 KREACH_SERVICE_KEY 시크릿이 설정되어 있지 않습니다." }, 500);
  }
  if (!env.KREACH_BASE_URL) {
    return jsonResponse({ error: "서버에 KREACH_BASE_URL 시크릿이 설정되어 있지 않습니다. data.go.kr 승인 후 확인한 요청 URL을 넣어주세요." }, 500);
  }

  const apiUrl = `${env.KREACH_BASE_URL}?ServiceKey=${env.KREACH_SERVICE_KEY}` +
    `&search_nm=${encodeURIComponent(searchNm)}` +
    `&numOfRows=5&pageNo=1&resultType=JSON`;

  try {
    const upstream = await fetch(apiUrl);
    const text = await upstream.text();
    if (!upstream.ok) {
      return jsonResponse({ error: "K-REACH(한국환경공단) API 호출에 실패했습니다.", status: upstream.status }, 502);
    }

    let items = [];
    try {
      // resultType=JSON을 요청했지만, 기관에 따라 XML로 응답하는 경우가 있어 둘 다 대비합니다.
      const data = JSON.parse(text);
      const rawItems = data?.response?.body?.items?.item;
      items = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
    } catch (e) {
      items = parseXmlItems(text, ["mttrid", "casno", "keno", "mttrnmkor", "mttrnmeng", "molecform", "mass", "mttrclassty"]);
    }

    return jsonResponse({ source: "kreach", items });
  } catch (err) {
    return jsonResponse({ error: "K-REACH 프록시 처리 중 오류: " + err.message }, 500);
  }
}

// 일부 데이터.go.kr API는 XML로만 응답하는 경우가 있어, <item>...</item> 반복 구조를
// 별도 파서 없이 정규식으로 훑어 필요한 필드만 뽑아냅니다.
function parseXmlItems(xml, fields) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return blocks.map(block => {
    const obj = {};
    fields.forEach(tag => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
      obj[tag] = m ? m[1].trim() : "";
    });
    return obj;
  });
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function withCORS(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
