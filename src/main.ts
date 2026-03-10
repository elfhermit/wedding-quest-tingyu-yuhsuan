import './style.css';
import scriptData from './data/script.json';
import { createTransparentSprite } from './utils';
import { playTypingSound, playVictorySound } from './audio';
import confetti from 'canvas-confetti';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game-container" id="game-container">
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
      <h1 style="font-family: var(--font-family); color: white; margin-bottom: 30px; text-shadow: 2px 2px 0 #000;">庭宇 ❤ 禹媗的婚禮</h1>
      <button class="start-btn" id="start-btn">載入素材中...</button>
    </div>
  </div>
`;

const gameContainer = document.getElementById('game-container')!;
const charLeft = document.getElementById('char-left') as HTMLImageElement;
const charRight = document.getElementById('char-right') as HTMLImageElement;
const dialogueBox = document.getElementById('dialogue-box')!;
const speakerName = document.getElementById('speaker-name')!;
const dialogueText = document.getElementById('dialogue-text')!;
const continuePrompt = document.getElementById('continue-prompt')!;
const startScreen = document.getElementById('start-screen')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;

// Asset paths
const BACKGROUND_CHURCH = '/assets/wedding_church_bg_1773119380226.png';
const BACKGROUND_BANQUET = '/assets/wedding_banquet_bg_1773119396765.png'; // 預留場景切換
const SPRITE_TINGYU = '/assets/sprite_tingyu_1773121325160.png';
const SPRITE_YUHSUAN = '/assets/sprite_yuhsuan_1773121309349.png';

let currentLineIndex = 0;
let isTyping = false;
let typeInterval: ReturnType<typeof setInterval> | null = null;
let currentFullText = '';
let transparentTingyu: string;
let transparentYuhsuan: string;

async function init() {
  startBtn.disabled = true;
  try {
    // Process sprites to remove green background
    transparentTingyu = await createTransparentSprite(SPRITE_TINGYU);
    transparentYuhsuan = await createTransparentSprite(SPRITE_YUHSUAN);

    // Default assignments
    charLeft.src = transparentTingyu;
    charRight.src = transparentYuhsuan;

    startBtn.textContent = '進入回憶';
    startBtn.disabled = false;
  } catch (err) {
    console.error("Asset loading error:", err);
    startBtn.textContent = '載入失敗 (看 Console)';
  }
}

startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  dialogueBox.style.display = 'block';

  // Set initial background
  gameContainer.style.backgroundImage = "url('" + BACKGROUND_CHURCH + "')";

  nextLine();
});

function nextLine() {
  if (currentLineIndex >= scriptData.length) {
    // End of script
    dialogueBox.style.display = 'none';
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#ffc0cb', '#ffd700', '#ffffff', '#87cefa']
    });
    // Can play an extra victory sound here
    return;
  }

  const line = scriptData[currentLineIndex];
  speakerName.textContent = line.speaker + "：";
  currentFullText = line.text;

  // Handle character visibility and active status
  charLeft.style.display = 'block';
  charRight.style.display = 'block';

  // Update character images depending on who is speaking or present
  if (line.speaker === '庭宇') {
    charLeft.className = 'character active';
    charRight.className = 'character inactive';
  } else if (line.speaker === '禹媗') {
    charLeft.className = 'character inactive';
    charRight.className = 'character active';
  } else {
    // 玩家時雙方都顯示為不活躍
    charLeft.className = 'character inactive';
    charRight.className = 'character inactive';
  }

  // Background/Audio cue
  if (line.bgm === 'victory') {
    playVictorySound();
    // 也能在這裡切換到滿滿祝福的宴會廳背景
    gameContainer.style.backgroundImage = "url('" + BACKGROUND_BANQUET + "')";
  }

  startTyping();
  currentLineIndex++;
}

// Typing effect
function startTyping() {
  isTyping = true;
  continuePrompt.style.display = 'none';
  dialogueText.textContent = '';
  let charIdx = 0;

  if (typeInterval) clearInterval(typeInterval);

  typeInterval = setInterval(() => {
    dialogueText.textContent += currentFullText[charIdx];
    playTypingSound();
    charIdx++;

    if (charIdx >= currentFullText.length) {
      finishTyping();
    }
  }, 60);
}

function finishTyping() {
  if (typeInterval) clearInterval(typeInterval);
  isTyping = false;
  dialogueText.textContent = currentFullText;
  continuePrompt.style.display = 'flex';
}

dialogueBox.addEventListener('click', () => {
  if (isTyping) {
    // Skip typing and show full text immediately
    finishTyping();
  } else {
    // Next line
    nextLine();
  }
});

init();
