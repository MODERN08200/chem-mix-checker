/* ==========================================================
   혼합주의 (Chemical Mix Checker)
   데이터: PubChem PUG REST / PUG View API
   ChemSpider는 API 키가 필요해 정적 사이트에서 직접 호출하지 않고
   검색 결과로 연결되는 외부 링크만 제공합니다.
   ========================================================== */

const PUG_REST = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUG_VIEW = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";

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
  return str.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
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

  const ghsCodes = await fetchGHSCodes(cid);

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
    ghsCodes
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

/* ---------------- 위험 조합 매칭 ---------------- */
function normalize(str){
  return (str || "").toLowerCase().replace(/\s+/g, "");
}

function matchReaction(nameA, nameB, compoundA, compoundB){
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
function renderCompoundCard(compound){
  const ghsItems = compound.ghsCodes.length
    ? compound.ghsCodes.map(code => {
        const label = H_CODE_KO[code] || "(한국어 참고 번역 없음 · PubChem에서 원문 확인 필요)";
        return `<li class="${hazardTier(code)}"><span class="h-code">${code}</span>${escapeHTML(label)}</li>`;
      }).join("")
    : `<li class="hazard-empty" style="border-left-color: var(--text-faint);">PubChem에 등록된 GHS 유해성 분류가 없습니다.</li>`;

  return {
    card: `
      <div class="compound-card">
        <img src="${compound.imageUrl}" alt="${escapeHTML(compound.inputName)} 화학 구조" loading="lazy">
        <p class="compound-name">${escapeHTML(compound.inputName)}</p>
        <p class="compound-iupac">${escapeHTML(compound.iupac)}</p>
        <div class="compound-meta">
          <span>분자식 <b>${escapeHTML(compound.formula)}</b></span>
          <span>분자량 <b>${escapeHTML(String(compound.weight))} g/mol</b></span>
          <span>CID <b>${compound.cid}</b></span>
        </div>
        <div class="compound-links">
          <a href="${compound.pubchemUrl}" target="_blank" rel="noopener">PubChem에서 보기</a>
          <a href="${compound.chemspiderUrl}" target="_blank" rel="noopener">ChemSpider에서 검색</a>
        </div>
      </div>`,
    hazardList: ghsItems
  };
}

function renderVerdict(entry, nameA, nameB){
  if (entry){
    const severityLabel = entry.severity === "danger" ? "위험 · 알려진 위험 조합" : "주의 · 알려진 주의 조합";
    return `
      <div class="verdict-badge">${severityLabel}</div>
      <h2>${escapeHTML(entry.title)}</h2>
      <p>${escapeHTML(entry.summary)}</p>
      <p>${escapeHTML(entry.detail)}</p>
      <p class="advice">권장 조치 — ${escapeHTML(entry.advice)}</p>
    `;
  }
  return `
    <div class="verdict-badge">알려진 사례 없음</div>
    <h2>이 조합에 대해 알려진 위험 사례를 찾지 못했습니다</h2>
    <p>"${escapeHTML(nameA)}"와(과) "${escapeHTML(nameB)}"의 조합은 자체 데이터베이스에 등록된 위험 사례가 아닙니다. 다만 이는 <strong>안전하다는 뜻이 아닙니다</strong> — 두 물질을 실제로 섞었을 때 어떤 반응이 일어날지 예측해 주는 공개 데이터베이스는 존재하지 않습니다.</p>
    <p class="advice">아래 각 물질의 개별 GHS 유해성 정보를 참고하고, 실제로 혼합해야 한다면 물질안전보건자료(MSDS)를 확인하거나 화학 안전 전문가에게 문의하세요.</p>
  `;
}

function verdictClass(entry){
  if (!entry) return "unknown";
  return entry.severity === "danger" ? "danger" : "caution";
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
  els.loadingText.textContent = `PubChem에서 "${nameA}" · "${nameB}" 정보를 가져오는 중…`;

  try{
    const [compoundA, compoundB] = await Promise.all([
      lookupCompound(nameA),
      lookupCompound(nameB)
    ]);

    const entry = matchReaction(nameA, nameB, compoundA, compoundB);

    const { card: cardA, hazardList: hazardA } = renderCompoundCard(compoundA);
    const { card: cardB, hazardList: hazardB } = renderCompoundCard(compoundB);

    els.compoundPair.innerHTML = `${cardA}<div class="pair-plus">+</div>${cardB}`;

    els.verdict.className = `verdict ${verdictClass(entry)}`;
    els.verdict.innerHTML = renderVerdict(entry, nameA, nameB);

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
