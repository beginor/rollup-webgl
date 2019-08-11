export class App {

    private gl: WebGLRenderingContext;
    private glInfoNode: HTMLElement;

    private glProgram: WebGLProgram;
    private glBuffer: WebGLBuffer;

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
        //
        this.glProgram = this.makeProgram();
        this.glBuffer = this.makeBuffer();
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
        // this.gl.viewport(0, 0, this.glCanvasNode.width, this.glCanvasNode.height);
        this.gl.clearColor(1.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        //
        this.gl.useProgram(this.glProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
        const position = this.gl.getAttribLocation(
            this.glProgram, 'position'
        );
        this.gl.enableVertexAttribArray(position);
        this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 4 * 3, 0);
        const elapsedTimeLoc = this.gl.getUniformLocation(this.glProgram, 'elapsedTime');
        this.gl.uniform1f(elapsedTimeLoc, elapsedTime);
        //
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    private makeProgram(): WebGLProgram {
        const program = this.gl.createProgram();
        const vertSource = `
            attribute vec4 position;
            varying vec4 fragColor;
            uniform float elapsedTime;
            void main() {
                fragColor = position * 0.5 + 0.5;
                float rotateAngle = elapsedTime * 0.001;
                float x = position.x * cos(rotateAngle) - position.y * sin(rotateAngle);
                float y = position.x * sin(rotateAngle) + position.y * cos(rotateAngle);
                gl_Position = vec4(x, y, 0.0, 1.0);
            }
        `;
        const vertShader = this.makeShader(vertSource, this.gl.VERTEX_SHADER);
        const fragSource = `
            varying mediump vec4 fragColor;
            void main() {
                gl_FragColor = fragColor;
            }
        `;
        const fragShader = this.makeShader(fragSource, this.gl.FRAGMENT_SHADER);
        this.gl.attachShader(program, vertShader);
        this.gl.attachShader(program, fragShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(
                'Error init shader program ' + this.gl.getProgramInfoLog(program)
            );
            return null;
        }
        return program;
    }

    private makeShader(source: string, type: number): WebGLShader {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            this.gl.deleteShader(shader);
            console.log(
                'Error compile shader ' + this.gl.getShaderInfoLog(shader)
            );
            return null;
        }
        return shader;
    }

    private makeBuffer(): WebGLBuffer {
        const triangle = [
            0.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
        ];
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(triangle),
            this.gl.STATIC_DRAW
        );
        return buffer;
    }

}
