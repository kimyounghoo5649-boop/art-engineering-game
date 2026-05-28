/* ==========================================
   AD LIMINA: 이단심문관의 등불 - 게임 엔진 코어 코드
   ========================================== */

// --------------------------------------------------
// 1. Web Audio API 기반 오디오 합성기 (Procedural Sound Synthesizer)
// --------------------------------------------------
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.progressionInterval = null;
    this.notes = [110.00, 130.81, 146.83, 164.81]; // A2, C3, D3, E3 (마이너 스산한 화음)
    this.currentNoteIndex = 0;
  }

  init() {
    if (this.ctx) return;
    
    // 오디오 컨텍스트 초기화 (사용자 제스처 필수)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
    this.masterGain.connect(this.ctx.destination);
    
    // 스산한 백그라운드 앰비언트 음악 시작
    this.startAmbientDrone();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 백그라운드 성가풍/어두운 패드 앰비언트 합성
  startAmbientDrone() {
    if (!this.ctx) return;

    // 성가풍의 어두운 패드 사운드 (두 개의 오실레이터 합성)
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc2 = this.ctx.createOscillator();
    
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    
    // 삼각형파(부드러운 사운드)와 톱니파(풍부한 배음) 결합 후 로우패스 필터로 다듬기
    this.ambientOsc.type = 'triangle';
    this.ambientOsc2.type = 'sawtooth';
    
    // 필터 노드 생성 (고주파를 잘라내어 무겁고 차분하게 함)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    
    this.ambientOsc.frequency.setValueAtTime(this.notes[0], this.ctx.currentTime);
    this.ambientOsc2.frequency.setValueAtTime(this.notes[0] * 1.5, this.ctx.currentTime); // 5도 화음

    this.ambientOsc.connect(filter);
    this.ambientOsc2.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    
    this.ambientOsc.start();
    this.ambientOsc2.start();

    // 4초마다 중세풍 단조 화음 변경 (A minor -> F Major -> D minor -> E Major 분위기)
    this.progressionInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
      
      this.currentNoteIndex = (this.currentNoteIndex + 1) % this.notes.length;
      const baseFreq = this.notes[this.currentNoteIndex];
      const now = this.ctx.currentTime;
      
      // 글라이드 효과 적용 (주파수가 매끄럽게 넘어감)
      this.ambientOsc.frequency.exponentialRampToValueAtTime(baseFreq, now + 2.0);
      this.ambientOsc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 2.0);
    }, 4000);
  }

  // 성검 휘두르기 (Slash SFX)
  playSlashSound() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    // 높은 음에서 낮은 음으로 급격히 슬라이드하여 쉭 소리 연출
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(now + 0.2);
  }

  // 악마 피격 (Hit SFX)
  playHitSound() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(now + 0.15);
  }

  // 등불 활성화 시 스산한 공명음
  playLanternHum(active) {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    // 일회성 효과가 아닌 지속적인 고주파/저주파 간섭으로 긴장감 유도
    if (active) {
      if (this.humOsc) return;
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      
      this.humOsc.type = 'sine';
      this.humOsc.frequency.setValueAtTime(440, this.ctx.currentTime);
      // 미세 진동으로 스산함 연출
      this.humOsc.frequency.linearRampToValueAtTime(445, this.ctx.currentTime + 0.5);
      
      this.humGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      
      this.humOsc.connect(this.humGain);
      this.humGain.connect(this.masterGain);
      this.humOsc.start();
    } else {
      if (this.humOsc) {
        try {
          this.humGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
          this.humOsc.stop(this.ctx.currentTime + 0.2);
        } catch(e) {}
        this.humOsc = null;
        this.humGain = null;
      }
    }
  }

  // 인간의 비명/흐느낌 피드백 사운드 (Weeping / Soul Scream SFX)
  playSoulScreamSound() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    // 두 개의 미세하게 다른 비명 주파수 오실레이터 결합
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    
    // 인간 비명 주파수 대역 (약 600Hz ~ 1200Hz)
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.linearRampToValueAtTime(300, now + 0.6); // 비명이 잦아듦
    
    osc2.frequency.setValueAtTime(810, now);
    osc2.frequency.linearRampToValueAtTime(280, now + 0.6);
    
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    // 비명이 너무 날카롭지 않도록 필터링
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  }

  // 최종 성당의 종소리 (Ringing Bell SFX)
  playCathedralBell() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    // 종소리는 기본 배음들이 매우 풍부한 4개 오실레이터의 결합으로 구현
    const partials = [120, 240, 360, 480]; // 저음이 깔리는 거대한 성당 종
    partials.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // 고음 배음은 빠르게 감쇄하고 저음은 오래 잔향이 남음
      const decay = 3.0 / (idx + 1);
      gain.gain.setValueAtTime(0.25 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      osc.stop(now + decay + 0.5);
    });
  }

  // 플레이어 피격음
  playPlayerHurtSound() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(20, now + 0.3);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(now + 0.4);
  }

  stop() {
    if (this.progressionInterval) {
      clearInterval(this.progressionInterval);
    }
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc2.stop();
      } catch(e) {}
    }
    if (this.humOsc) {
      try { this.humOsc.stop(); } catch(e) {}
    }
    this.ctx = null;
  }
}


// --------------------------------------------------
// 2. 파티클 시스템 (Particle System)
// --------------------------------------------------
class Particle {
  constructor(x, y, vx, vy, color, size, life, type = 'ember') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.type = type;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.type === 'ember') {
      this.vy -= 0.05; // 잿더미/불꽃 입자는 서서히 상승
    } else if (this.type === 'blood') {
      this.vy += 0.2; // 피/어둠 방울은 아래로 중력을 받음
    }
    
    this.life--;
  }

  draw(ctx, cameraX) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - cameraX, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}


// --------------------------------------------------
// 3. 이단심문관 헤르만 (Player Character)
// --------------------------------------------------
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 64;
    
    // 물리 데이터
    this.vx = 0;
    this.vy = 0;
    this.speed = 4;
    this.gravity = 0.55;
    this.jumpForce = -11.5;
    this.isGrounded = false;
    this.direction = 1; // 1 = 오른쪽, -1 = 왼쪽
    
    // 캐릭터 가로 이동 감쇠
    this.friction = 0.85;

    // 전투 관련 상태
    this.hp = 100;
    this.maxHp = 100;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    
    // 랜턴 등불 투사 상태
    this.isIlluminating = false;

    // 피격 무적
    this.invulnerableTimer = 0;
    
    // 애니메이션 단계 계산용 프레임
    this.animFrame = 0;
    this.isMoving = false;
  }

  update(keys) {
    // 1. 키보드 입력 제어
    this.isMoving = false;
    
    if (keys['KeyA'] || keys['ArrowLeft']) {
      this.vx = -this.speed;
      this.direction = -1;
      this.isMoving = true;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
      this.vx = this.speed;
      this.direction = 1;
      this.isMoving = true;
    } else {
      this.vx *= this.friction; // 마찰력 감속
    }

    // 2. 점프 연산
    if ((keys['Space'] || keys['KeyW'] || keys['ArrowUp']) && this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }

    // 3. 중력 적용
    this.vy += this.gravity;
    
    // 위치 적산
    this.x += this.vx;
    this.y += this.vy;

    // 4. 지면 충돌 체크 (y=350 고정 지면 기준)
    const floorY = 380 - this.height;
    if (this.y >= floorY) {
      this.y = floorY;
      this.vy = 0;
      this.isGrounded = true;
    }

    // 5. 월드 좌우 바운더리 보호
    if (this.x < 50) this.x = 50;
    if (this.x > 2150) this.x = 2150; // 종탑까지 가도록

    // 6. 무적 시간 및 타이머들 업데이트
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    if (this.isAttacking) {
      this.attackTimer++;
      if (this.attackTimer > 15) { // 15프레임 동안 공격 판정
        this.isAttacking = false;
        this.attackTimer = 0;
      }
    }

    // 등불 조사 여부 설정 (K키)
    this.isIlluminating = keys['KeyK'] ? true : false;

    // 애니메이션 틱 누적
    if (this.isMoving && this.isGrounded) {
      this.animFrame += 0.25;
    } else {
      this.animFrame = 0;
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.invulnerableTimer = 45; // 45프레임간 무적
    return true;
  }

  // 수동 드로잉 기반 절차적 픽셀 아트 스타일 구현
  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    
    ctx.save();
    
    // 피격 시 깜빡임 피드백
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    // 드로잉 방향 정밀 조율
    ctx.translate(screenX + this.width / 2, this.y + this.height / 2);
    ctx.scale(this.direction, 1);
    
    const w = this.width;
    const h = this.height;
    
    // 절차적 드로잉: 중세 이단심문관 헤르만 캐릭터
    // 1. 발/다리 (바지: 짙은 잿빛)
    ctx.fillStyle = '#1c1c22';
    // 걷기 애니메이션에 따른 다리 흔들림
    const legOffset = Math.sin(this.animFrame) * 4;
    ctx.fillRect(-w/2 + 6, h/2 - 12 + legOffset/2, 6, 12);
    ctx.fillRect(w/2 - 12, h/2 - 12 - legOffset/2, 6, 12);
    
    // 2. 망토/몸통 (이단심문관의 상징, 길게 늘어뜨린 피빛 줄기가 도는 검정 망토)
    ctx.fillStyle = '#0f0f12';
    ctx.fillRect(-w/2, -h/2 + 16, w, 36);
    
    // 망토 끝자락 피빛 장식
    ctx.fillStyle = '#7a1b1b';
    ctx.fillRect(-w/2, h/2 - 18, w, 4);

    // 3. 금빛 십자가 가슴 성구
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-2, -10, 4, 12);
    ctx.fillRect(-5, -6, 10, 4);

    // 4. 머리 및 이단심문관의 넓은 챙모자 (Tricorn/Inquisitor Hat)
    ctx.fillStyle = '#e5c1a3'; // 얼굴 피부색
    ctx.fillRect(-6, -h/2 + 2, 12, 14);
    
    // 모자 (검정)
    ctx.fillStyle = '#050507';
    // 머리통 모자 바닥 챙
    ctx.fillRect(-w/2 - 4, -h/2 + 2, w + 8, 4);
    // 모자 뚜껑
    ctx.fillRect(-10, -h/2 - 6, 20, 8);
    
    // 눈 (붉은 광채/피로)
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(3, -h/2 + 6, 2, 2);

    // 5. 성검/성등 장비 비주얼
    // 5-1. 성검 (공격 중이 아닐 때는 등 뒤에, 공격 중에는 휘두름)
    if (this.isAttacking) {
      ctx.save();
      // 휘두르는 애니메이션 각도 프레임
      const progress = this.attackTimer / 15;
      const angle = -Math.PI/3 + progress * Math.PI; // 아래에서 위로 호를 그리며 벰
      ctx.rotate(angle);
      
      // 검날 (빛나는 강철색)
      ctx.fillStyle = '#e2e2ee';
      ctx.fillRect(0, -6, 42, 6);
      
      // 코브 가드 (황금 코브 가드)
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(0, -9, 4, 12);
      
      // 가드 손잡이
      ctx.fillStyle = '#3a2512';
      ctx.fillRect(-8, -5, 8, 4);
      ctx.restore();
    } else {
      // 대기 시 등에 메고 있는 성검
      ctx.save();
      ctx.translate(-w/2 + 4, 0);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#6e707a';
      ctx.fillRect(0, -6, 30, 4);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(0, -8, 2, 8);
      ctx.restore();
    }

    // 5-2. 성등 (전방에 손으로 등불을 앞으로 치켜드는 모션)
    ctx.save();
    if (this.isIlluminating) {
      ctx.translate(w/2 - 2, 4);
    } else {
      ctx.translate(w/2 - 6, 12);
    }
    // 등불 체인과 고리
    ctx.fillStyle = '#55555d';
    ctx.fillRect(0, -6, 2, 6);
    // 등불 프레임 (금빛 청동)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-4, 0, 10, 12);
    // 등불 내 중심 불빛 (오렌지/옐로 실시간 점멸)
    ctx.fillStyle = Math.random() > 0.3 ? '#fffb00' : '#ff9900';
    ctx.fillRect(-2, 2, 6, 8);
    ctx.restore();

    ctx.restore();
  }
}


// --------------------------------------------------
// 4. 그림자 악마 (Enemy Characters)
// --------------------------------------------------
class Enemy {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type; // normal, heavy, flyer, boss
    
    // 타입별 크기 및 스탯 정의 (보스는 다른 악마보다 3배 거대함)
    if (type === 'boss') {
      this.width = 100;
      this.height = 150;
      this.hp = 100;
      this.maxHp = 100;
      this.damage = 30; // 보스 타격 데미지
      this.vx = -0.3; // 느린 움직임
    } else if (type === 'heavy') {
      this.width = 46;
      this.height = 70;
      this.hp = 30; // 3대 버팀 (데미지 10 기준)
      this.damage = 25; // 묵직한 한방 (-25hp)
      this.vx = -0.4; // 매우 느리게 걸어옴
    } else if (type === 'flyer') {
      this.width = 24;
      this.height = 24;
      this.hp = 10; // 내가 한 대만 때려도 죽음
      this.damage = 1; // 공격력 단 1
      this.vx = -1.6;
    } else { // normal
      this.width = 36;
      this.height = 56;
      this.hp = 10;
      this.damage = 15;
      this.vx = -1.0;
    }
    
    this.isDead = false;
    this.isLit = false;
    this.litCooldown = 0;
    
    // 보스 패턴 타이머
    this.bossAttackTimer = 0;
    
    // 애니메이션 오프셋
    this.spiritOffset = Math.random() * Math.PI * 2;
    this.deathOpacity = 1.0;
  }

  update(player, gameInstance) {
    if (this.isDead) {
      this.deathOpacity -= 0.05;
      return;
    }

    // 좌우 걷기/비행 연산
    this.x += this.vx;
    
    // 등불 피격(조사) 지속성 체크
    if (this.litCooldown > 0) {
      this.litCooldown--;
      if (this.litCooldown === 0) {
        this.isLit = false;
      }
    }
    
    // 1. 하늘을 나는 아기자기한 악마 (Flyer)의 활발한 추적 비행 (주인공을 향해 하강 돌진)
    if (this.type === 'flyer') {
      const tx = player.x + player.width/2;
      const ty = player.y + player.height/2;
      
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 10) {
        // 주인공 방향으로 능동적으로 하강 돌격
        this.x += (dx / dist) * Math.abs(this.vx);
        this.y += (dy / dist) * Math.abs(this.vx) * 0.85;
      } else {
        this.x += this.vx;
      }
    }
    // 2. 보스의 공포스러운 스톰핑 및 탄막 투척 패턴
    else if (this.type === 'boss') {
      this.y = 380 - this.height; // 지면에 고정
      
      this.bossAttackTimer++;
      // 2.5초(150프레임)마다 플레이어 방향으로 붉은 유도 파이어볼 발사
      if (this.bossAttackTimer > 150 && gameInstance) {
        this.bossAttackTimer = 0;
        
        // 보스 앞 중심에서 발사
        const bx = this.x;
        const by = this.y + this.height / 2;
        
        // 플레이어 중심 방향으로 날아가기 위한 속도 벡터 구하기
        const px = player.x + player.width/2;
        const py = player.y + player.height/2;
        const dx = px - bx;
        const dy = py - by;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const speed = 4.5;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        // 게임 인스턴스에 탄환 생성
        if (gameInstance.bossProjectiles) {
          gameInstance.bossProjectiles.push({
            x: bx,
            y: by,
            vx: vx,
            vy: vy,
            size: 8,
            damage: 15,
            isDead: false
          });
          // 보스 전용 오디오 소리 (슬라이더 고주파음)
          try {
            gameInstance.audioEngine.playPlayerHurtSound(); 
          } catch(e) {}
        }
      }
    } else {
      // 일반/헤비 지상 유닛 지면 밀착
      this.y = 380 - this.height;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
      return true; // 사망 판정
    }
    return false;
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    
    ctx.save();
    if (this.isDead) {
      ctx.globalAlpha = this.deathOpacity;
    }

    // 1. 광원(등불)에 노출되었을 때: 참회하는 나약한 인간 실루엣(Weeping Spirit)
    if (this.isLit) {
      ctx.save();
      ctx.shadowBlur = this.type === 'boss' ? 25 : 10;
      ctx.shadowColor = 'rgba(100, 200, 255, 0.6)';
      
      const glow = Math.sin(Date.now() / 100) * 0.15 + 0.85;
      ctx.globalAlpha = (this.isDead ? this.deathOpacity : glow) * 0.9;
      
      // 영혼 색상 (보스 영혼은 특별한 금빛/자주색 혼합)
      ctx.fillStyle = this.type === 'boss' ? '#dfbeeb' : '#a6c5e8';
      
      // 영혼 몸통 스케일링 드로잉
      ctx.beginPath();
      ctx.moveTo(screenX + this.width * 0.22, this.y + this.height);
      ctx.quadraticCurveTo(screenX + this.width * 0.11, this.y + this.height * 0.35, screenX + this.width/2, this.y + this.height * 0.2);
      ctx.quadraticCurveTo(screenX + this.width * 0.89, this.y + this.height * 0.35, screenX + this.width * 0.78, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      
      // 영혼 머리
      ctx.beginPath();
      ctx.arc(screenX + this.width/2, this.y + this.height * 0.18, this.width * 0.22, 0, Math.PI*2);
      ctx.fill();
      
      // 머리를 감싸안은 슬픈 팔
      ctx.strokeStyle = this.type === 'boss' ? '#f0d5f8' : '#cbe0f5';
      ctx.lineWidth = this.type === 'boss' ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(screenX + this.width * 0.16, this.y + this.height * 0.43);
      ctx.lineTo(screenX + this.width/2 - 4, this.y + this.height * 0.22);
      ctx.moveTo(screenX + this.width * 0.84, this.y + this.height * 0.43);
      ctx.lineTo(screenX + this.width/2 + 4, this.y + this.height * 0.22);
      ctx.stroke();
      
      ctx.restore();
    } 
    // 2. 일반 상태: 뾰족뾰족하고 기괴한 그림자 악마 (어두운 몸체 + 붉은색 강렬한 아웃라인 추가로 높은 구별력 확보)
    else {
      ctx.save();
      
      // 악마들의 전반적인 아웃라인 선 스타일 지정
      ctx.strokeStyle = '#a62b2b'; // 어두운 붉은색 강렬한 아웃라인
      ctx.lineWidth = this.type === 'boss' ? 4 : 2;
      ctx.fillStyle = '#0a0a0f'; // 검정 몸체
      
      const cx = screenX + this.width / 2;
      const cy = this.y + this.height / 2;
      const r = this.width / 2;
      
      // 2-1. [보스 악마 비주얼]: 거대한 뿔, 등 뒤에 펄럭이는 붉은 기형 날개, 가슴 속 불타는 눈
      if (this.type === 'boss') {
        // 날개 드로잉 (펄럭임)
        ctx.fillStyle = '#4a0e0e';
        ctx.strokeStyle = '#a62b2b';
        
        const wingFlap = Math.sin(Date.now() / 200) * 15;
        
        // 왼쪽 날개
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 20);
        ctx.lineTo(cx - 100, cy - 80 + wingFlap);
        ctx.lineTo(cx - 60, cy + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 오른쪽 날개
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 20);
        ctx.lineTo(cx + 100, cy - 80 - wingFlap);
        ctx.lineTo(cx + 60, cy + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 보스 본체 (초거대 울퉁불퉁 덩치)
        ctx.fillStyle = '#08080c';
        ctx.strokeStyle = '#ff1133'; // 보스는 아웃라인을 더 새빨갛게!
        ctx.beginPath();
        
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2;
          const noise = Math.sin(angle * 6 + Date.now() / 60) * 8;
          const px = cx + Math.cos(angle) * (r + noise);
          const py = cy + Math.sin(angle) * (r + noise + 10);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 머리 가시 거대 뿔
        ctx.fillStyle = '#040406';
        ctx.strokeStyle = '#a62b2b';
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 50);
        ctx.quadraticCurveTo(cx - 60, cy - 110, cx - 75, cy - 90);
        ctx.quadraticCurveTo(cx - 40, cy - 60, cx - 10, cy - 60);
        ctx.moveTo(cx + 30, cy - 50);
        ctx.quadraticCurveTo(cx + 60, cy - 110, cx + 75, cy - 90);
        ctx.quadraticCurveTo(cx + 40, cy - 60, cx + 10, cy - 60);
        ctx.stroke();
        ctx.fill();
        
        // 가슴의 붉게 타오르는 대형 코어 눈동자 (Boss Eye)
        ctx.fillStyle = '#ff0033';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff1133';
        ctx.beginPath();
        ctx.arc(cx, cy - 15, 12, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; // 눈부신 코어 중심
        ctx.beginPath();
        ctx.arc(cx, cy - 15, 4, 0, Math.PI*2);
        ctx.fill();
      }
      // 2-2. [헤비 악마 ➔ 거대 보디빌더형 중갑 대장장이/처형인 비주얼]: 육중한 가죽 앞치마와 거대 망치
      else if (this.type === 'heavy') {
        // 거대한 몸통 (대장장이 가죽 앞치마)
        ctx.fillStyle = '#30180d'; // 가죽 갈색
        ctx.fillRect(screenX + 4, this.y + 16, this.width - 8, this.height - 20);
        ctx.strokeRect(screenX + 4, this.y + 16, this.width - 8, this.height - 20);
        
        // 튼튼한 장화/다리
        ctx.fillStyle = '#16171d';
        ctx.fillRect(screenX + 8, this.y + this.height - 8, 10, 8);
        ctx.fillRect(screenX + this.width - 18, this.y + this.height - 8, 10, 8);
        
        // 묵직한 중갑 철모/후드
        ctx.fillStyle = '#22232a';
        ctx.fillRect(cx - 15, this.y + 2, 30, 16);
        ctx.strokeRect(cx - 15, this.y + 2, 30, 16);
        
        // 철모 투구 슬릿 사이로 새어나오는 단 하나의 광기어린 붉은 외눈 (Accused red glow)
        ctx.fillStyle = '#ff1133';
        ctx.fillRect(cx - 2, this.y + 8, 4, 4);
        
        // 거대한 처형인 대장장이 망치 (Executioner Sledgehammer)
        ctx.save();
        ctx.translate(cx + 10, cy + 5);
        ctx.rotate(Math.sin(Date.now() / 150) * 0.15); // 스윙 대기 모션 흔들림
        
        // 망치 손잡이 (나무 자루)
        ctx.strokeStyle = '#4e331b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, -32);
        ctx.stroke();
        
        // 대형 철퇴 헤드
        ctx.fillStyle = '#111215';
        ctx.strokeStyle = '#a62b2b';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-12, -40, 24, 14);
        ctx.strokeRect(-12, -40, 24, 14);
        ctx.restore();
      }
      // 2-3. [플라이어 악마 비주얼]: 작은 구체 + 날렵하게 퍼덕이는 가죽날개 (주인공 추적용 박쥐 형상)
      else if (this.type === 'flyer') {
        ctx.fillStyle = '#07070a';
        // 본체 원
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // 날렵하게 푸드덕거리는 박쥐 날개
        const flap = Math.sin(Date.now() / 60) * 12;
        ctx.fillStyle = '#3a0808';
        
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy);
        ctx.lineTo(cx - 25, cy - 14 + flap);
        ctx.lineTo(cx - 15, cy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy);
        ctx.lineTo(cx + 25, cy - 14 - flap);
        ctx.lineTo(cx + 15, cy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 눈
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      }
      // 2-4. [일반 악마 ➔ 누더기 두건을 쓴 무고한 농부/마녀 재판Accused Peasant 비주얼]: 인간 실루엣
      else {
        // 누더기 짙은 잿빛 망토/두건
        ctx.fillStyle = '#1c1d24'; // 남루한 Peasant 복장
        ctx.beginPath();
        
        // 몸통 망토 곡선
        ctx.moveTo(screenX + 6, this.y + this.height);
        ctx.lineTo(screenX + 2, this.y + 20);
        ctx.quadraticCurveTo(cx, this.y + 12, screenX + this.width - 2, this.y + 20);
        ctx.lineTo(screenX + this.width - 6, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 삐져나온 허름한 바지 단과 두 발
        ctx.fillStyle = '#111115';
        ctx.fillRect(screenX + 8, this.y + this.height - 4, 6, 4);
        ctx.fillRect(screenX + this.width - 14, this.y + this.height - 4, 6, 4);
        
        // 머리를 깊게 덮은 남루한 두건 후드
        ctx.fillStyle = '#0f1014';
        ctx.beginPath();
        ctx.arc(cx, this.y + 12, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // 두건 속 어두운 안면 섀도우 틈새로 아주 희미하게 빛나는 붉은 의심의 눈동자
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(cx - 3, this.y + 11, 2, 2);
        ctx.fillRect(cx + 1, this.y + 11, 2, 2);

        // 손에 쥐고 있는 마녀/이단의 상징으로 날조된 농사용 삼지창(Pitchfork)
        ctx.save();
        ctx.translate(screenX - 2, cy + 6);
        ctx.rotate(-Math.PI / 10);
        
        // 나무 봉 자루
        ctx.strokeStyle = '#4e331b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(0, -22);
        ctx.stroke();
        
        // 삼지창 머리쇠 (철색 3개 포크)
        ctx.strokeStyle = '#636573';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, -22);
        ctx.lineTo(5, -22);
        ctx.moveTo(-4, -22);
        ctx.lineTo(-4, -30);
        ctx.moveTo(0, -22);
        ctx.lineTo(0, -32);
        ctx.moveTo(4, -22);
        ctx.lineTo(4, -30);
        ctx.stroke();
        ctx.restore();
      }
      
      ctx.restore();
    }

    ctx.restore();
  }
}


// --------------------------------------------------
// 5. 종탑 (Cathedral Bell Tower at Level End)
// --------------------------------------------------
class BellTower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 280;
    this.isRung = false;
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    
    ctx.save();
    
    // 종탑 기둥 및 프레임 (스톤 텍스처 느낌의 진한 잿빛 벽돌)
    ctx.fillStyle = '#1c1d24';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    
    // 벽돌 무늬 선 데코레이션
    ctx.strokeStyle = '#2f313e';
    ctx.lineWidth = 2;
    for (let i = 0; i < this.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(screenX, this.y + i);
      ctx.lineTo(screenX + this.width, this.y + i);
      ctx.stroke();
    }
    
    // 아치형 종탑 유리창 창문
    ctx.fillStyle = '#0a0a0d';
    ctx.beginPath();
    ctx.arc(screenX + this.width/2, this.y + 60, 25, Math.PI, 0);
    ctx.lineTo(screenX + this.width/2 + 25, this.y + 140);
    ctx.lineTo(screenX + this.width/2 - 25, this.y + 140);
    ctx.closePath();
    ctx.fill();
    
    // 창문 금빛 가느다란 격자
    ctx.strokeStyle = '#5a4d2c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX + this.width/2, this.y + 35);
    ctx.lineTo(screenX + this.width/2, this.y + 140);
    ctx.moveTo(screenX + this.width/2 - 25, this.y + 85);
    ctx.lineTo(screenX + this.width/2 + 25, this.y + 85);
    ctx.stroke();

    // 웅장한 황금의 종 (Gilded Cathedral Bell)
    ctx.fillStyle = '#d4af37';
    ctx.shadowBlur = this.isRung ? 20 : 0;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
    
    ctx.beginPath();
    const bx = screenX + this.width/2;
    const by = this.y + 55;
    // 종 흔들림 모션 (벨을 치면 크게 흔들림)
    const swing = this.isRung ? Math.sin(Date.now() / 150) * 15 : 0;
    ctx.translate(bx, by);
    ctx.rotate(swing * Math.PI / 180);
    
    // 돔 벨 형상 그리기
    ctx.arc(0, 0, 16, Math.PI, 0);
    ctx.lineTo(20, 28);
    ctx.quadraticCurveTo(0, 24, -20, 28);
    ctx.closePath();
    ctx.fill();
    
    // 추(Clapper)
    ctx.fillStyle = '#7a6018';
    ctx.beginPath();
    ctx.arc(0, 31, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
    
    // 등대처럼 꼭대기에서 회전하는 성스러운 불꽃 기둥
    ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.beginPath();
    ctx.moveTo(screenX + this.width/2, this.y);
    ctx.lineTo(screenX + this.width/2 - 50, this.y - 120);
    ctx.lineTo(screenX + this.width/2 + 50, this.y - 120);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}


// --------------------------------------------------
// 6. 메인 게임 루프 매니저 (Main Game Engine)
// --------------------------------------------------
export class Game {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {};

    // 델타 타임 제어용 변수
    this.lastTime = 0;
    this.isGameOver = false;
    this.isRunning = false;

    // 조작 키 맵
    this.keys = {};
    
    // 카메라 스크롤 offset
    this.cameraX = 0;
    this.worldWidth = 2400; // 넓은 탐험형 횡스크롤

    // 엔진 컴포넌트들 바인딩
    this.audioEngine = new AudioEngine();
    this.player = new Player(100, 300);
    
    // 종탑 배치
    this.bellTower = new BellTower(2150, 100);

    // 적 스폰 구조
    this.enemies = [];
    this.spawnEnemies();

    // 파티클
    this.particles = [];

    // 보스 발사 탄환 배열
    this.bossProjectiles = [];

    // 의사 게이지 시스템 연동
    this.faith = 0;
    this.doubt = 0;

    // 키보드 바인딩 리스너
    this.keydownHandler = (e) => {
      this.keys[e.code] = true;
      
      // 오디오 강제 잠금 해제 제스처
      if (['Space', 'KeyJ', 'KeyK', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
        this.audioEngine.init();
      }

      // 성검 단발형 사운드 (공격 Cooldown 체크 및 발현)
      if (e.code === 'KeyJ' && !this.player.isAttacking && this.player.attackCooldown === 0) {
        this.player.isAttacking = true;
        this.player.attackTimer = 0;
        this.player.attackCooldown = 25; // 25프레임간 쿨다운
        this.audioEngine.playSlashSound();
        this.triggerAttackHitbox();
      }

      // 등불 사운드 켜기/끄기
      if (e.code === 'KeyK') {
        this.audioEngine.playLanternHum(true);
      }
    };

    this.keyupHandler = (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyK') {
        this.audioEngine.playLanternHum(false);
      }
    };
  }

  start() {
    this.isRunning = true;
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));

    // 오디오 엔진은 첫 프레임부터 준비
    this.audioEngine.init();
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.audioEngine.stop();
  }

  // 몬스터 스폰 기믹 (새로운 악마 배치: 비행, 강력탱커, 거대보스 배치)
  spawnEnemies() {
    // 횡스크롤 맵 구간별로 균형있게 배치
    const spawns = [
      { x: 450, type: 'normal' },
      { x: 650, type: 'flyer' },
      { x: 850, type: 'heavy' },
      { x: 1050, type: 'flyer' },
      { x: 1250, type: 'heavy' },
      { x: 1450, type: 'flyer' },
      { x: 1650, type: 'heavy' },
      { x: 1950, type: 'boss' } // 마지막 구간 거대 보스 악마!
    ];

    spawns.forEach(sp => {
      // flyer는 공중에 생성
      const enemyY = sp.type === 'flyer' ? 200 : 380 - 56;
      this.enemies.push(new Enemy(sp.x, enemyY, sp.type));
    });
  }

  // 1초 단위나 틱 단위로 백그라운드 앰비언트 잿가루 날림
  updateParticles() {
    // 맵 먼지 입자 스포너 (매끄럽게)
    if (Math.random() < 0.25) {
      const px = this.cameraX + Math.random() * this.canvas.width;
      const py = Math.random() * 200;
      this.particles.push(new Particle(px, py, -Math.random() - 0.2, Math.random() * 0.2 + 0.1, 'rgba(255,255,255,0.08)', Math.random()*2 + 1, 150));
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // 공격 히트 판정 연산
  triggerAttackHitbox() {
    const range = 65; // 성검 리치
    const swordLeft = this.player.direction === 1 ? this.player.x + this.player.width : this.player.x - range;
    
    // 광원 투사 영역 체크용 수학 정의
    const angleMin = this.player.direction === 1 ? -Math.PI/6 : Math.PI - Math.PI/6;
    const angleMax = this.player.direction === 1 ? Math.PI/6 : Math.PI + Math.PI/6;
    
    this.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      
      // 전방 범위 충돌 판정
      const insideX = enemy.x + enemy.width/2 >= swordLeft && enemy.x + enemy.width/2 <= swordLeft + range + enemy.width/2;
      const insideY = Math.abs(enemy.y - this.player.y) < 60;
      
      if (insideX && insideY) {
        // 등불에 노출되었는가?
        const isCurrentlyLit = this.checkInsideLightCone(enemy);
        
        // 피격 성공
        this.audioEngine.playHitSound();
        
        // 피격 파티클 비산 (Ember vs Blood)
        const px = enemy.x + enemy.width/2;
        const py = enemy.y + enemy.height/2;
        
        if (isCurrentlyLit) {
          // 등불에 드러난 상태에서 뱀: 피비린내 나는 마녀사냥을 표상 (붉은 파티클)
          for (let k = 0; k < 12; k++) {
            this.particles.push(new Particle(px, py, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6 - 2, '#a62b2b', Math.random()*3 + 1, 40, 'blood'));
          }
          // 등불 조사를 동반했으므로 '의혹' 점수 증가
          this.doubt += 15;
          // 인간의 억울한 슬픈 소리 울림
          this.audioEngine.playSoulScreamSound();
        } else {
          // 등불 조사 없이 맹목적으로 뱀: 신성한 불꽃으로 그림자를 정화한다고 여김 (금빛 파티클)
          for (let k = 0; k < 12; k++) {
            this.particles.push(new Particle(px, py, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5 - 3, '#d4af37', Math.random()*2 + 1, 45, 'ember'));
          }
          // 신앙심 점수 증가
          this.faith += 10;
        }

        // 데미지 전달
        const died = enemy.takeDamage(10);
        
        // 게이지 UI 갱신 유도
        if (this.callbacks.onStateUpdate) {
          this.callbacks.onStateUpdate({ faith: this.faith, doubt: this.doubt });
        }
      }
    });
  }

  // 등불 빛 부채꼴 충돌 수학 판정
  checkInsideLightCone(target) {
    if (!this.player.isIlluminating) return false;
    
    // 플레이어 중앙 좌표 기준 거리
    const px = this.player.x + this.player.width/2;
    const py = this.player.y + 24;
    const tx = target.x + target.width/2;
    const ty = target.y + target.height/2;
    
    const dx = tx - px;
    const dy = ty - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const maxDist = 280; // 전방 서치 거리
    if (dist > maxDist) return false;
    
    // 타겟팅 각도 연산
    const targetAngle = Math.atan2(dy, dx);
    // 이단심문관의 현재 전방 기준 부채꼴 중심 각도
    const centerAngle = this.player.direction === 1 ? 0 : Math.PI;
    
    // 두 각도 차이 연산
    let diff = targetAngle - centerAngle;
    // 범위 노말라이즈
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    
    const fov = Math.PI / 3; // 60도 부채꼴
    const isLit = Math.abs(diff) < fov;
    
    if (isLit) {
      target.isLit = true;
      target.litCooldown = 10; // 등불을 피하더라도 10프레임간 형상 잔상 유지
    }
    return isLit;
  }

  // 메인 렌더링 루프
  loop(timestamp) {
    if (!this.isRunning) return;
    
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // 1. 상태 업데이트
    this.update();

    // 2. 캔버스 지우기
    this.ctx.fillStyle = '#07070a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 3. 드로잉
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    if (this.isGameOver) return;

    // 1. 플레이어 업데이트
    this.player.update(this.keys);

    // 2. 카메라 트래킹 (스무스 횡스크롤 카메라)
    const targetCamX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    // 카메라 바운더리
    if (this.cameraX < 0) this.cameraX = 0;
    if (this.cameraX > this.worldWidth - this.canvas.width) this.cameraX = this.worldWidth - this.canvas.width;

    // 3. 등불 마스킹에 연관된 몬스터 라이트 여부 연산
    this.enemies.forEach(enemy => {
      this.checkInsideLightCone(enemy);
      enemy.update(this.player, this); // gameInstance context 전달
      
      // 살아있는 적의 충돌 박스로 피격 연산 (무적 딜레이 고려, 보스/헤비 덩치를 감안한 충돌 박스 유연화)
      if (!enemy.isDead && !this.player.isGameOver) {
        const dist = Math.abs((this.player.x + this.player.width/2) - (enemy.x + enemy.width/2));
        const limitDist = enemy.type === 'boss' ? 55 : (enemy.type === 'heavy' ? 32 : 26);
        if (dist < limitDist && Math.abs(this.player.y - enemy.y) < enemy.height) {
          const hurt = this.player.takeDamage(enemy.damage);
          if (hurt) {
            this.audioEngine.playPlayerHurtSound();
            // 넉백 파티클
            const px = this.player.x + this.player.width/2;
            const py = this.player.y + this.player.height/2;
            for(let j=0; j<6; j++) {
              this.particles.push(new Particle(px, py, -this.player.direction * 4, -2, '#ff3333', 2, 30, 'blood'));
            }
          }
        }
      }
    });

    // 3-2. 보스가 쏜 붉은 파이어볼 탄환 이동 및 충돌 연산
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const proj = this.bossProjectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      // 화면 밖을 멀리 벗어나면 제거
      if (proj.x < this.cameraX - 100 || proj.x > this.cameraX + this.canvas.width + 100) {
        this.bossProjectiles.splice(i, 1);
        continue;
      }
      
      // 플레이어와 원형 충돌 판정
      const px = this.player.x + this.player.width/2;
      const py = this.player.y + this.player.height/2;
      const dist = Math.sqrt(Math.pow(proj.x - px, 2) + Math.pow(proj.y - py, 2));
      
      if (dist < 26 && !this.player.isGameOver) {
        const hurt = this.player.takeDamage(proj.damage);
        if (hurt) {
          this.audioEngine.playPlayerHurtSound();
          // 피격 파티클
          for (let j = 0; j < 5; j++) {
            this.particles.push(new Particle(proj.x, proj.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, '#ff1133', 2, 25, 'blood'));
          }
        }
        // 탄환 소멸
        this.bossProjectiles.splice(i, 1);
      }
    }

    // 4. 파티클 업데이트
    this.updateParticles();

    // 5. HP 전사 실패 상태 점검
    if (this.player.hp <= 0) {
      this.triggerEnding('DEATH');
    }

    // 6. 종탑 골 지점 종 울리기 체크 (종탑 부근에서 J키 성검 타격 또는 K키 등불 대면 시 골)
    const towerDist = Math.abs((this.player.x + this.player.width/2) - (this.bellTower.x + this.bellTower.width/2));
    if (towerDist < 70 && !this.bellTower.isRung) {
      if (this.keys['KeyJ'] || this.keys['KeyK']) {
        this.bellTower.isRung = true;
        this.audioEngine.playCathedralBell();
        
        // 종 치고 1.5초 후 최종 판정 엔딩 돌입
        setTimeout(() => {
          // 최종 신앙 vs 의혹 우열에 따른 성찰 분기 엔딩 출력
          if (this.doubt > this.faith) {
            this.triggerEnding('DOUBT');
          } else {
            this.triggerEnding('FAITH');
          }
        }, 1500);
      }
    }
  }

  triggerEnding(endingType) {
    this.isGameOver = true;
    this.isRunning = false;
    
    // 등불 소리 꺼짐 보증
    this.audioEngine.playLanternHum(false);
    
    if (this.callbacks.onEnding) {
      // 0~100% 비율 노멀라이즈 전달
      const total = this.faith + this.doubt;
      let fRate = 50;
      let dRate = 50;
      if (total > 0) {
        fRate = (this.faith / total) * 100;
        dRate = (this.doubt / total) * 100;
      }
      this.callbacks.onEnding(endingType, fRate, dRate);
    }
  }

  draw() {
    const ctx = this.ctx;
    
    // [배경 레이어] 잿빛 안개 핀 스산한 실루엣 (배경을 더욱 밝게 조율하여 시각적 구별력 극대화)
    ctx.fillStyle = '#1e202b';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    // 원경 산맥/건물 도트 (배경 산을 대폭 밝혀 캐릭터 및 악마들의 검붉은 실루엣과 대비시킴)
    ctx.fillStyle = '#313444';
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.lineTo(200 - this.cameraX*0.1, 280);
    ctx.lineTo(400 - this.cameraX*0.1, 380);
    ctx.lineTo(700 - this.cameraX*0.1, 220);
    ctx.lineTo(1000 - this.cameraX*0.1, 380);
    ctx.lineTo(1500 - this.cameraX*0.1, 200);
    ctx.lineTo(2000 - this.cameraX*0.1, 380);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // [지면 바닥]
    ctx.fillStyle = '#1c1c24';
    ctx.fillRect(0, 380, this.canvas.width, 70);
    // 지면 가로 데코 선
    ctx.strokeStyle = '#282834';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.lineTo(this.canvas.width, 380);
    ctx.stroke();

    // 흙바닥 빗금 무늬 도트 느낌 연출
    ctx.fillStyle = '#15151c';
    for (let x = 0; x < this.canvas.width; x += 60) {
      ctx.fillRect(x - (this.cameraX % 60), 395, 12, 4);
      ctx.fillRect(x - ((this.cameraX + 30) % 60), 415, 8, 4);
    }

    // 마녀재판의 상징: 배경에 불타오르는 말뚝(Stakes) 연출 기믹
    ctx.save();
    ctx.fillStyle = '#08080b';
    // 몇 개의 기둥 말뚝 실루엣 그리기
    const stakes = [350, 850, 1400];
    stakes.forEach(sx => {
      const screenSx = sx - this.cameraX;
      if (screenSx > -50 && screenSx < this.canvas.width + 50) {
        ctx.fillStyle = '#0f0f14';
        ctx.fillRect(screenSx, 260, 6, 120); // 말뚝 기둥
        ctx.fillRect(screenSx - 8, 280, 22, 5); // 십자형 말뚝
        
        // 희미한 금빛 불씨 오우라
        const flicker = Math.random() > 0.4;
        ctx.fillStyle = flicker ? 'rgba(212,175,55,0.15)' : 'rgba(166,43,43,0.15)';
        ctx.beginPath();
        ctx.arc(screenSx + 3, 280, 20, 0, Math.PI*2);
        ctx.fill();
      }
    });
    ctx.restore();

    // [종탑 드로우]
    this.bellTower.draw(ctx, this.cameraX);

    // [몬스터 드로우]
    this.enemies.forEach(enemy => {
      if (enemy.x - this.cameraX > -80 && enemy.x - this.cameraX < this.canvas.width + 80) {
        enemy.draw(ctx, this.cameraX);
      }
    });

    // [보스 탄환 드로우]
    this.bossProjectiles.forEach(proj => {
      ctx.save();
      // 타오르는 붉은 불꽃 구체 연출
      ctx.fillStyle = '#ff2244';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff1133';
      ctx.beginPath();
      ctx.arc(proj.x - this.cameraX, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
      
      // 내부 코어 불빛
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(proj.x - this.cameraX, proj.y, proj.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // [플레이어 드로우]
    this.player.draw(ctx, this.cameraX);

    // [파티클 드로우]
    this.particles.forEach(p => {
      p.draw(ctx, this.cameraX);
    });

    // --------------------------------------------------
    // 핵심 비주얼 이펙트: 성스러운 등불의 실시간 원뿔 라이팅 마스크 (Lighting Cone Mask)
    // --------------------------------------------------
    this.drawLightingMask();

    // --------------------------------------------------
    // 상단 체력바 & 앰비언트 경고 비네트 드로잉
    // --------------------------------------------------
    this.drawHUD();
  }

  // 캔버스의 조명/어둠 마스킹 기법
  drawLightingMask() {
    const ctx = this.ctx;
    
    // 마스크 캔버스 버퍼 레이어
    ctx.save();
    
    // 전체 화면을 뒤덮는 스산하고 두터운 흑암 (의혹이 오를수록 어둠 비네팅이 두터워짐)
    const doubtRatio = this.doubt / (this.faith + this.doubt || 1);
    const alphaDark = 0.25 + (doubtRatio * 0.15); // 의혹도가 높으면 최대 40% 어둠, 기본은 25%로 훨씬 부드러운 밝기
    
    // 캔버스 자체 컴포지트 연산을 통해 빛나는 효과 제작
    // 임시 오프스크린처럼 마스킹 패스 생성
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.canvas.width;
    maskCanvas.height = this.canvas.height;
    const mctx = maskCanvas.getContext('2d');
    
    mctx.fillStyle = `rgba(6, 6, 8, ${alphaDark})`;
    mctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 플레이어 중심에서 나오는 아늑한 최소한의 신성 촛불 광원 (원형)
    const px = this.player.x + this.player.width/2 - this.cameraX;
    const py = this.player.y + 24;
    
    mctx.save();
    mctx.globalCompositeOperation = 'destination-out';
    
    // 원형 빛 마스크 깎기 (반경을 95로 확장하여 훨씬 쾌적한 시야 확보)
    const playerRadGrad = mctx.createRadialGradient(px, py, 15, px, py, 95);
    playerRadGrad.addColorStop(0, 'rgba(0,0,0,1)');
    playerRadGrad.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = playerRadGrad;
    mctx.beginPath();
    mctx.arc(px, py, 95, 0, Math.PI*2);
    mctx.fill();

    // 등불(K키)이 켜져 있을 때 전방 부채꼴(Cone) 영역 깎기 (길이 280, 각도 60도로 확장)
    if (this.player.isIlluminating) {
      const coneLength = 280;
      const fov = Math.PI / 3; // 60도 부채꼴
      const centerAngle = this.player.direction === 1 ? 0 : Math.PI;
      
      const angle1 = centerAngle - fov;
      const angle2 = centerAngle + fov;
      
      mctx.beginPath();
      mctx.moveTo(px, py);
      // 부채꼴 호 계산
      mctx.arc(px, py, coneLength, angle1, angle2);
      mctx.closePath();
      
      // 부채꼴 안쪽부터 바깥쪽으로 부드럽게 감쇄하는 그라디언트 깎기
      const coneRadGrad = mctx.createRadialGradient(px, py, 15, px + Math.cos(centerAngle) * coneLength * 0.7, py, coneLength);
      coneRadGrad.addColorStop(0, 'rgba(0,0,0,1)');
      coneRadGrad.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = coneRadGrad;
      mctx.fill();
    }
    mctx.restore();
    
    // 마스크를 메인 캔버스 위에 덮기
    ctx.drawImage(maskCanvas, 0, 0);
    
    // 등불 불빛 빔의 경계선 부근에 은은한 주황색 광배 효과 채색 (Double composite)
    if (this.player.isIlluminating) {
      const px = this.player.x + this.player.width/2 - this.cameraX;
      const py = this.player.y + 24;
      const coneLength = 280;
      const fov = Math.PI / 3;
      const centerAngle = this.player.direction === 1 ? 0 : Math.PI;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen'; // 빛 합성
      
      const beamGrad = ctx.createRadialGradient(px, py, 10, px, py, coneLength);
      // 의혹의 피빛이 짙어질수록 빔도 살짝 스산한 자줏빛 오렌지로
      const beamColor = doubtRatio > 0.6 ? 'rgba(235, 75, 45, 0.25)' : 'rgba(212, 175, 55, 0.22)';
      beamGrad.addColorStop(0, beamColor);
      beamGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.12)');
      beamGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, coneLength, centerAngle - fov, centerAngle + fov);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  // 상단 캐릭터 HUD 채색
  drawHUD() {
    const ctx = this.ctx;
    ctx.save();
    
    // 1. 체력바 (HP Bar)
    const hx = 24;
    const hy = 24;
    const hw = 180;
    const hh = 14;
    
    // 체력 배경 프레임 (유리 질감)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = '#22232c';
    ctx.lineWidth = 1;
    ctx.fillRect(hx, hy, hw, hh);
    ctx.strokeRect(hx, hy, hw, hh);
    
    // 체력 빨간 충전
    const hpRatio = this.player.hp / this.player.maxHp;
    ctx.fillStyle = hpRatio > 0.3 ? '#8a1a1a' : '#ff1133';
    ctx.fillRect(hx + 1, hy + 1, (hw - 2) * hpRatio, hh - 2);
    
    // 폰트 설정 (이단심문관 이름 헤르만)
    ctx.fillStyle = '#fff';
    ctx.font = '10px Inter';
    ctx.fillText('INQUISITOR HERMANN', hx, hy - 6);
    ctx.fillStyle = '#e2e2e8';
    ctx.fillText(`HP: ${Math.round(this.player.hp)}`, hx + 6, hy + 11);

    // 2. 의혹도/죄책감이 극심할 때 화면 외곽에 퍼지는 스산한 적혈색 비네트
    const totalVal = this.faith + this.doubt;
    if (totalVal > 0) {
      const doubtRatio = this.doubt / totalVal;
      if (doubtRatio > 0.4) {
        const vignOpacity = (doubtRatio - 0.4) * 1.6; // 최대 0.9
        const grad = ctx.createRadialGradient(
          this.canvas.width/2, this.canvas.height/2, this.canvas.width/3,
          this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(138, 26, 26, ${vignOpacity * 0.45})`);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    // 3. 골 목표물 종탑 안내 텍스트 비주얼
    if (this.player.x > 1850) {
      ctx.fillStyle = '#d4af37';
      ctx.font = '13px Cinzel';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(212,175,55,0.7)';
      ctx.fillText('종탑에 도달하여 신념의 심판을 완수하십시오', this.canvas.width/2, 80);
      ctx.font = '9px Inter';
      ctx.fillStyle = '#fff';
      ctx.fillText('(종 앞쪽에서 [J] 성검 타격 또는 [K] 등불 조사를 입력하세요)', this.canvas.width/2, 98);
    }

    // 4. [보스 체력 게이지 비주얼]: 보스가 생존해 있고 플레이어가 보스 결전 구역(x > 1500)에 진입한 경우
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss && !boss.isDead && this.player.x > 1500) {
      const bx = this.canvas.width / 2 - 160;
      const by = 30;
      const bw = 320;
      const bh = 12;
      
      // 보스 체력바 유리 배경틀
      ctx.fillStyle = 'rgba(10, 10, 15, 0.75)';
      ctx.strokeStyle = '#a62b2b';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      
      // 보스 체력 충전
      const bossRatio = boss.hp / boss.maxHp;
      ctx.fillStyle = '#ff1133';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3333';
      ctx.fillRect(bx + 1, by + 1, (bw - 2) * bossRatio, bh - 2);
      ctx.shadowBlur = 0; // 초기화
      
      // 보스 명칭 및 레이블 렌더링
      ctx.fillStyle = '#ff3333';
      ctx.font = '11px Cinzel';
      ctx.textAlign = 'center';
      ctx.fillText('심연의 군주 : 그림자 티탄 (SHADOW TITAN)', this.canvas.width / 2, by - 8);
    }
    
    ctx.restore();
  }
}
