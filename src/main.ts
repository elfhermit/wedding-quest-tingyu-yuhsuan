import './style.css';
import scriptData from './data/script.json';
import { createTransparentSprite } from './utils';
import { playTypingSound, playVictorySound } from './audio';
import confetti from 'canvas-confetti';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game-container" id="game-container">
    <div class="flash-effect" id="flash-effect"></div>
    <div class="characters-layer">
      <img id="char-left" class="character inactive" src="" style="display: none;" />
      <img id="char-right" class="character inactive" src="" style="display: none;" />
    </div>
    <div class="dialogue-wrapper" id="dialogue-box" style="display: none;">
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
const charRight = document.getElementById('char-right') as HTMLImageElement;
const dialogueBox = document.getElementById('dialogue-box')!;
const speakerName = document.getElementById('speaker-name')!;
const dialogueText = document.getElementById('dialogue-text')!;
const continuePrompt = document.getElementById('continue-prompt')!;
const startScreen = document.getElementById('start-screen')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;

const BASE_URL = import.meta.env.BASE_URL;
const BG_SUNSET = BASE_URL + 'assets/sunset_beach_pixel_bg.png';
const BG_CHURCH = BASE_URL + 'assets/wedding_church_bg_1773119380226.png';
const SPRITE_PRESIDENT = BASE_URL + 'assets/sprite_senior_m_1773120018866.png'; // President (Math Magician)
const SPRITE_SENIOR = BASE_URL + 'assets/sprite_senior_f_1773120035109.png'; // Senior (Education Healer)

let currentLineIndex = 0;
let isTyping = false;
let typeInterval: ReturnType<typeof setInterval> | null = null;
let currentFullText = '';
let transPresident: string;
let transSenior: string;

async function init() {
  startBtn.disabled = true;
  try {
    transPresident = await createTransparentSprite(SPRITE_PRESIDENT);
    transSenior = await createTransparentSprite(SPRITE_SENIOR);

    charLeft.src = transPresident;
    charRight.src = transSenior;

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
  setTimeout(callback, 400); // Trigger mid-flash
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

  const line = scriptData[currentLineIndex];

  // Transition logic: Wedding server login
  if (line.text.includes("名為『婚姻』的全新伺服器")) {
    triggerFlash(() => {
      gameContainer.style.backgroundImage = `url('${BG_CHURCH}')`;
      playVictorySound();
    });
  }

  speakerName.textContent = line.speaker;
  currentFullText = line.text;

  // Sprite highlighting logic
  charLeft.style.display = 'block';
  charRight.style.display = 'block';

  if (line.speaker === '社長') {
    charLeft.className = 'character active';
    charRight.className = 'character inactive';
  } else if (line.speaker === '學姐') {
    charLeft.className = 'character inactive';
    charRight.className = 'character active';
  } else {
    charLeft.className = 'character inactive';
    charRight.className = 'character inactive';
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
  }, 50); // Slightly faster for modernization
}

function finishTyping() {
  if (typeInterval) clearInterval(typeInterval);
  isTyping = false;
  dialogueText.textContent = currentFullText;
  continuePrompt.style.display = 'flex';
}

// Click anywhere on wrapper to advance
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

