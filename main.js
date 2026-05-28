/* ==========================================
   AD LIMINA: 이단심문관의 등불 - 메인 자바스크립트 오케스트레이터
   ========================================== */

import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. 잿가루 입자 배경 생성기 (DOM)
  initAshBackground();

  // 2. 프리미엄 탭 시스템 제어
  initTabSystem();

  // 3. UI 요소 및 오버레이 바인딩
  const canvas = document.getElementById('gameCanvas');
  const startOverlay = document.getElementById('startOverlay');
  const startGameBtn = document.getElementById('startGameBtn');
  const endingOverlay = document.getElementById('endingOverlay');
  const endingTitle = document.getElementById('endingTitle');
  const endingDescription = document.getElementById('endingDescription');
  const finalFaith = document.getElementById('finalFaith');
  const finalDoubt = document.getElementById('finalDoubt');
  const restartGameBtn = document.getElementById('restartGameBtn');
  const muteBtn = document.getElementById('muteBtn');
  const muteIcon = document.getElementById('muteIcon');
  
  // 게이지 바 관련 DOM
  const faithProgress = document.getElementById('faithProgress');
  const doubtProgress = document.getElementById('doubtProgress');
  const balancePointer = document.getElementById('balancePointer');

  // 4. 게임 인스턴스 변수
  let game = null;

  // 5. 게임 시작 이벤트
  startGameBtn.addEventListener('click', () => {
    // 오버레이 숨김
    startOverlay.classList.add('hidden');
    
    // 게임 엔진 초기화 및 플레이 구동
    initAndStartGame();
  });

  // 6. 게임 재시작 이벤트
  restartGameBtn.addEventListener('click', () => {
    endingOverlay.classList.add('hidden');
    initAndStartGame();
  });

  // 7. 게임 초기화 및 구동 함수
  function initAndStartGame() {
    if (game) {
      game.destroy();
    }
    
    // 신규 게임 생성
    game = new Game(canvas, {
      onStateUpdate: (state) => {
        updateUI(state);
      },
      onEnding: (endingType, faithVal, doubtVal) => {
        showEnding(endingType, faithVal, doubtVal);
      }
    });
    
    game.start();
  }

  // 8. 게이지 UI 업데이트 바인딩
  function updateUI(state) {
    const { faith, doubt } = state;
    
    // 신앙심과 의혹의 상대 비율 연산
    const total = faith + doubt;
    let faithPercent = 50;
    let doubtPercent = 50;
    
    if (total > 0) {
      faithPercent = (faith / total) * 100;
      doubtPercent = (doubt / total) * 100;
    }
    
    // DOM 업데이트
    faithProgress.style.width = `${faithPercent}%`;
    doubtProgress.style.width = `${doubtPercent}%`;
    balancePointer.style.left = `${faithPercent}%`;
  }

  // 9. 엔딩 화면 출력 바인딩
  function showEnding(type, faithVal, doubtVal) {
    endingOverlay.classList.remove('hidden');
    
    // 수치 맵핑
    finalFaith.textContent = `${Math.round(faithVal)}%`;
    finalDoubt.textContent = `${Math.round(doubtVal)}%`;
    
    // 엔딩 텍스트 분기
    if (type === 'FAITH') {
      endingTitle.textContent = '신성한 광신의 군주 (성자의 엔딩)';
      endingTitle.className = 'overlay-title text-gold';
      endingDescription.innerHTML = `
        귀하는 칼날 아래 흐느끼는 진실을 외면한 채, 빛과 정의의 이름으로 그림자(사람들)를 모두 불태웠습니다.<br>
        교단은 당신을 역사상 가장 위대한 성인으로 선포했습니다.<br><br>
        <strong>그러나 당신이 구원한 마을은 정적만이 흐르는 피비린내 나는 불꽃의 잿더미에 잠겼습니다.<br>
        눈을 감은 신앙은 무결하나, 그 손에 묻은 피는 결코 씻겨나가지 못하리라.</strong>
      `;
    } else if (type === 'DOUBT') {
      endingTitle.textContent = '참회하는 어둠의 이단자 (참회의 엔딩)';
      endingTitle.className = 'overlay-title text-crimson';
      endingDescription.innerHTML = `
        귀하는 광신의 장막을 등불로 걷어내고, 무고하게 이단으로 내몰린 자들의 얼굴과 참혹한 진실을 목도했습니다.<br>
        더 이상 성검을 휘두를 수 없게 된 당신은 신성 모독이자 이단자로 낙인찍혔습니다.<br><br>
        <strong>교단의 추적을 피해 등불만을 들고 어두운 참회의 황야로 떠나는 길.<br>
        비록 당신의 화려한 지위와 부서진 신념은 바닥에 떨어졌을지언정, 당신의 영혼은 최초로 맹목의 늪에서 벗어나 이성을 건졌습니다.</strong>
      `;
    } else {
      // 일반 실패 (HP 소진)
      endingTitle.textContent = '심판관의 순교 (HP 소진)';
      endingTitle.className = 'overlay-title text-muted';
      endingDescription.innerHTML = `
        그림자 속에 감춰진 진실과 공포의 거센 파도 앞에서 당신은 육신의 생명을 다했습니다.<br>
        신앙의 칼날은 부러졌고, 등불은 차갑게 식었습니다.<br><br>
        <strong>마을은 영원히 차가운 광기와 혼돈 속에 버려졌습니다. 다시 일어나 스스로의 신념을 증명하십시오.</strong>
      `;
    }
  }

  // 10. 오디오 볼륨 제어 바인딩
  muteBtn.addEventListener('click', () => {
    if (game && game.audioEngine) {
      const isMuted = game.audioEngine.toggleMute();
      if (isMuted) {
        muteIcon.textContent = '🔇';
        muteBtn.innerHTML = '🔇 음악 꺼짐';
        muteBtn.style.opacity = '0.6';
      } else {
        muteIcon.textContent = '🔊';
        muteBtn.innerHTML = '🔊 음악 켜짐';
        muteBtn.style.opacity = '1';
      }
    }
  });

  // 잿가루 백그라운드 입자 생성
  function initAshBackground() {
    const bg = document.getElementById('ashBackground');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'ash-particle';
      
      // 랜덤 속성 지정
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = Math.random() * 10 + 8;
      
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${left}%`;
      p.style.animationDelay = `${delay}s`;
      p.style.animationDuration = `${duration}s`;
      
      bg.appendChild(p);
    }
  }

  // 탭 제어 시스템
  function initTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        
        // 버튼 상태 활성
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 콘텐츠 페인 상태 활성
        tabPanes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.id === `tab-${targetTabId}`) {
            pane.classList.add('active');
          }
        });
      });
    });
  }
});
