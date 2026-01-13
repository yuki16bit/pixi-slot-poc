import { Container, Sprite, Texture } from 'pixi.js';

export class Character extends Container {
    private sprite: Sprite;
    
    // 物理狀態
    private velocityX: number = 0;
    private velocityY: number = 0;
    private groundY: number = 0; // 地面 Y 座標
    private isJumping: boolean = false;
    
    // Y 軸旋轉狀態
    private isSpinning: boolean = false;
    private spinProgress: number = 0; // 0 ~ 1
    private readonly SPIN_SPEED = 0.08; // 旋轉速度
    private facingRight: boolean = true; // 記住面向方向
    
    // 控制參數
    private readonly SPEED = 8;
    private readonly JUMP_FORCE = 18;
    private readonly GRAVITY = 0.8;
    private readonly FRICTION = 0.85;
    
    // 鍵盤狀態
    private keys: { [key: string]: boolean } = {};
    
    constructor(texture: Texture, groundY: number) {
        super();
        
        this.groundY = groundY;
        
        // 建立角色 Sprite
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 1); // 腳底為錨點
        this.sprite.scale.set(2); // 適中大小
        this.addChild(this.sprite);
        
        // 設定初始位置
        this.y = groundY;
        
        // 綁定鍵盤事件
        this.setupKeyboard();
    }
    
    private setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 空白鍵跳躍
            if (e.code === 'Space' && !this.isJumping) {
                this.jump();
            }
            
            // R 鍵：空中 Y 軸旋轉
            if (e.code === 'KeyR' && this.isJumping && !this.isSpinning) {
                this.startSpin();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    private jump() {
        this.isJumping = true;
        this.velocityY = -this.JUMP_FORCE;
    }
    
    private startSpin() {
        this.isSpinning = true;
        this.spinProgress = 0;
    }
    
    public update(deltaTime: number) {
        // 左右移動（旋轉中不能改變方向）
        if (!this.isSpinning) {
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.velocityX = -this.SPEED;
                this.facingRight = false;
            }
            if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.velocityX = this.SPEED;
                this.facingRight = true;
            }
        }
        
        // 套用摩擦力
        this.velocityX *= this.FRICTION;
        
        // 套用重力
        this.velocityY += this.GRAVITY;
        
        // 更新位置
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // 地面碰撞檢測
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
            this.isSpinning = false; // 落地時停止旋轉
            this.spinProgress = 0;
        }
        
        // Y 軸旋轉效果（按 R 鍵觸發）
        if (this.isSpinning) {
            this.spinProgress += this.SPIN_SPEED * deltaTime;
            
            // 用 cos 來模擬 Y 軸旋轉的視覺效果
            // cos(0) = 1, cos(π) = -1, cos(2π) = 1
            const scaleX = Math.cos(this.spinProgress * Math.PI * 2) * 2; // 2 是基礎 scale
            this.sprite.scale.x = scaleX;
            
            // 旋轉完成（一圈）
            if (this.spinProgress >= 1) {
                this.isSpinning = false;
                this.spinProgress = 0;
                // 恢復面向方向
                this.sprite.scale.x = this.facingRight ? 2 : -2;
            }
        } else {
            // 正常狀態：根據面向方向設定 scale.x
            this.sprite.scale.x = this.facingRight ? 2 : -2;
        }
    }
    
    // 設定邊界（防止走出畫面）
    public clampPosition(minX: number, maxX: number) {
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
    }

    // 更新地面位置（resize 時呼叫）
    public setGroundY(y: number) {
        this.groundY = y;
        if (this.y > y) this.y = y;
    }
}
