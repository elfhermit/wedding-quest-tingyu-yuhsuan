import './style.css';
import scriptData from './data/script.json';
import { playTypingSound, playVictorySound, playBGM, stopBGM } from './audio';
import confetti from 'canvas-confetti';

// --- DOM 元素獲取 ---
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
const loadingFill = document.getElementById('loading-fill')!;
const loadingText = document.getElementById('loading-text')!;
const propContainer = document.getElementById('prop-container')!;
const propIcon = document.getElementById('prop-icon') as HTMLImageElement;
const petalsContainer = document.getElementById('petals-container')!;
const statusBar = document.getElementById('status-bar')!;
const memoryFill = document.getElementById('memory-fill')!;
const logBtn = document.getElementById('log-btn')!;
const logOverlay = document.getElementById('log-overlay')!;
const logContent = document.getElementById('log-content')!;
const closeLogBtn = document.getElementById('close-log')!;
const memoryView = document.getElementById('memory-view')!;
const memoryImg = document.getElementById('memory-img') as HTMLImageElement;

// 結局相關元件
const endScreen = document.getElementById('end-screen')!;
const endChar = document.getElementById('end-char') as HTMLImageElement;
const shareBtn = document.getElementById('share-btn')!;
const restartBtn = document.getElementById('restart-btn')!;

// --- 資源路徑設定 ---
const BASE_URL = import.meta.env.BASE_URL || './';
const BG_SUNSET = BASE_URL + 'assets/bg_memory_1773305969266.png';
const BG_CHURCH = BASE_URL + 'assets/bg_wedding_1773305997077.png';
const BG_GUILD = BASE_URL + 'assets/bg_guild_house_new.png';

const SPRITE_PRESIDENT = BASE_URL + 'assets/wizard_president_1773305885231.png';
const SPRITE_SENIOR    = BASE_URL + 'assets/priest_senior_1773305906885.png';
const SPRITE_JUNIOR_CLUB    = BASE_URL + 'assets/junior_club_1773305925790.png';
const SPRITE_JUNIOR_WEDDING = BASE_URL + 'assets/junior_wedding_1773305949043.png';

// --- 遊戲狀態變數 ---
let currentLineIndex = 0;
let isTyping = false;
let typeInterval: any = null;
let currentFullText = '';
let isWeddingScene = false;
let petalInterval: any = null;
const dialogueHistory: { speaker: string; text: string }[] = [];

// --- 初始化與載入邏輯 ---
async function init() {
  const loadingMessages = [
    '正在對齊時空座標...',
    '提取社團活動記憶...',
    '載入學長姊的祝福 Buff...',
    '準備婚禮專屬特效...',
    '一切就緒！'
  ];

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    
    loadingFill.style.width = `${progress}%`;
    const msgIdx = Math.min(Math.floor((progress / 100) * loadingMessages.length), loadingMessages.length - 1);
    loadingText.textContent = loadingMessages[msgIdx];

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('loading-container')!.style.display = 'none';
        startBtn.style.display = 'block';
        startBtn.classList.add('fade-in');
      }, 500);
    }
  }, 200);

  charLeft.src   = SPRITE_PRESIDENT;
  charCenter.src = SPRITE_JUNIOR_CLUB;
  charRight.src  = SPRITE_SENIOR;
}

// --- 輔助函數 ---
function updateMemoryBar() {
  const percent = (currentLineIndex / (scriptData.length - 1)) * 100;
  memoryFill.style.width = `${percent}%`;
}

function updateCharacterFocus(speaker: string) {
  [charLeft, charCenter, charRight].forEach(c => {
    c.style.display = 'block';
    c.classList.remove('active');
    c.classList.add('inactive');
  });

  if (speaker === '學長') {
    charLeft.classList.remove('inactive');
    charLeft.classList.add('active');
  } else if (speaker === '學姊') {
    charRight.classList.remove('inactive');
    charRight.classList.add('active');
  } else if (speaker === '系統') {
    charCenter.classList.remove('inactive');
    charCenter.classList.add('active');
  }
}

function updateEmotion(speaker: string, emotion: string) {
  const allEmotions = ['emo-surprised', 'emo-smile', 'emo-excited'];
  [charLeft, charCenter, charRight].forEach(c => c.classList.remove(...allEmotions));

  if (!emotion) return;

  let targetChar: HTMLImageElement | null = null;
  if (speaker === '學長') targetChar = charLeft;
  else if (speaker === '學姊') targetChar = charRight;
  else if (speaker === '系統') targetChar = charCenter;

  if (targetChar) {
    const emotionMap: Record<string, string> = {
      'surprised': 'emo-surprised',
      'smile': 'emo-smile',
      'happy': 'emo-smile',
      'excited': 'emo-excited',
      'celebration': 'emo-excited'
    };
    const cssClass = emotionMap[emotion] || 'emo-smile';
    targetChar.classList.add(cssClass);
  }
}

function handleSceneTransition(line: any) {
  const updateBackground = (newBg: string) => {
    gameContainer.classList.add('fade-out');
    setTimeout(() => {
      gameContainer.style.backgroundImage = `url('${newBg}')`;
      gameContainer.classList.remove('fade-out');
      gameContainer.classList.add('fade-in');
      setTimeout(() => gameContainer.classList.remove('fade-in'), 500);
    }, 500);
  };

  if (line.background === 'wedding' && !isWeddingScene) {
    isWeddingScene = true;
    startPetals();
    triggerFlash(() => {
      gameContainer.style.backgroundImage = `url('${BG_CHURCH}')`;
      playVictorySound();
      charCenter.classList.add('junior-glow');
      charCenter.src = SPRITE_JUNIOR_WEDDING;
    });
  } else if (line.background === 'guild_house' && !gameContainer.style.backgroundImage.includes('bg_guild')) {
    updateBackground(BG_GUILD);
  }

  // 回憶大圖處理 (Phase 4)
  if (line.memoryPhoto) {
    showMemoryPhoto(BASE_URL + 'assets/' + line.memoryPhoto);
  } else {
    memoryView.style.display = 'none';
  }
}

function showMemoryPhoto(src: string) {
  memoryImg.src = src;
  memoryView.style.display = 'flex';
  memoryView.onclick = () => {
    memoryView.style.display = 'none';
  };
}

function handlePropDisplay(iconName: string) {
  if (iconName) {
    propContainer.style.display = 'block';
    propIcon.classList.remove('prop-bounce');
    void propIcon.offsetWidth;
    propIcon.src = BASE_URL + 'assets/' + iconName;
    propIcon.classList.add('prop-bounce');
  } else {
    propContainer.style.display = 'none';
  }
}

function triggerFlash(callback: () => void) {
  flashEffect.classList.remove('flash-active');
  void flashEffect.offsetWidth;
  flashEffect.classList.add('flash-active');
  setTimeout(callback, 400);
}

function nextLine() {
  if (currentLineIndex >= scriptData.length) {
    showEnding();
    return;
  }

  const line = scriptData[currentLineIndex] as any;
  dialogueHistory.push({ speaker: line.speaker, text: line.text });
  updateMemoryBar();

  if (line.bgm) playBGM(line.bgm);
  handleSceneTransition(line);
  updateEmotion(line.speaker, line.emotion);

  speakerName.textContent = line.speaker;
  currentFullText = line.text;
  updateCharacterFocus(line.speaker);
  handlePropDisplay(line.propIcon);
  startTyping();
  currentLineIndex++;
}

function startTyping() {
  isTyping = true;
  continuePrompt.style.display = 'none';
  dialogueText.textContent = '';
  let charIdx = 0;

  if (typeInterval) clearTimeout(typeInterval);

  const type = () => {
    if (charIdx < currentFullText.length) {
      const char = currentFullText[charIdx];
      dialogueText.textContent += char;
      playTypingSound();
      charIdx++;
      let delay = 50;
      if (['，', '。', '！', '？', '.', ',', '!', '?'].includes(char)) delay = 200;
      typeInterval = setTimeout(type, delay);
    } else {
      finishTyping();
    }
  };
  type();
}

function finishTyping() {
  if (typeInterval) clearTimeout(typeInterval);
  isTyping = false;
  dialogueText.textContent = currentFullText;
  continuePrompt.style.display = 'flex';
}

function showEnding() {
  dialogueBox.style.display = 'none';
  statusBar.style.display = 'none';
  stopBGM();
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors: ['#ffc0cb', '#ffd700', '#ffffff', '#87cefa'] });
  endChar.src = SPRITE_JUNIOR_WEDDING;
  endScreen.style.display = 'flex';
}

function startPetals() {
  if (petalInterval) return;
  petalInterval = setInterval(() => {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + 'vw';
    const size = Math.random() * 10 + 5;
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    petal.style.animationDuration = Math.random() * 3 + 2 + 's';
    petalsContainer.appendChild(petal);
    setTimeout(() => petal.remove(), 5000);
  }, 300);
}

// --- 事件處理 ---
startBtn.addEventListener('click', () => {
  startScreen.classList.add('fade-out');
  setTimeout(() => {
    startScreen.style.display = 'none';
    statusBar.style.display = 'flex';
    dialogueBox.style.display = 'block';
    gameContainer.style.backgroundImage = `url('${BG_SUNSET}')`;
    playBGM('town');
    nextLine();
  }, 500);
});

dialogueBox.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isTyping) finishTyping();
  else nextLine();
});

logBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  logContent.innerHTML = '';
  dialogueHistory.forEach(item => {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.innerHTML = `<div class="log-speaker">${item.speaker}</div><div class="log-text">${item.text}</div>`;
    logContent.appendChild(div);
  });
  logOverlay.style.display = 'flex';
  dialogueBox.style.display = 'none';
  statusBar.style.display = 'none';
  logContent.scrollTop = logContent.scrollHeight;
});

closeLogBtn.addEventListener('click', () => {
  logOverlay.style.display = 'none';
  dialogueBox.style.display = 'block';
  statusBar.style.display = 'flex';
});

shareBtn.addEventListener('click', async () => {
  const shareData = { title: '來自學長姊的婚禮祝福', text: '✨ 庭宇 ❤ 禹媗，新婚快樂！點擊觀看這份充滿回憶的 Wedding Quest。', url: window.location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(window.location.href);
      alert('已複製連結到剪貼簿！');
    }
  } catch (err) { console.log('Share failed:', err); }
});

restartBtn.addEventListener('click', () => window.location.reload());

init();
