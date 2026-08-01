/* ============================================================
   i18n.js – English & Sinhala  (v9 – no-DB edition)
   ============================================================ */
'use strict';

const LANG = {
  en: {
    settings:'⚙ Settings', tab_settings:'⚙ Settings', tab_history:'📜 History',
    language:'Language', spin_duration:'Spin Duration (seconds)', logo_size:'Logo Size',
    bg_image:'Background Image', logo_image:'Logo Image',
    drag_drop_img:'Drag & drop or click', drag_drop_logo:'Drag & drop or click', any_image:'any image file',
    draw_sound:'🔊 Drawing Sound', win_sound:'🏆 Winning Sound',
    snd_tick:'Tick (default)', snd_drum:'Drum Roll', snd_click:'Click',
    snd_custom:'Custom File…', snd_none:'None',
    snd_fanfare:'Fanfare (default)', snd_chime:'Chime', snd_trumpet:'Trumpet',
    choose_audio:'Choose Audio', vol:'Vol',
    no_draws_yet:'No draws yet.', clear_history:'Clear History',
    winner_label:'🎉 Winner!', continue:'Continue ▶',
    spin:'Spin', fullscreen:'⛶ Fullscreen', exit_fs:'✕ Exit',
    file_drop:'📂 Select or drag file here', file_hint:'Excel (.xlsx), CSV, Word (.docx), TXT',
    zip_drop:'📦 Drop ZIP here (names + photos)',
    zip_hint:'ZIP must contain: names.csv + photos named after each person',
    clear_photos:'Clear photos', names:'names', shuffle:'🔀 Shuffle',
    footer:'Developed by KLMC',
    toast_shuffled:'✅ Shuffled!',
    toast_uploading:'⏳ Uploading ZIP…',
    toast_upload_ok:'✅ Loaded', toast_names:'names', toast_photos:'photos',
    photos_matched:'photos matched',
    min_names:'Add at least 2 names to spin!',
    group_label:'Group:',
    winner_of:'Winner',
  },
  si: {
    settings:'⚙ සැකසීම්', tab_settings:'⚙ සැකසීම්', tab_history:'📜 ඉතිහාසය',
    language:'භාෂාව', spin_duration:'භ්‍රමණ කාලය (තත්පර)', logo_size:'ලාංඡන ප්‍රමාණය',
    bg_image:'පසුබිම් රූපය', logo_image:'ලාංඡන රූපය',
    drag_drop_img:'ඇදගෙන ලෙවීමෙන් හෝ ක්ලික් කරන්න', drag_drop_logo:'ඇදගෙන ලෙවීමෙන් හෝ ක්ලික් කරන්න',
    any_image:'ඕනෑම රූප ගොනුවක්',
    draw_sound:'🔊 ඇදීමේ ශබ්දය', win_sound:'🏆 ජය ශබ්දය',
    snd_tick:'ටික් (පෙරනිමි)', snd_drum:'බෙර රෝල්', snd_click:'ක්ලික්',
    snd_custom:'අභිමත ගොනුව…', snd_none:'නෑ',
    snd_fanfare:'ෆැන්ෆෙයාර් (පෙරනිමි)', snd_chime:'චයිම්', snd_trumpet:'ට්‍රම්පට්',
    choose_audio:'ශ්‍රව්‍ය ගොනුව', vol:'ශබ්ද',
    no_draws_yet:'තවම ඇදීම් නැත.', clear_history:'ඉතිහාසය මකන්න',
    winner_label:'🎉 ජයග්‍රාහකයා!', continue:'ඉදිරියට ▶',
    spin:'භ්‍රමණය', fullscreen:'⛶ පූර්ණ තිරය', exit_fs:'✕ පිටවන්න',
    file_drop:'📂 ගොනුව ඇදලන්න හෝ තෝරන්න', file_hint:'Excel, CSV, Word, TXT',
    zip_drop:'📦 ZIP ලිපිගොනුව ඇදලන්න', zip_hint:'ZIP: names.csv + ඡායාරූප',
    clear_photos:'ඡායාරූප ඉවත් කරන්න', names:'නම්', shuffle:'🔀 මිශ්‍ර කරන්න',
    footer:'KLMC විසින් සංවර්ධිත',
    toast_shuffled:'✅ මිශ්‍ර කෙරිනි!',
    toast_uploading:'⏳ ZIP උඩුගත කරමින්…',
    toast_upload_ok:'✅ ගෙනා', toast_names:'නම්', toast_photos:'ඡායාරූප',
    photos_matched:'ඡායාරූප ගැළපිනි',
    min_names:'භ්‍රමණය කිරීමට අවම නම් 2ක් අවශ්‍යයි!',
    group_label:'කණ්ඩායම:',
    winner_of:'ජයග්‍රාහකයා',
  }
};

let currentLang = localStorage.getItem('raffleLang') || 'en';

function t(key) {
  return (LANG[currentLang] && LANG[currentLang][key]) || LANG.en[key] || key;
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('raffleLang', lang);
  document.documentElement.setAttribute('data-lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'OPTION') el.textContent = val;
    else el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  const nb = document.getElementById('namesBox');
  if (nb) nb.setAttribute('data-placeholder',
    lang === 'si' ? 'නම් මෙහි ලියන්න, එක් පේළියකට එකක්…' : 'Type names here, one per line…'
  );

  document.body.style.fontFamily = lang === 'si'
    ? "'Noto Sans Sinhala','Crimson Pro',Georgia,serif"
    : "'Crimson Pro',Georgia,serif";

  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.getAttribute('data-lang') === lang)
  );
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')))
  );
  applyLang(currentLang);
});
