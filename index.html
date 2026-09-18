/**
 * worker.js — KOSHA(안전보건공단) MSDS Open API 중계 프록시
 *
 * 왜 필요한가
 * -----------
 * KOSHA MSDS Open API(http://msds.kosha.or.kr/openapi/service/msdschem/chemlist)는
 *   1) data.go.kr에서 신청해 받은 개인 serviceKey가 있어야 하고,
 *   2) 브라우저에서 다른 도메인(GitHub Pages 등)으로 직접 호출하면 CORS에 막히며,
 *   3) 응답이 XML이라 브라우저에서 바로 다루기 불편합니다.
 * 이 Worker가 서버 쪽에서 serviceKey를 안전하게 보관한 채 대신 호출하고,
 * 결과를 간단한 JSON으로 바꿔서 CORS 헤더와 함께 돌려줍니다.
 *
 * 배포 방법 (무료)
 * -----------------
 * 1. https://dash.cloudflare.com 에서 무료 계정을 만듭니다.
 * 2. Workers & Pages → Create → Worker 를 선택하고 아무 이름이나 지어줍니다.
 *    (예: chem-mix-proxy)
 * 3. 편집기에 이 파일 내용을 그대로 붙여넣고 Deploy를 누릅니다.
 * 4. Settings → Variables and Secrets 에서 이름 KOSHA_SERVICE_KEY, 값은
 *    data.go.kr에서 발급받은 인증키(디코딩된 값)로 Secret을 하나 추가합니다.
 * 5. 배포된 주소(예: https://chem-mix-proxy.내계정.workers.dev)를
 *    script.js 맨 위 KOSHA_PROXY_URL 에 붙여넣습니다.
 *
 * 사용 예: GET {워커주소}?q=벤젠&cnd=0
 *   q   : 검색어 (필수)
 *   cnd : 검색구분 (0=국문명, 1=CAS No, 2=UN No, 3=KE No, 4=EN No / 기본값 0)
 */

const KOSHA_BASE_URL = "http://msds.kosha.or.kr/openapi/service/msdschem/chemlist";

export default {
  async fetch(request, env) {
    // 브라우저의 사전 확인(OPTIONS) 요청 처리
    if (request.method === "OPTIONS") {
      return withCORS(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const searchWrd = url.searchParams.get("q");
    const searchCnd = url.searchParams.get("cnd") || "0";

    if (!searchWrd) {
      return withCORS(jsonResponse({ error: "q 파라미터(검색어)가 필요합니다." }, 400));
    }
    if (!env.KOSHA_SERVICE_KEY) {
      return withCORS(jsonResponse({ error: "서버에 KOSHA_SERVICE_KEY 시크릿이 설정되어 있지 않습니다." }, 500));
    }

    const apiUrl = `${KOSHA_BASE_URL}?serviceKey=${env.KOSHA_SERVICE_KEY}` +
      `&searchWrd=${encodeURIComponent(searchWrd)}` +
      `&searchCnd=${encodeURIComponent(searchCnd)}` +
      `&numOfRows=5&pageNo=1`;

    try {
      const upstream = await fetch(apiUrl);
      const xml = await upstream.text();

      if (!upstream.ok) {
        return withCORS(jsonResponse({ error: "KOSHA API 호출에 실패했습니다.", status: upstream.status }, 502));
      }

      const items = parseItems(xml);
      return withCORS(jsonResponse({ items }));
    } catch (err) {
      return withCORS(jsonResponse({ error: "프록시 처리 중 오류가 발생했습니다: " + err.message }, 500));
    }
  }
};

// KOSHA 응답 XML은 <item>...</item>이 반복되는 단순한 구조라
// 별도 XML 파서 없이 정규식으로 필요한 필드만 뽑아냅니다.
function parseItems(xml) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return blocks.map(block => {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : "";
    };
    return {
      casNo: pick("casNo"),
      chemId: pick("chemId"),
      chemNameKor: pick("chemNameKor"),
      enNo: pick("enNo"),
      keNo: pick("keNo"),
      unNo: pick("unNO")
    };
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
