import { Spine } from '@esotericsoftware/spine-pixi-v8';

/**
 * SpineCheerleader - 封裝 Spine 角色的動畫控制
 * 
 * Spineboy 可用的動畫（實際驗證過）：
 * - idle: 待機（循環）
 * - walk: 走路（循環）
 * - run: 跑步（循環）
 * - jump: 跳躍（單次）
 * - shoot: 射擊（單次）
 * - death: 死亡（單次，較長）
 * - aim: 瞄準
 * - portal: 穿越傳送門
 * - hoverboard: 滑板
 */
export class SpineCheerleader {
    public spine: Spine;
    private currentAnimation: string = '';

    constructor(spine: Spine) {
        this.spine = spine;
        
        // 設定動畫過渡時間（讓動畫切換更順滑）
        this.spine.state.data.defaultMix = 0.2;
        
        // 啟用自動更新
        this.spine.autoUpdate = true;
        
        // 初始播放待機動畫
        this.idle();
    }

    /** 待機動畫（循環） */
    public idle(): void {
        if (this.currentAnimation === 'idle') return;
        this.currentAnimation = 'idle';
        this.spine.state.setAnimation(0, 'idle', true);
    }

    /** 歡呼動畫（跳躍，播放一次後回到待機） */
    public cheer(): void {
        if (this.currentAnimation === 'jump') return;
        this.currentAnimation = 'jump';
        this.spine.state.setAnimation(0, 'jump', false);
        this.spine.state.addAnimation(0, 'idle', true, 0);
    }

    /** 慶祝動畫（跑步 + 射擊，循環） */
    public celebrate(): void {
        if (this.currentAnimation === 'celebrate') return;
        this.currentAnimation = 'celebrate';
        // 先播放跳躍
        this.spine.state.setAnimation(0, 'jump', false);
        // 跳完後持續跑步（表示興奮）
        this.spine.state.addAnimation(0, 'run', true, 0);
    }

    /** 失望動畫（shoot 表示無奈嘆氣，播放一次後回到待機） */
    public disappointed(): void {
        if (this.currentAnimation === 'shoot') return;
        this.currentAnimation = 'shoot';
        this.spine.state.setAnimation(0, 'shoot', false);
        this.spine.state.addAnimation(0, 'idle', true, 0);
    }

    /** 設定位置 */
    public setPosition(x: number, y: number): void {
        this.spine.x = x;
        this.spine.y = y;
    }

    /** 設定縮放 */
    public setScale(scale: number): void {
        this.spine.scale.set(scale);
    }

    /** 水平翻轉（面向左/右） */
    public setFacingLeft(facingLeft: boolean): void {
        this.spine.scale.x = facingLeft ? -Math.abs(this.spine.scale.x) : Math.abs(this.spine.scale.x);
    }
}
