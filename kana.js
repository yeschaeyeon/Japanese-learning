/* 히라가나(reading) → 한글 발음 자동 변환 + 검색용 한글 정규화
 * - reading 안의 "^は" 는 조사 は(와), "^へ" 는 조사 へ(에)라는 표시예요. 화면에는 ^ 가 안 보여요.
 * - 장음은 "-" 로 표시해요. (예: ありがとう → 아리가토-)
 */
(function (root) {
  const SINGLE = {
    あ:'아',い:'이',う:'우',え:'에',お:'오',
    か:'카',き:'키',く:'쿠',け:'케',こ:'코',
    が:'가',ぎ:'기',ぐ:'구',げ:'게',ご:'고',
    さ:'사',し:'시',す:'스',せ:'세',そ:'소',
    ざ:'자',じ:'지',ず:'즈',ぜ:'제',ぞ:'조',
    た:'타',ち:'치',つ:'츠',て:'테',と:'토',
    だ:'다',ぢ:'지',づ:'즈',で:'데',ど:'도',
    な:'나',に:'니',ぬ:'누',ね:'네',の:'노',
    は:'하',ひ:'히',ふ:'후',へ:'헤',ほ:'호',
    ば:'바',び:'비',ぶ:'부',べ:'베',ぼ:'보',
    ぱ:'파',ぴ:'피',ぷ:'푸',ぺ:'페',ぽ:'포',
    ま:'마',み:'미',む:'무',め:'메',も:'모',
    や:'야',ゆ:'유',よ:'요',
    ら:'라',り:'리',る:'루',れ:'레',ろ:'로',
    わ:'와',を:'오',
    ぁ:'아',ぃ:'이',ぅ:'우',ぇ:'에',ぉ:'오'
  };
  const COMBO = {
    きゃ:'캬',きゅ:'큐',きょ:'쿄',ぎゃ:'갸',ぎゅ:'규',ぎょ:'교',
    しゃ:'샤',しゅ:'슈',しょ:'쇼',しぇ:'셰',じゃ:'자',じゅ:'주',じょ:'조',じぇ:'제',
    ちゃ:'차',ちゅ:'추',ちょ:'초',ちぇ:'체',
    にゃ:'냐',にゅ:'뉴',にょ:'뇨',ひゃ:'햐',ひゅ:'휴',ひょ:'효',
    びゃ:'뱌',びゅ:'뷰',びょ:'뵤',ぴゃ:'퍄',ぴゅ:'퓨',ぴょ:'표',
    みゃ:'먀',みゅ:'뮤',みょ:'묘',りゃ:'랴',りゅ:'류',りょ:'료',
    てぃ:'티',でぃ:'디',とぅ:'투',どぅ:'두',
    ふぁ:'파',ふぃ:'피',ふぇ:'페',ふぉ:'포',
    うぃ:'위',うぇ:'웨',うぉ:'워',つぁ:'차'
  };
  const ROWS = {
    a:'あかさたなはまやらわがざだばぱぁゃ',
    i:'いきしちにひみりぎじぢびぴぃ',
    u:'うくすつぬふむゆるぐずづぶぷぅゅ',
    e:'えけせてねへめれげぜでべぺぇ',
    o:'おこそとのほもよろをごぞどぼぽぉょ'
  };
  const VOWEL = {};
  for (const v in ROWS) for (const ch of ROWS[v]) VOWEL[ch] = v;
  const LONG_AFTER = { a:'あ', i:'い', u:'う', e:'いえ', o:'うお' };
  const PUNCT = { '、':',', '。':'.', '？':'?', '！':'!', '，':',', '．':'.' };

  function toHira(s) {
    return String(s || '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  }
  function addBatchim(syl, t) {
    const c = syl.charCodeAt(0);
    if (c < 0xAC00 || c > 0xD7A3) return syl + '';
    if ((c - 0xAC00) % 28 !== 0) return syl; // 이미 받침 있음
    return String.fromCharCode(c + t);
  }
  const T_N = 4, T_G = 1, T_S = 19, T_B = 17;

  function kanaToHangul(reading) {
    const s = toHira(reading);
    const out = [];
    let prevV = null;      // 직전 글자의 모음 (장음 판단용)
    let i = 0;
    const isK = ch => 'かきくけこ'.includes(ch);
    const isP = ch => 'ぱぴぷぺぽ'.includes(ch);
    while (i < s.length) {
      let ch = s[i];
      const two = s.slice(i, i + 2);
      if (ch === '^') {              // 조사 표시
        const nx = s[i + 1];
        if (nx === 'は') { out.push('와'); prevV = null; i += 2; continue; }
        if (nx === 'へ') { out.push('에'); prevV = null; i += 2; continue; }
        i++; continue;
      }
      if (PUNCT[ch]) { out.push(PUNCT[ch]); prevV = null; i++; continue; }
      if (ch === 'ー' || ch === '-') { out.push('-'); i++; continue; }
      if (ch === 'ん') {
        const last = out[out.length - 1];
        if (last && last !== '-' && /[가-힣]/.test(last)) out[out.length - 1] = addBatchim(last, T_N);
        else out.push('응');
        prevV = null; i++; continue;
      }
      if (ch === 'っ') {
        const nx = s[i + 1] || '';
        const t = isK(nx) ? T_G : isP(nx) ? T_B : T_S;
        const last = out[out.length - 1];
        if (last && /[가-힣]/.test(last)) out[out.length - 1] = addBatchim(last, t);
        prevV = null; i++; continue;
      }
      if (COMBO[two]) {
        out.push(COMBO[two]);
        prevV = VOWEL[two[1]] || null;
        i += 2; continue;
      }
      if (SINGLE[ch]) {
        // 장음: 같은 모음 줄 뒤에 오는 う/い/お 등
        // 예외: ている / でいる / ています 처럼 て·で 뒤의 い는 장음이 아니에요
        const prevCh = s[i - 1], nextCh = s[i + 1] || '';
        const teIru = ch === 'い' && (prevCh === 'て' || prevCh === 'で') && 'るまなたてらくすけ'.includes(nextCh) && nextCh !== '';
        // 예외: ~にいく(行く) / ~がある 처럼 조사 뒤에 이어지는 い·あ는 장음이 아니에요
        const niIku = ch === 'い' && prevCh === 'に' && nextCh !== '' && 'くきかこけっ'.includes(nextCh);
        const aNotLong = ch === 'あ' && prevV === 'a' && nextCh !== '' && nextCh !== 'さ' && !' 、。！？,.!?'.includes(nextCh);
        if (!teIru && !niIku && !aNotLong && prevV && LONG_AFTER[prevV] && LONG_AFTER[prevV].includes(ch) && 'あいうえお'.includes(ch)) {
          out.push('-'); prevV = null; i++; continue;
        }
        out.push(SINGLE[ch]);
        prevV = VOWEL[ch] || null;
        i++; continue;
      }
      // 한글/영문/숫자/공백 등은 그대로
      out.push(ch);
      prevV = null;
      i++;
    }
    return out.join('');
  }

  /* ---- 검색용 정규화 ---- */
  const INIT_FOLD = { 'ㅋ':'ㄱ','ㄲ':'ㄱ','ㅌ':'ㄷ','ㄸ':'ㄷ','ㅍ':'ㅂ','ㅃ':'ㅂ','ㅊ':'ㅈ','ㅉ':'ㅈ','ㅆ':'ㅅ' };
  const INIT = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const VOW_FOLD = { 1:5, 3:5 }; // ㅐ(1)→ㅔ(5), ㅒ(3)→ㅖ? 간단히 ㅐ→ㅔ
  function foldHangul(s) {
    let r = '';
    for (const ch of String(s)) {
      const c = ch.charCodeAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) {
        const idx = c - 0xAC00;
        let L = Math.floor(idx / 588), V = Math.floor((idx % 588) / 28), T = idx % 28;
        const f = INIT_FOLD[INIT[L]];
        if (f) L = INIT.indexOf(f);
        if (V === 1) V = 5;           // ㅐ → ㅔ
        r += String.fromCharCode(0xAC00 + (L * 21 + V) * 28 + T);
      } else r += ch;
    }
    return r;
  }
  function normKey(s) {
    return foldHangul(toHira(String(s).toLowerCase()))
      .replace(/[\s~〜～\-ー・、。,.?？!！\^'"“”()（）]/g, '');
  }

  const api = { kanaToHangul, normKey, toHira, foldHangul, cleanReading: s => String(s || '').replace(/\^/g, '') };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
