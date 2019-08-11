export class App {

    private gl: WebGLRenderingContext;
    private glInfoNode: HTMLElement;

    private lastRenderTime = 0;
    private collectedFrameDuration = 0;
    private collectedFrameCount = 0;

    constructor() { }

    public run(): void {
        const canvas = document.getElementById(
            'glCanvas'
        ) as HTMLCanvasElement;
        this.gl = canvas.getContext('webgl')
            || canvas.getContext('experimental-webgl');
        this.glInfoNode = document.getElementById('glInfo');
        this.render(0);
    }

    private render(elapsedTime: number): void {
        const deltaTime = elapsedTime - this.lastRenderTime;
        this.lastRenderTime = elapsedTime;
        this.updateFps(deltaTime);
        this.draw(deltaTime, elapsedTime);
        requestAnimationFrame(this.render.bind(this));
    }

    private updateFps(deltaTime: number): void {
        this.collectedFrameDuration += deltaTime;
        this.collectedFrameCount++;
        if (this.collectedFrameCount >= 10) {
            const fps = Math.ceil(
                1000.0 * this.collectedFrameCount / this.collectedFrameDuration
            );
            if (isNaN(fps) == false || fps < 1000) {
                this.glInfoNode.innerHTML = "FPS: " + fps;
            }
            this.collectedFrameCount = 0;
            this.collectedFrameDuration = 0;
        }
    }

    private draw(deltaTime: number, elapsedTime: number): void {
        this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

}
