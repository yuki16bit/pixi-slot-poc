import { Container, Sprite, Texture, Graphics } from 'pixi.js';

export class SlotMachine extends Container {
    private symbols: Sprite[] = [];
    private symbolSize: number;
    private reelHeight: number;
    private textures: Texture[];
    
    public state: 'IDLE' | 'SPINNING' | 'STOPPING' | 'STOPPED' | 'WIN' = 'IDLE';
    private speed: number = 0;
    private spinTime: number = 0;
    private minSpinTime: number = 60; // 最少轉 60 幀（約 1 秒）
    private forceWinIndex: number = -1; // -1 表示不作弊，>=0 表示要停在指定的貼圖
    
    constructor(textures: Texture[], width: number, height: number) {
        super();
        
        this.textures = textures;
        this.reelHeight = height;
        this.symbolSize = width; // 每個圖示的高度 = 寬度（正方形）
        
        // 計算需要幾個圖示才能填滿高度（多加幾個做緩衝）
        const symbolCount = Math.ceil(height / this.symbolSize) + 2;
        
        // 建立圖示容器（這個會被 mask 裁切）
        const symbolContainer = new Container();
        this.addChild(symbolContainer);
        
        // 建立多個圖示 Sprite
        for (let i = 0; i < symbolCount; i++) {
            // 隨機選一個貼圖
            const texture = textures[Math.floor(Math.random() * textures.length)];
            const symbol = new Sprite(texture);
            
            // 設定大小和位置
            symbol.width = this.symbolSize * 0.9;  // 留點邊距
            symbol.height = this.symbolSize * 0.9;
            symbol.anchor.set(0.5);
            symbol.x = width / 2;
            symbol.y = i * this.symbolSize + this.symbolSize / 2;
            
            this.symbols.push(symbol);
            symbolContainer.addChild(symbol);
        }
        
        // 建立 Mask（裁切超出的部分）
        const mask = new Graphics()
            .rect(0, 0, width, height)
            .fill({ color: 0xffffff });
        this.addChild(mask);
        symbolContainer.mask = mask;
    }

    public startSpin(forceWinIndex: number = -1) {
        if (this.state === 'IDLE' || this.state === 'WIN' || this.state === 'STOPPED') {
            this.state = 'SPINNING';
            this.speed = 30 + Math.random() * 10; // 隨機初始速度
            this.spinTime = 0;
            this.forceWinIndex = forceWinIndex; // 設定作弊目標
            
            // 重設所有圖示的縮放
            this.symbols.forEach(s => s.scale.set(1));
        }
    }

    public update(deltaTime: number) {
        if (this.state === 'SPINNING') {
            this.spinTime += deltaTime;
            this.moveSymbols(deltaTime);
            
            // 轉夠久後，隨機停下
            if (this.spinTime > this.minSpinTime && Math.random() < 0.02) {
                this.state = 'STOPPING';
            }
        } 
        else if (this.state === 'STOPPING') {
            this.moveSymbols(deltaTime);
            this.speed *= 0.96; // 摩擦力減速
            
            if (this.speed < 0.5) {
                this.snapToGrid(); // 對齊格子
                this.state = 'STOPPED'; // 先進入停止狀態，等外部判斷是否中獎
            }
        }
        else if (this.state === 'WIN') {
            // 中獎搖晃效果（縮放而非旋轉，避免超出 mask）
            const pulse = 1 + Math.sin(Date.now() / 100) * 0.05;
            this.symbols.forEach(s => s.scale.set(pulse));
        }
    }

    private moveSymbols(deltaTime: number) {
        this.symbols.forEach(symbol => {
            symbol.y += this.speed * deltaTime;
            
            // 如果圖示移出底部，把它搬到最上面並換圖
            if (symbol.y > this.reelHeight + this.symbolSize / 2) {
                symbol.y -= this.symbols.length * this.symbolSize;
                // 換一個隨機貼圖
                symbol.texture = this.textures[Math.floor(Math.random() * this.textures.length)];
            }
        });
    }

    // 停下時對齊格子
    private snapToGrid() {
        const centerY = this.reelHeight / 2;
        
        // 如果有指定必中的圖案
        if (this.forceWinIndex >= 0) {
            // 找到最接近中心的圖示
            let closestSymbol = this.symbols[0];
            let closestDist = Math.abs(closestSymbol.y - centerY);
            
            this.symbols.forEach(s => {
                const dist = Math.abs(s.y - centerY);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestSymbol = s;
                }
            });
            
            // 強制換成指定的貼圖
            closestSymbol.texture = this.textures[this.forceWinIndex];
            
            // 對齊格子
            const offset = centerY - closestSymbol.y;
            this.symbols.forEach(s => s.y += offset);
            
            // 重設作弊標記
            this.forceWinIndex = -1;
        } else {
            // 正常流程：找到最接近中心的圖示，然後調整所有圖示位置
            let closestSymbol = this.symbols[0];
            let closestDist = Math.abs(closestSymbol.y - centerY);
            
            this.symbols.forEach(s => {
                const dist = Math.abs(s.y - centerY);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestSymbol = s;
                }
            });
            
            // 計算需要調整的偏移量
            const offset = centerY - closestSymbol.y;
            this.symbols.forEach(s => s.y += offset);
        }
    }

    // 獲取中間圖示的貼圖（用於判斷中獎）
    public getCenterTexture(): Texture {
        const centerY = this.reelHeight / 2;
        let closestSymbol = this.symbols[0];
        let closestDist = Math.abs(closestSymbol.y - centerY);
        
        this.symbols.forEach(s => {
            const dist = Math.abs(s.y - centerY);
            if (dist < closestDist) {
                closestDist = dist;
                closestSymbol = s;
            }
        });
        
        return closestSymbol.texture;
    }

    // 外部呼叫：觸發中獎特效
    public triggerWin() {
        this.state = 'WIN';
    }

    // 外部呼叫：回到閒置狀態（沒中獎）
    public setIdle() {
        this.state = 'IDLE';
    }
}
