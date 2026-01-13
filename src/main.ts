import { Application, Assets, Text, Graphics, Container } from 'pixi.js';
import { SlotMachine } from './slot-machine';
import { Character } from './character';
import './style.css';

(async () => {
    // 1. 初始化 Pixi App（背景透明，讓 CSS 漸層背景顯示出來）
    const app = new Application();
    await app.init({ backgroundAlpha: 0, resizeTo: window });
    document.body.appendChild(app.canvas);

    // 2. 載入多種 slot 圖示資源
    const slotSymbols = [
        { alias: 'sym1', src: 'https://pixijs.com/assets/eggHead.png' },
        { alias: 'sym2', src: 'https://pixijs.com/assets/flowerTop.png' },
        { alias: 'sym3', src: 'https://pixijs.com/assets/helmlok.png' },
        { alias: 'sym4', src: 'https://pixijs.com/assets/skully.png' },
        { alias: 'character', src: 'https://pixijs.com/assets/bunny.png' }, // 小角色
    ];
    await Assets.load(slotSymbols);

    // 把載入的貼圖放進陣列
    const slotTextures = slotSymbols.slice(0, 4).map(s => Assets.get(s.alias));
    const characterTexture = Assets.get('character');

    // ---------------------------------------------------------
    // 3. 建立 3 軸老虎機 (Reels)
    // ---------------------------------------------------------
    const REEL_WIDTH = 160;  // 每一條的寬度
    const REEL_HEIGHT = 450; // 高度設高一點，讓它能顯示約 3 個圖示 (3x3)
    const REEL_GAP = 10;     // 軸與軸之間的間隙
    const REEL_COUNT = 3;
    const reels: SlotMachine[] = []; // 用陣列把 3 個滾輪存起來
    
    // 計算總尺寸
    const totalWidth = REEL_COUNT * REEL_WIDTH + (REEL_COUNT - 1) * REEL_GAP;
    const totalHeight = REEL_HEIGHT;

    const reelContainer = new Container(); // 做一個容器把這三個包起來，方便置中

    // 建立一個內容容器（會被 mask 裁切）
    const reelContent = new Container();
    reelContainer.addChild(reelContent);

    for (let i = 0; i < REEL_COUNT; i++) {
        // 建立一條滾輪，傳入多種貼圖
        const reel = new SlotMachine(slotTextures, REEL_WIDTH, REEL_HEIGHT);
        
        // 設定位置：
        // i=0 (左): x = 0
        // i=1 (中): x = 160 + 間距
        // i=2 (右): x = 320 + 間距
        reel.x = i * (REEL_WIDTH + REEL_GAP);
        reel.y = 0;

        // 存入陣列與容器
        reels.push(reel);
        reelContent.addChild(reel);
    }

    // 整體 Mask - 裁切所有超出的部分
    const reelMask = new Graphics()
        .rect(0, 0, totalWidth, totalHeight)
        .fill({ color: 0xffffff });
    reelContainer.addChild(reelMask);
    reelContent.mask = reelMask;

    app.stage.addChild(reelContainer);

    // ---------------------------------------------------------
    // 4. Glassmorphism 外框 ✨
    // ---------------------------------------------------------
    const PADDING = 20; // 玻璃框比內容大一點
    const RADIUS = 24;  // 圓角
    
    // 玻璃背景層（放在最下面）
    const glassBackground = new Graphics()
        .roundRect(-PADDING, -PADDING, totalWidth + PADDING * 2, totalHeight + PADDING * 2, RADIUS)
        .fill({ color: 0xffffff, alpha: 0.25 }); // 半透明白色
    reelContainer.addChildAt(glassBackground, 0); // 插入到最底層
    
    // 玻璃邊框（細細的白色邊）
    const glassBorder = new Graphics()
        .roundRect(-PADDING, -PADDING, totalWidth + PADDING * 2, totalHeight + PADDING * 2, RADIUS)
        .stroke({ width: 2, color: 0xffffff, alpha: 0.6 }); // 半透明白色邊框
    reelContainer.addChild(glassBorder);
    
    // 內部高光（上方的光澤感）
    const glassHighlight = new Graphics()
        .roundRect(-PADDING + 4, -PADDING + 4, totalWidth + PADDING * 2 - 8, (totalHeight + PADDING * 2) * 0.3, RADIUS - 2)
        .fill({ color: 0xffffff, alpha: 0.15 }); // 微微的高光
    reelContainer.addChild(glassHighlight);


    // ---------------------------------------------------------
    // 5. 建立按鈕（彩色玻璃風格）
    // ---------------------------------------------------------
    // 建立彩色玻璃按鈕的輔助函式
    function createGlassButton(text: string, glassColor: number, textColor: string) {
        const btn = new Container();
        
        // 彩色玻璃背景
        const bg = new Graphics()
            .roundRect(0, 0, 200, 80, 20)
            .fill({ color: glassColor, alpha: 0.35 });
        btn.addChild(bg);
        
        // 白色邊框
        const border = new Graphics()
            .roundRect(0, 0, 200, 80, 20)
            .stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
        btn.addChild(border);
        
        // 上方高光（玻璃光澤）
        const highlight = new Graphics()
            .roundRect(4, 4, 192, 28, 16)
            .fill({ color: 0xffffff, alpha: 0.3 });
        btn.addChild(highlight);
        
        // 文字
        const label = new Text({ 
            text, 
            style: { fontFamily: 'Arial', fontSize: 32, fill: textColor, fontWeight: 'bold' } 
        });
        label.anchor.set(0.5);
        label.x = 100; 
        label.y = 40;
        btn.addChild(label);
        
        btn.pivot.set(100, 40);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        
        return { container: btn, label };
    }

    // SPIN 按鈕（藍色玻璃）
    const { container: button, label: btnText } = createGlassButton('SPIN!', 0x3b82f6, '#ffffff');
    app.stage.addChild(button);

    // 必中按鈕（金色玻璃）🎯
    const { container: jackpotButton } = createGlassButton('🎯 必中！', 0xf59e0b, '#ffffff');
    app.stage.addChild(jackpotButton);

    // ---------------------------------------------------------
    // 6. 建立小角色 🏃
    // ---------------------------------------------------------
    const groundY = app.screen.height - 50; // 地面位置
    const player = new Character(characterTexture, groundY);
    player.x = 100; // 初始位置在左邊
    app.stage.addChild(player);

    // 操作提示
    const controlsHint = new Text({
        text: '🎮 ← → 移動 | Space 跳躍 | R 空中旋轉',
        style: { fontFamily: 'Arial', fontSize: 18, fill: '#666666' }
    });
    controlsHint.anchor.set(0.5, 1);
    app.stage.addChild(controlsHint);

    // ---------------------------------------------------------
    // 7. Resize 處理：視窗縮放時重新定位物件
    // ---------------------------------------------------------
    function onResize() {
        // 老虎機容器置中（用精確計算的尺寸）
        reelContainer.x = app.screen.width / 2 - totalWidth / 2;
        reelContainer.y = app.screen.height / 2 - totalHeight / 2 - 50;
        
        // 按鈕放在老虎機下方（兩個按鈕並排）
        button.x = app.screen.width / 2 - 110; // 左邊
        button.y = reelContainer.y + totalHeight + 80;
        
        jackpotButton.x = app.screen.width / 2 + 110; // 右邊
        jackpotButton.y = reelContainer.y + totalHeight + 80;
        
        // 操作提示放在底部
        controlsHint.x = app.screen.width / 2;
        controlsHint.y = app.screen.height - 10;
        
        // 更新角色的地面位置
        player.setGroundY(app.screen.height - 50);
    }

    // 初始化時先執行一次
    onResize();

    // 監聽 resize 事件
    window.addEventListener('resize', onResize);

    // ---------------------------------------------------------
    // 6. 互動邏輯
    // ---------------------------------------------------------
    let isSpinning = false;

    // SPIN 按鈕事件
    button.on('pointerdown', () => {
        button.scale.set(0.95);
        if (!isSpinning) {
            startAllReels();
        }
    });

    button.on('pointerup', () => {
        button.scale.set(1);
    });

    // 必中按鈕事件 🎯
    jackpotButton.on('pointerdown', () => {
        jackpotButton.scale.set(0.95);
        if (!isSpinning) {
            startAllReels(true); // 傳入 true 表示必中模式
        }
    });

    jackpotButton.on('pointerup', () => {
        jackpotButton.scale.set(1);
    });

    function startAllReels(forceWin: boolean = false) {
        isSpinning = true;
        btnText.text = 'Running...';

        // 如果是必中模式，隨機選一個圖案讓三軸都停在這個圖案
        const winIndex = forceWin ? Math.floor(Math.random() * slotTextures.length) : -1;

        // 啟動每一條滾輪
        reels.forEach((reel, index) => {
            // 小技巧：讓它們「依序」啟動，不要同時轉，看起來比較像真的
            setTimeout(() => {
                reel.startSpin(winIndex); // 傳入必中的圖案索引
            }, index * 200); // 每隔 0.2 秒啟動下一條
        });
    }

    // ---------------------------------------------------------
    // 9. 遊戲迴圈
    // ---------------------------------------------------------
    app.ticker.add((ticker) => {
        // 更新每一條滾輪
        reels.forEach(reel => {
            reel.update(ticker.deltaTime);
        });

        // 更新角色
        player.update(ticker.deltaTime);
        player.clampPosition(50, app.screen.width - 50); // 限制在畫面內

        // 只有在轉動中才需要判斷
        if (!isSpinning) return;

        // 檢查是否所有滾輪都進入 STOPPED 狀態（而非 IDLE、SPINNING、STOPPING）
        const allJustStopped = reels.every(reel => reel.state === 'STOPPED');

        // 如果全部都剛停下來，判斷是否中獎
        if (allJustStopped) {
            isSpinning = false;
            
            // 判斷三軸中間的圖示是否一樣
            const centerTextures = reels.map(reel => reel.getCenterTexture());
            const isWin = centerTextures.every(tex => tex === centerTextures[0]);
            
            if (isWin) {
                // 中獎！觸發所有滾輪的 WIN 特效
                btnText.text = '🎉 WINNER!';
                reels.forEach(reel => reel.triggerWin());
            } else {
                // 沒中獎，回到閒置狀態
                btnText.text = 'SPIN!';
                reels.forEach(reel => reel.setIdle());
            }
        }
    });
})();