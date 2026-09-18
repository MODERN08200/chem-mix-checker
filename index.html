/* ==========================================================
   혼합주의 (Chemical Mix Checker)

   데이터 출처
   - PubChem PUG REST / PUG View API : 이름 검색, 구조, GHS 분류 (직접 호출, CORS 지원)
   - ChemSpider : API 키가 있어야 하고 CORS도 지원하지 않아, 검색 페이지로 연결되는
     외부 링크만 제공합니다.
   - 안전보건공단(KOSHA) MSDS Open API : data.go.kr에서 개인 인증키를 신청해야 하고
     역시 브라우저에서 직접 호출하면 CORS에 막힙니다. 그래서 인증키를 안전하게 보관하는
     작은 중계 서버(Cloudflare Worker, worker.js 참고)를 거쳐서 불러옵니다.
     PROXY_URL을 비워두면 이 기능은 자동으로 꺼지고 사이트의 나머지 기능은 그대로 동작합니다.
   ========================================================== */

const PUG_REST = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUG_VIEW = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";

// worker.js를 배포한 뒤 그 주소를 여기에 넣으세요. 예: "https://chem-mix-proxy.내계정.workers.dev"
// 비워두면 KOSHA MSDS 조회 없이 나머지 기능(PubChem 조회, 위험 조합 판정)은 그대로 작동합니다.
const KOSHA_PROXY_URL = "";

/* ----------------------------------------------------------
   GHS H-코드 → 한국어 유해·위험문구 (참고용 표준 번역)
   실제 사용/보관 시에는 반드시 제품 MSDS의 정식 문구를 확인하세요.
   ---------------------------------------------------------- */
const H_CODE_KO = {
  H200: "폭발성 물질; 불안정한 폭발물",
  H201: "폭발성 물질; 대량폭발 위험",
  H220: "극도로 인화성이 강한 가스",
  H221: "인화성 가스",
  H222: "극도로 인화성이 강한 에어로졸",
  H225: "고도로 인화성이 있는 액체 및 증기",
  H226: "인화성 액체 및 증기",
  H228: "인화성 고체",
  H240: "가열하면 폭발할 수 있음",
  H241: "가열하면 화재나 폭발을 일으킬 수 있음",
  H242: "가열하면 화재를 일으킬 수 있음",
  H270: "화재를 일으킬 수 있음(강산화제)",
  H271: "화재나 폭발을 일으킬 수 있음(강산화제)",
  H272: "화재를 강렬하게 함(산화제)",
  H280: "고압가스 포함; 열에 의해 폭발할 수 있음",
  H290: "금속을 부식시킬 수 있음",
  H300: "삼키면 치명적임",
  H301: "삼키면 유독함",
  H302: "삼키면 유해함",
  H304: "삼켜서 기도로 유입되면 치명적일 수 있음",
  H310: "피부와 접촉하면 치명적임",
  H311: "피부와 접촉하면 유독함",
  H312: "피부와 접촉하면 유해함",
  H314: "피부에 심한 화상과 눈 손상을 일으킴",
  H315: "피부에 자극을 일으킴",
  H317: "알레르기성 피부 반응을 일으킬 수 있음",
  H318: "눈에 심한 손상을 일으킴",
  H319: "눈에 심한 자극을 일으킴",
  H330: "흡입하면 치명적임",
  H331: "흡입하면 유독함",
  H332: "흡입하면 유해함",
  H334: "흡입 시 알레르기성 반응, 천식 또는 호흡 곤란을 일으킬 수 있음",
  H335: "호흡기 자극을 일으킬 수 있음",
  H336: "졸음 또는 현기증을 일으킬 수 있음",
  H340: "유전적인 결함을 일으킬 수 있음",
  H341: "유전적인 결함을 일으킬 것으로 의심됨",
  H350: "암을 일으킬 수 있음",
  H351: "암을 일으킬 것으로 의심됨",
  H360: "생식능력 또는 태아에 손상을 일으킬 수 있음",
  H361: "생식능력 또는 태아에 손상을 일으킬 것으로 의심됨",
  H370: "장기에 손상을 일으킴",
  H371: "장기에 손상을 일으킬 수 있음",
  H372: "장기간 또는 반복 노출로 장기에 손상을 일으킴",
  H373: "장기간 또는 반복 노출로 장기에 손상을 일으킬 수 있음",
  H400: "수생생물에 매우 유독함",
  H410: "장기간 영향에 의해 수생생물에 매우 유독함",
  H411: "장기간 영향에 의해 수생생물에 유독함",
  H412: "장기간 영향에 의해 수생생물에 유해함",
  H413: "장기간 영향에 의해 수생생물에 유해할 수 있음"
};

function hazardTier(code){
  const n = parseInt(code.slice(1), 10);
  if (n >= 200 && n < 300) return "h2"; // 물리적 위험(화재/폭발)
  if (n >= 300 && n < 400) return "h3"; // 건강 유해성
  return "h4"; // 환경 유해성 등
}

/* ----------------------------------------------------------
   일반 화학물질군 분류 (특정 이름 조합이 아니어도 적용됨)
   PubChem GHS H-코드에서 자동으로 뽑아내는 분류 + 자주 문제되는
   몇 가지 계열(산/염기/차아염소산염/암모니아/시안화물/황화물/물반응성)을
   이름 키워드로 보조 인식합니다.
   ---------------------------------------------------------- */
const TAG_LABELS = {
  oxidizer: "산화제",
  flammable: "인화성·가연성",
  explosive: "폭발성·불안정",
  corrosive: "부식성",
  toxic_gas: "흡입 독성",
  acid: "산",
  base: "염기",
  hypochlorite: "차아염소산염(표백제)",
  ammonia_amine: "암모니아·아민",
  alcohol: "알코올",
  cyanide: "시안화물",
  sulfide: "황화물",
  water_reactive: "물반응성 금속"
};

const GHS_TAG_MAP = [
  { codes: ["H270", "H271", "H272"], tag: "oxidizer" },
  { codes: ["H220", "H221", "H222", "H225", "H226", "H228"], tag: "flammable" },
  { codes: ["H200", "H201", "H240", "H241", "H242"], tag: "explosive" },
  { codes: ["H314"], tag: "corrosive" },
  { codes: ["H330", "H331", "H332"], tag: "toxic_gas" }
];

// 이름/IUPAC명 안에 아래 키워드가 있으면 해당 계열로 보조 분류합니다.
// (GHS 분류만으로는 산/염기/차아염소산염 등을 구분할 수 없어 추가한 목록으로,
//  세상의 모든 산·염기를 담고 있지는 않습니다.)
const KEYWORD_TAG_MAP = [
  { tag: "hypochlorite", keywords: ["차아염소산나트륨", "락스", "표백제", "차아염소산칼슘", "sodiumhypochlorite", "bleach", "calciumhypochlorite"] },
  { tag: "ammonia_amine", keywords: ["암모니아", "암모늄", "수산화암모늄", "ammonia", "ammoniumhydroxide"] },
  { tag: "alcohol", keywords: ["에탄올", "메탄올", "이소프로필알코올", "알코올", "ethanol", "methanol", "isopropylalcohol", "alcohol"] },
  { tag: "cyanide", keywords: ["시안화나트륨", "시안화칼륨", "시안화", "cyanide"] },
  { tag: "sulfide", keywords: ["황화나트륨", "황화수소나트륨", "황화", "sulfide"] },
  { tag: "water_reactive", keywords: ["금속나트륨", "금속칼륨", "나트륨금속", "칼륨금속", "탄화칼슘", "금속리튬", "sodiummetal", "potassiummetal", "calciumcarbide", "lithiummetal"] },
  { tag: "acid", keywords: ["황산", "염산", "질산", "인산", "아세트산", "초산", "불산", "불화수소산", "구연산", "옥살산", "sulfuricacid", "hydrochloricacid", "nitricacid", "phosphoricacid", "aceticacid", "hydrofluoricacid"] },
  { tag: "base", keywords: ["수산화나트륨", "가성소다", "수산화칼륨", "수산화칼슘", "소석회", "sodiumhydroxide", "potassiumhydroxide", "calciumhydroxide", "lye"] }
];

// 일반적으로 널리 알려진 화학물질군 간 비호환 규칙 (표준 화학 안전교육/MSDS 수준의 상식)
const GENERAL_RULES = [
  { a: "oxidizer", b: "flammable", severity: "danger", title: "화재·폭발 위험(산화제 + 인화성 물질)", detail: "산화제는 인화성·가연성 물질과 함께 있으면 화재나 폭발이 일어나기 훨씬 쉬워집니다. 산화제가 연소를 돕는 산소를 공급하기 때문입니다.", advice: "두 계열의 물질은 같은 공간에 함께 보관하거나 섞지 마세요." },
  { a: "hypochlorite", b: "acid", severity: "danger", title: "염소 가스 발생 위험(차아염소산염 + 산)", detail: "차아염소산염(락스 등)이 산과 만나면 유독한 염소 가스가 발생할 수 있습니다.", advice: "표백제류를 산성 세정제나 식초 등과 절대 섞지 마세요." },
  { a: "hypochlorite", b: "ammonia_amine", severity: "danger", title: "클로라민 가스 발생 위험(차아염소산염 + 암모니아)", detail: "차아염소산염과 암모니아(암모니아 성분 세정제 포함)가 만나면 독성이 강한 클로라민 가스가 발생합니다.", advice: "락스류와 암모니아 성분 세정제를 함께 사용하지 마세요." },
  { a: "hypochlorite", b: "alcohol", severity: "danger", title: "유해 부산물 생성 위험(차아염소산염 + 알코올)", detail: "차아염소산염이 알코올과 반응하면 클로로폼 등 자극성·독성 화합물이 만들어질 수 있습니다.", advice: "소독용 알코올과 표백제 계열 세정제를 같은 용기에 섞지 마세요." },
  { a: "cyanide", b: "acid", severity: "danger", title: "시안화수소(HCN) 독성가스 위험(시안화물 + 산)", detail: "시안화물이 산과 만나면 매우 독성이 강한 시안화수소 가스가 발생할 수 있습니다. 극소량 흡입으로도 치명적일 수 있습니다.", advice: "시안화물 계열 물질은 산성 물질과 절대 접촉시키지 말고, 전문가의 지도 아래에서만 취급하세요." },
  { a: "sulfide", b: "acid", severity: "danger", title: "황화수소(H2S) 독성가스 위험(황화물 + 산)", detail: "황화물이 산과 만나면 독성이 강하고 악취가 나는 황화수소 가스가 발생할 수 있습니다.", advice: "황화물 계열 물질은 산성 물질과 접촉시키지 마세요." },
  { a: "water_reactive", b: "water", severity: "danger", title: "격렬한 반응 위험(물반응성 금속 + 물)", detail: "나트륨, 칼륨과 같은 물반응성 금속은 물과 만나면 격렬하게 반응하며 수소 가스와 큰 열을 발생시켜 화재나 폭발로 이어질 수 있습니다.", advice: "물반응성 금속을 물이나 습기와 접촉시키지 마세요." },
  { a: "acid", b: "base", severity: "caution", title: "중화 반응 및 급격한 발열(산 + 염기)", detail: "강산과 강염기를 섞으면 중화 반응이 일어나며 짧은 시간에 많은 열이 발생해 끓어 넘치거나 튈 수 있습니다.", advice: "소량씩 저어가며 다루고, 내산·내알칼리 보호구를 착용하세요." },
  { a: "oxidizer", b: "corrosive", severity: "caution", title: "반응성 증가 가능(산화제 + 부식성 물질)", detail: "산화제와 부식성 물질을 함께 두면 서로의 반응성이 높아져 예상치 못한 반응이 일어날 수 있습니다.", advice: "따로 보관하고, 함께 다뤄야 한다면 소량으로 시험 후 진행하세요." }
];

function normalize(str){
  return (str || "").toLowerCase().replace(/\s+/g, "");
}

function classifyCompound(compound){
  const tags = new Set();
  const codes = compound.ghsCodes || [];
  GHS_TAG_MAP.forEach(({ codes: mapCodes, tag }) => {
    if (mapCodes.some(c => codes.includes(c))) tags.add(tag);
  });

  const nameNorm = normalize(compound.inputName);
  const iupacNorm = normalize(compound.iupac);
  KEYWORD_TAG_MAP.forEach(({ tag, keywords }) => {
    const hit = keywords.some(k => {
      const kn = normalize(k);
      return nameNorm.includes(kn) || iupacNorm.includes(kn);
    });
    if (hit) tags.add(tag);
  });

  // 물 자체는 별도 태그로 표시 (물반응성 금속 규칙에 사용)
  if (["물", "water"].includes(nameNorm) || ["물", "water"].includes(iupacNorm)) tags.add("water");

  return Array.from(tags);
}

function matchGeneralRules(tagsA, tagsB){
  const matches = [];
  GENERAL_RULES.forEach(rule => {
    const hit1 = tagsA.includes(rule.a) && tagsB.includes(rule.b);
    const hit2 = tagsA.includes(rule.b) && tagsB.includes(rule.a);
    if (hit1 || hit2) matches.push(rule);
  });
  return matches;
}

/* ---------------------------------------------------------- */

let reactionDB = [];
fetch("data/reactions.json").then(r => r.json()).then(data => { reactionDB = data; }).catch(() => { reactionDB = []; });

const els = {
  form: document.getElementById("mixerForm"),
  chemA: document.getElementById("chemA"),
  chemB: document.getElementById("chemB"),
  suggestA: document.getElementById("suggestA"),
  suggestB: document.getElementById("suggestB"),
  results: document.getElementById("results"),
  compoundPair: document.getElementById("compoundPair"),
  verdict: document.getElementById("verdict"),
  individualHazards: document.getElementById("individualHazards"),
  loading: document.getElementById("loadingState"),
  loadingText: document.getElementById("loadingText"),
  error: document.getElementById("errorState"),
  errorText: document.getElementById("errorText"),
  analyzeBtn: document.getElementById("analyzeBtn"),
};

/* ---------------- 자동완성 ---------------- */
function setupAutocomplete(input, list){
  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2){ list.hidden = true; list.innerHTML = ""; return; }
    debounceTimer = setTimeout(() => fetchSuggestions(q, list, input), 300);
  });
  input.addEventListener("blur", () => setTimeout(() => { list.hidden = true; }, 150));
}

async function fetchSuggestions(query, list, input){
  try{
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/json?limit=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("autocomplete failed");
    const data = await res.json();
    const names = (data && data.dictionary_terms && data.dictionary_terms.compound) || [];
    if (!names.length){ list.hidden = true; return; }
    list.innerHTML = names.map(n => `<li>${escapeHTML(n)}</li>`).join("");
    list.hidden = false;
    Array.from(list.children).forEach(li => {
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = li.textContent;
        list.hidden = true;
      });
    });
  }catch(e){
    list.hidden = true;
  }
}
setupAutocomplete(els.chemA, els.suggestA);
setupAutocomplete(els.chemB, els.suggestB);

function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ---------------- PubChem 조회 ---------------- */
async function lookupCompound(name){
  const cidRes = await fetch(`${PUG_REST}/compound/name/${encodeURIComponent(name)}/cids/JSON`);
  if (!cidRes.ok) throw new Error(`"${name}"을(를) PubChem에서 찾을 수 없습니다.`);
  const cidData = await cidRes.json();
  const cid = cidData.IdentifierList && cidData.IdentifierList.CID && cidData.IdentifierList.CID[0];
  if (!cid) throw new Error(`"${name}"에 대한 화합물 정보를 찾을 수 없습니다.`);

  const propRes = await fetch(`${PUG_REST}/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`);
  const propData = await propRes.json();
  const props = (propData.PropertyTable && propData.PropertyTable.Properties && propData.PropertyTable.Properties[0]) || {};

  const [ghsCodes, kosha] = await Promise.all([
    fetchGHSCodes(cid),
    fetchKoshaInfo(name)
  ]);

  return {
    inputName: name,
    cid,
    iupac: props.IUPACName || "",
    formula: props.MolecularFormula || "",
    weight: props.MolecularWeight || "",
    smiles: props.CanonicalSMILES || "",
    imageUrl: `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&width=300&height=300`,
    pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
    chemspiderUrl: `https://www.chemspider.com/Search.aspx?q=${encodeURIComponent(name)}`,
    koshaSearchUrl: `https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchAll.do`,
    ghsCodes,
    kosha
  };
}

async function fetchGHSCodes(cid){
  try{
    const res = await fetch(`${PUG_VIEW}/data/compound/${cid}/JSON?heading=GHS+Classification`);
    if (!res.ok) return [];
    const data = await res.json();
    const strings = [];
    collectStrings(data, strings);
    const codes = new Set();
    strings.forEach(s => {
      const matches = s.match(/H\d{3}/g);
      if (matches) matches.forEach(m => codes.add(m));
    });
    return Array.from(codes).sort();
  }catch(e){
    return [];
  }
}

// PUG View의 중첩된 Section/Information 트리를 재귀적으로 훑어 문자열을 모두 수집
function collectStrings(node, out){
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)){ node.forEach(n => collectStrings(n, out)); return; }
  if (typeof node.String === "string") out.push(node.String);
  Object.keys(node).forEach(key => {
    if (key === "String") return;
    collectStrings(node[key], out);
  });
}

/* ---------------- KOSHA MSDS 조회 (프록시 경유) ----------------
   worker.js로 배포한 중계 서버를 통해 안전보건공단 Open API를 호출합니다.
   KOSHA_PROXY_URL이 비어 있으면 호출하지 않고 조용히 null을 반환합니다. */
async function fetchKoshaInfo(name){
  if (!KOSHA_PROXY_URL) return null;
  try{
    const res = await fetch(`${KOSHA_PROXY_URL}?q=${encodeURIComponent(name)}&cnd=0`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items && data.items[0];
    return item || null;
  }catch(e){
    return null;
  }
}

/* ---------------- 위험 조합 매칭 ---------------- */
function matchSpecificReaction(nameA, nameB, compoundA, compoundB){
  const candidatesA = [nameA, compoundA.iupac].map(normalize);
  const candidatesB = [nameB, compoundB.iupac].map(normalize);

  for (const entry of reactionDB){
    const aliasesA = entry.aliasesA.map(normalize);
    const aliasesB = entry.aliasesB.map(normalize);

    const aHitsA = candidatesA.some(c => aliasesA.includes(c));
    const bHitsB = candidatesB.some(c => aliasesB.includes(c));
    const aHitsB = candidatesA.some(c => aliasesB.includes(c));
    const bHitsA = candidatesB.some(c => aliasesA.includes(c));

    if ((aHitsA && bHitsB) || (aHitsB && bHitsA)) return entry;
  }
  return null;
}

/* ---------------- 렌더링 ---------------- */
function renderTagChips(tags){
  if (!tags.length) return "";
  return `<div class="tag-chips">${tags.map(t => `<span class="tag-chip">${escapeHTML(TAG_LABELS[t] || t)}</span>`).join("")}</div>`;
}

function renderCompoundCard(compound, tags){
  const ghsItems = compound.ghsCodes.length
    ? compound.ghsCodes.map(code => {
        const label = H_CODE_KO[code] || "(한국어 참고 번역 없음 · PubChem에서 원문 확인 필요)";
        return `<li class="${hazardTier(code)}"><span class="h-code">${code}</span>${escapeHTML(label)}</li>`;
      }).join("")
    : `<li class="hazard-empty" style="border-left-color: var(--text-faint);">PubChem에 등록된 GHS 유해성 분류가 없습니다.</li>`;

  const koshaLine = compound.kosha
    ? `<span>KOSHA 국문명 <b>${escapeHTML(compound.kosha.chemNameKor || "-")}</b></span><span>CAS No. <b>${escapeHTML(compound.kosha.casNo || "-")}</b></span>`
    : "";

  return {
    card: `
      <div class="compound-card">
        <img src="${compound.imageUrl}" alt="${escapeHTML(compound.inputName)} 화학 구조" loading="lazy">
        <p class="compound-name">${escapeHTML(compound.inputName)}</p>
        <p class="compound-iupac">${escapeHTML(compound.iupac)}</p>
        ${renderTagChips(tags)}
        <div class="compound-meta">
          <span>분자식 <b>${escapeHTML(compound.formula)}</b></span>
          <span>분자량 <b>${escapeHTML(String(compound.weight))} g/mol</b></span>
          <span>CID <b>${compound.cid}</b></span>
          ${koshaLine}
        </div>
        <div class="compound-links">
          <a href="${compound.pubchemUrl}" target="_blank" rel="noopener">PubChem</a>
          <a href="${compound.chemspiderUrl}" target="_blank" rel="noopener">ChemSpider</a>
          <a href="${compound.koshaSearchUrl}" target="_blank" rel="noopener">KOSHA MSDS</a>
        </div>
      </div>`,
    hazardList: ghsItems
  };
}

function renderVerdict({ specific, general }, nameA, nameB){
  if (specific){
    const severityLabel = specific.severity === "danger" ? "위험 · 확인된 위험 조합" : "주의 · 확인된 주의 조합";
    return {
      html: `
        <div class="verdict-badge">${severityLabel}</div>
        <h2>${escapeHTML(specific.title)}</h2>
        <p>${escapeHTML(specific.summary)}</p>
        <p>${escapeHTML(specific.detail)}</p>
        <p class="advice">권장 조치 — ${escapeHTML(specific.advice)}</p>
      `,
      cls: specific.severity === "danger" ? "danger" : "caution"
    };
  }

  if (general.length){
    const worst = general.some(r => r.severity === "danger") ? "danger" : "caution";
    const badgeLabel = worst === "danger" ? "주의 · 일반 분류 기반 위험 신호" : "주의 · 일반 분류 기반 주의 신호";
    const items = general.map(r => `
      <div class="general-rule-item">
        <h3>${escapeHTML(r.title)}</h3>
        <p>${escapeHTML(r.detail)}</p>
        <p class="advice">권장 조치 — ${escapeHTML(r.advice)}</p>
      </div>
    `).join("");
    return {
      html: `
        <div class="verdict-badge">${badgeLabel}</div>
        <h2>이름으로 등록된 사례는 없지만, 화학물질군 분류상 주의가 필요합니다</h2>
        <p>"${escapeHTML(nameA)}"와(과) "${escapeHTML(nameB)}"는 특정 이름으로 등록된 위험 조합은 아니지만, PubChem의 GHS 분류와 화학물질군 특성을 바탕으로 아래와 같은 일반적인 위험 신호가 감지되었습니다.</p>
        ${items}
        <p class="advice" style="border-top:1px solid rgba(255,255,255,0.08); padding-top:12px;">이는 화학물질군 단위의 일반적 추정이며, 이 두 물질 사이에 실제로 반응이 일어난다는 확정적 근거는 아닙니다. 실제 취급 전 MSDS와 전문가 확인이 필요합니다.</p>
      `,
      cls: worst
    };
  }

  return {
    html: `
      <div class="verdict-badge">알려진 사례 없음</div>
      <h2>이 조합에 대해 알려진 위험 사례를 찾지 못했습니다</h2>
      <p>"${escapeHTML(nameA)}"와(과) "${escapeHTML(nameB)}"의 조합은 등록된 위험 조합 목록에도, 일반 화학물질군 비호환 규칙에도 해당하지 않았습니다. 다만 이는 <strong>안전하다는 뜻이 아닙니다</strong> — 임의의 두 화학물질을 섞었을 때 어떤 반응이 일어날지 완전히 예측해 주는 공개 데이터베이스는 존재하지 않습니다.</p>
      <p class="advice">아래 각 물질의 개별 GHS 유해성 정보를 참고하고, 실제로 혼합해야 한다면 물질안전보건자료(MSDS)를 확인하거나 화학 안전 전문가에게 문의하세요.</p>
    `,
    cls: "unknown"
  };
}

/* ---------------- 메인 흐름 ---------------- */
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nameA = els.chemA.value.trim();
  const nameB = els.chemB.value.trim();
  if (!nameA || !nameB) return;

  els.suggestA.hidden = true;
  els.suggestB.hidden = true;
  els.results.hidden = true;
  els.error.hidden = true;
  els.loading.hidden = false;
  els.analyzeBtn.disabled = true;
  els.loadingText.textContent = `PubChem·KOSHA에서 "${nameA}" · "${nameB}" 정보를 가져오는 중…`;

  try{
    const [compoundA, compoundB] = await Promise.all([
      lookupCompound(nameA),
      lookupCompound(nameB)
    ]);

    const tagsA = classifyCompound(compoundA);
    const tagsB = classifyCompound(compoundB);

    const specific = matchSpecificReaction(nameA, nameB, compoundA, compoundB);
    const general = specific ? [] : matchGeneralRules(tagsA, tagsB);

    const { card: cardA, hazardList: hazardA } = renderCompoundCard(compoundA, tagsA);
    const { card: cardB, hazardList: hazardB } = renderCompoundCard(compoundB, tagsB);

    els.compoundPair.innerHTML = `${cardA}<div class="pair-plus">+</div>${cardB}`;

    const { html: verdictHtml, cls: verdictCls } = renderVerdict({ specific, general }, nameA, nameB);
    els.verdict.className = `verdict ${verdictCls}`;
    els.verdict.innerHTML = verdictHtml;

    els.individualHazards.innerHTML = `
      <div class="hazard-card">
        <h3>${escapeHTML(compoundA.inputName)}의 개별 유해성(GHS)</h3>
        <ul>${hazardA}</ul>
      </div>
      <div class="hazard-card">
        <h3>${escapeHTML(compoundB.inputName)}의 개별 유해성(GHS)</h3>
        <ul>${hazardB}</ul>
      </div>
    `;

    els.loading.hidden = true;
    els.results.hidden = false;
    els.results.scrollIntoView({ behavior: "smooth", block: "start" });

  }catch(err){
    els.loading.hidden = true;
    els.error.hidden = false;
    els.errorText.textContent = err.message || "정보를 가져오는 중 문제가 발생했습니다. 화학물질 이름을 다시 확인해 주세요.";
  }finally{
    els.analyzeBtn.disabled = false;
  }
});
