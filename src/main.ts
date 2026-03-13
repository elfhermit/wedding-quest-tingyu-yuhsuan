import './style.css';
import scriptData from './data/script.json';
import { playTypingSound, playVictorySound } from './audio';
import confetti from 'canvas-confetti';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game-container" id="game-container">
    <div class="flash-effect" id="flash-effect"></div>
    <div class="characters-layer">
      <img id="char-left" class="character char-left inactive" src="" style="display: none;" />
      <img id="char-center" class="character char-center inactive" src="" style="display: none;" />
      <img id="char-right" class="character char-right inactive" src="" style="display: none;" />
    </div>
    <div class="dialogue-wrapper" id="dialogue-box" style="display: none;">
      <div id="prop-container" class="prop-container" style="display: none;">
        <img id="prop-icon" class="prop-icon" src="" />
      </div>
      <div class="dialogue-box">
        <div class="speaker-name" id="speaker-name"></div>
        <div class="dialogue-text" id="dialogue-text"></div>
        <div class="continue-prompt" id="continue-prompt" style="display: none;">
          (點擊繼續) <div class="heart-icon"></div>
        </div>
      </div>
    </div>
    <div class="start-screen" id="start-screen">
      <h1 style="font-family: var(--font-pixel); color: #ffd700; margin-bottom: 30px; text-shadow: 3px 3px 0 #000;">Wedding Quest</h1>
      <p style="color: white; margin-bottom: 30px; font-family: var(--font-text);">～ 庭宇 ❤ 禹媗的婚禮特輯 ～</p>
      <button class="start-btn" id="start-btn">載入記憶中...</button>
    </div>
  </div>
`;

const gameContainer = document.getElementById('game-container')!;
const flashEffect = document.getElementById('flash-effect')!;
const charLeft = document.getElementById('char-left') as HTMLImageElement;
const charCenter = document.getElementById('char-center') as HTMLImageElement;
const charRight = document.getElementById('char-right') as HTMLImageElement;
const dialogueBox = document.getElementById('dialogue-box')!;
const speakerName = document.getElementById('speaker-name')!;
const dialogueText = document.getElementById('dialogue-text')!;
const continuePrompt = document.getElementById('continue-prompt')!;
const startScreen = document.getElementById('start-screen')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const propContainer = document.getElementById('prop-container')!;
const propIcon = document.getElementById('prop-icon') as HTMLImageElement;

const BASE_URL = import.meta.env.BASE_URL;
const BG_SUNSET = BASE_URL + 'assets/bg_memory_1773305969266.png';
const BG_CHURCH = BASE_URL + 'assets/bg_wedding_1773305997077.png';
const BG_GUILD = BASE_URL + 'assets/bg_guild_house_new.png';

// --- 角色素材路徑 ---
const SPRITE_PRESIDENT = BASE_URL + 'assets/wizard_president_1773305885231.png';   // 學長（左）
const SPRITE_SENIOR    = BASE_URL + 'assets/priest_senior_1773305906885.png';       // 學姊（右）
const SPRITE_JUNIOR_CLUB    = BASE_URL + 'assets/junior_club_1773305925790.png';    // 學妹（社團服、中）
const SPRITE_JUNIOR_WEDDING = BASE_URL + 'assets/junior_wedding_1773305949043.png'; // 學妹（婚紗）

let currentLineIndex = 0;
let isTyping = false;
let typeInterval: ReturnType<typeof setInterval> | null = null;
let currentFullText = '';
let isWeddingScene = false;

async function init() {
  startBtn.disabled = true;
  try {
    charLeft.src   = SPRITE_PRESIDENT;
    charCenter.src = SPRITE_JUNIOR_CLUB;
    charRight.src  = SPRITE_SENIOR;

    startBtn.textContent = '展開回憶';
    startBtn.disabled = false;
  } catch (err) {
    console.error("Asset loading error:", err);
    startBtn.textContent = '載入失敗';
  }
}

startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  dialogueBox.style.display = 'block';
  gameContainer.style.backgroundImage = `url('${BG_SUNSET}')`;
  nextLine();
});

function triggerFlash(callback: () => void) {
  flashEffect.classList.remove('flash-active');
  void flashEffect.offsetWidth;
  flashEffect.classList.add('flash-active');
  setTimeout(callback, 400);
}

function nextLine() {
  if (currentLineIndex >= scriptData.length) {
    dialogueBox.style.display = 'none';
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#ffc0cb', '#ffd700', '#ffffff', '#87cefa']
    });
    return;
  }

  const line = scriptData[currentLineIndex] as any;

  // --- 背景切換邏輯 ---
  if (line.background === 'wedding' && !isWeddingScene) {
    isWeddingScene = true;
    triggerFlash(() => {
      gameContainer.style.backgroundImage = `url('${BG_CHURCH}')`;
      playVictorySound();
      // 學妹換裝為婚紗 ✨
      charCenter.classList.add('junior-glow');
      charCenter.src = SPRITE_JUNIOR_WEDDING;
    });
  } else if (line.background === 'guild_house' && !gameContainer.style.backgroundImage.includes('bg_guild')) {
    triggerFlash(() => {
      gameContainer.style.backgroundImage = `url('${BG_GUILD}')`;
    });
  }

  speakerName.textContent = line.speaker;
  currentFullText = line.text;

  // --- 三角色顯示邏輯 ---
  charLeft.style.display = 'block';
  charCenter.style.display = 'block';
  charRight.style.display = 'block';

  // 重置所有角色為 inactive
  charLeft.className   = 'character char-left inactive';
  charCenter.className = 'character char-center inactive' + (charCenter.classList.contains('junior-glow') ? ' junior-glow' : '');
  charRight.className  = 'character char-right inactive';

  // 依說話者高亮對應角色
  if (line.speaker === '學長') {
    charLeft.className = 'character char-left active';
  } else if (line.speaker === '學姊') {
    charRight.className = 'character char-right active';
  } else if (line.speaker === '系統') {
    // 系統台詞：學妹（主角）置中高亮
    charCenter.className = 'character char-center active' + (isWeddingScene ? ' junior-glow' : '');
  }

  // --- 道具顯示邏輯 ---
  if (line.propIcon) {
    propContainer.style.display = 'block';
    propIcon.classList.remove('prop-bounce');
    void propIcon.offsetWidth;
    propIcon.src = BASE_URL + 'assets/' + line.propIcon;
    propIcon.classList.add('prop-bounce');
  } else {
    propContainer.style.display = 'none';
  }

  startTyping();
  currentLineIndex++;
}

function startTyping() {
  isTyping = true;
  continuePrompt.style.display = 'none';
  dialogueText.textContent = '';
  dialogueText.style.opacity = '1';
  let charIdx = 0;

  if (typeInterval) clearInterval(typeInterval);

  typeInterval = setInterval(() => {
    dialogueText.textContent += currentFullText[charIdx];
    playTypingSound();
    charIdx++;
    if (charIdx >= currentFullText.length) {
      finishTyping();
    }
  }, 50);
}

function finishTyping() {
  if (typeInterval) clearInterval(typeInterval);
  isTyping = false;
  dialogueText.textContent = currentFullText;
  continuePrompt.style.display = 'flex';
}

dialogueBox.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isTyping) {
    finishTyping();
  } else {
    dialogueText.style.opacity = '0';
    setTimeout(() => {
      nextLine();
    }, 200);
  }
});

init();
