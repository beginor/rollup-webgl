export class App {

    private gl: WebGLRenderingContext;
    private glInfoNode: HTMLElement;

    private glProgram: WebGLProgram;
    private buffer: WebGLBuffer;
    private vertexCount: number;
    private drawMode: number;

    private lastRenderTime = 0;
    private collectedFrameDuration = 0;
    private collectedFrameCount = 0;

    constructor() { }

    public run(): void {
        const canvas = document.getElementById('glCanvas') as HTMLCanvasElement;
        this.gl = canvas.getContext('webgl')
            || canvas.getContext('experimental-webgl');
        this.glInfoNode = document.getElementById('glInfo');
        const drawMode = document.getElementById('drawMode') as HTMLSelectElement;
        drawMode.addEventListener('change', (e) => {
            const mode = drawMode.value;
            this.changeDrawMode(mode);
        }, false);
        //
        this.glProgram = this.makeProgram();
        this.createTrianglesBuffer();
        this.render(0);
    }

    private createTrianglesBuffer() {
        const triangle = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,

            -0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0,
        ];
        this.buffer = this.createBuffer(triangle);
        this.vertexCount = 6;
        this.drawMode = this.gl.TRIANGLES;
    }

    private createTriangleStripBuffer() {
        const triangleStrip = [
            -0.5, -0.5, 0.0, // v1
            -0.5, 0.5, 0.0,  // v3
            0.5, -0.5, 0.0, // v2
            0.5, 0.5, 0.0, // v4
        ];
        this.buffer = this.createBuffer(triangleStrip);
        this.vertexCount = 4;
        this.drawMode = this.gl.TRIANGLE_STRIP;
    }

    private createTriangleFanBuffer() {
        const triangleFan = [];
        triangleFan.push(0);
        triangleFan.push(0);
        triangleFan.push(0);
        let vertexCount = 1;
        for (let angle = 0; angle <= 280; angle++) {
            const x = Math.cos(angle / 180 * 3.14);
            const y = Math.sin(angle / 180 * 3.14);
            const z = 0.0;
            triangleFan.push(x);
            triangleFan.push(y);
            triangleFan.push(z);
            vertexCount++;
        }
        this.buffer = this.createBuffer(triangleFan);
        this.vertexCount = vertexCount;
        this.drawMode = this.gl.TRIANGLE_FAN;
    }

    private createLinesBuffer() {
        const lines = [
            -0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,

            -0.5, 0.5, 0.0,
            0.5, 0.5, 0.0,

            0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,

            0.5, -0.5, 0.0,
            -0.5, -0.5, 0.0
        ];
        this.buffer = this.createBuffer(lines);
        this.vertexCount = 8;
        this.drawMode = this.gl.LINES;
    }

    private createLineStripBuffer() {
        const linestrip = [
            -0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, -0.5, 0.0
        ];
        this.buffer = this.createBuffer(linestrip);
        this.vertexCount = 5;
        this.drawMode = this.gl.LINE_STRIP;
    }

    private createLineLoopBuffer() {
        const lineLoop = [
            -0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, 0.5, 0.0,
            0.5, -0.5, 0.0
        ];
        this.buffer = this.createBuffer(lineLoop);
        this.vertexCount = 4;
        this.drawMode = this.gl.LINE_LOOP;
    }

    private createPointsBuffer() {
        const points = [
            -0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, 0.5, 0.0,
            0.5, -0.5, 0.0
        ];
        this.buffer = this.createBuffer(points);
        this.vertexCount = 4;
        this.drawMode = this.gl.POINTS;
    }

    private changeDrawMode(mode: string): void {
        switch (mode) {
            case 'triangles':
                this.createTrianglesBuffer();
                break;
            case 'triangle_strip':
                this.createTriangleStripBuffer();
                break;
            case 'triangle_fan':
                this.createTriangleFanBuffer();
                break;
            case 'lines':
                this.createLinesBuffer();
                break;
            case 'line_strip':
                this.createLineStripBuffer();
                break;
            case 'line_loop':
                this.createLineLoopBuffer();
                break;
            case 'points':
                this.createPointsBuffer();
                break;
        }
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
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        const position = this.gl.getAttribLocation(
            this.glProgram, 'position'
        );
        this.gl.enableVertexAttribArray(position);
        this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 4 * 3, 0);
        const elapsedTimeLoc = this.gl.getUniformLocation(this.glProgram, 'elapsedTime');
        this.gl.uniform1f(elapsedTimeLoc, elapsedTime);
        //
        this.gl.drawArrays(this.drawMode, 0, this.vertexCount);
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
                gl_PointSize = 4.0;
            }
        `;
        const vertShader = this.createShader(vertSource, this.gl.VERTEX_SHADER);
        const fragSource = `
            varying mediump vec4 fragColor;
            void main() {
                gl_FragColor = fragColor;
            }
        `;
        const fragShader = this.createShader(fragSource, this.gl.FRAGMENT_SHADER);
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

    private createShader(source: string, type: number): WebGLShader {
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

    private createBuffer(data: number[]): WebGLBuffer {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(data),
            this.gl.STATIC_DRAW
        );
        return buffer;
    }

}
