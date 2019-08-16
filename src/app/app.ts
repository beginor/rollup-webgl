import { mat4, vec3 } from 'gl-matrix';

export class App {

    private gl: WebGLRenderingContext;
    private glNode: HTMLCanvasElement;
    private glInfoNode: HTMLElement;

    private glProgram: WebGLProgram;
    private buffer: WebGLBuffer;
    private vertexCount: number;
    private drawMode: number;
    private perspectiveProjectionMatrix: mat4;
    private cameraMatrix: mat4;
    private model1Matrix: mat4;
    private model2Matrix: mat4;

    private lastRenderTime = 0;
    private collectedFrameDuration = 0;
    private collectedFrameCount = 0;

    constructor() { }

    public run(): void {
        const canvas = document.getElementById('glCanvas') as HTMLCanvasElement;
        this.glNode = canvas;
        this.gl = canvas.getContext('webgl')
            || canvas.getContext('experimental-webgl');
        this.glInfoNode = document.getElementById('glInfo');
        //
        this.glProgram = this.makeProgram();
        this.createTriangleBuffer();
        this.createMatrix();
        this.render(0);
    }

    private createMatrix(): void {
        const projection = mat4.create();
        mat4.perspective(
            projection,
            80.0 / 180 * Math.PI,
            this.glNode.width / this.glNode.height,
            0.1,
            1000
        );
        this.perspectiveProjectionMatrix = projection;
        const camera = mat4.create();
        mat4.lookAt(
            camera,
            vec3.fromValues(0, 0, 2),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0)
        );
        this.cameraMatrix = camera;
        this.model1Matrix = mat4.create();
        this.model2Matrix = mat4.create();
    }

    private createTriangleBuffer(): void {
        const triangle = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0
        ];
        this.buffer = this.createBuffer(triangle);
        this.vertexCount = 6;
        this.drawMode = this.gl.TRIANGLES;
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
        // // rotate with time
        // const rotateMatrix = mat4.create();
        // mat4.rotate(rotateMatrix, rotateMatrix, elapsedTime / 1000.0, vec3.fromValues(0, 1, 0));
        // // translate matrix
        // var translateMatrix = mat4.create();
        // mat4.translate(translateMatrix, translateMatrix, vec3.fromValues(0, 0, -1));
        // // final transform
        // const transform = mat4.create();
        // mat4.multiply(transform, translateMatrix, rotateMatrix);
        // mat4.multiply(transform, this.perspectiveProjectionMatrix, transform);
        const varyingFactor = (Math.sin(elapsedTime / 1000.0) + 1) / 2.0;
        mat4.lookAt(
            this.cameraMatrix,
            vec3.fromValues(0, 0, 2 * (varyingFactor + 1)),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0)
        );
        // setup model1
        let rotateMatrix = mat4.create();
        mat4.rotate(
            rotateMatrix,
            rotateMatrix,
            varyingFactor * Math.PI * 2,
            vec3.fromValues(0, 1, 0)
        );
        let translateMatrix = mat4.create();
        mat4.translate(
            translateMatrix,
            translateMatrix,
            vec3.fromValues(-0.7, 0, 0)
        );
        mat4.multiply(this.model1Matrix, translateMatrix, rotateMatrix);
        // setup model2
        rotateMatrix = mat4.create();
        mat4.rotate(
            rotateMatrix,
            rotateMatrix,
            varyingFactor * Math.PI * 2,
            vec3.fromValues(0, 0, 1)
        );
        translateMatrix = mat4.create();
        mat4.translate(
            translateMatrix,
            translateMatrix,
            vec3.fromValues(0.7, 0, 0)
        );
        mat4.multiply(this.model2Matrix, translateMatrix, rotateMatrix);
        // set matrix to shader.
        const projectionUniformLoc = this.gl.getUniformLocation(this.glProgram, 'projectionMatrix');
        this.gl.uniformMatrix4fv(projectionUniformLoc, false, this.perspectiveProjectionMatrix);
        const cameraUniformLoc = this.gl.getUniformLocation(this.glProgram, 'cameraMatrix');
        this.gl.uniformMatrix4fv(cameraUniformLoc, false, this.cameraMatrix);
        // draw model1
        let modelUniformLoc = this.gl.getUniformLocation(this.glProgram, 'modelMatrix');
        this.gl.uniformMatrix4fv(modelUniformLoc, false, this.model1Matrix);
        this.gl.drawArrays(this.drawMode, 0, this.vertexCount);
        // draw model2
        modelUniformLoc = this.gl.getUniformLocation(this.glProgram, 'modelMatrix');
        this.gl.uniformMatrix4fv(modelUniformLoc, false, this.model2Matrix);
        this.gl.drawArrays(this.drawMode, 0, this.vertexCount);
    }

    private makeProgram(): WebGLProgram {
        const program = this.gl.createProgram();
        const vertSource = `
            attribute vec4 position;
            varying vec4 fragColor;
            uniform float elapsedTime;
            uniform mat4 projectionMatrix;
            uniform mat4 cameraMatrix;
            uniform mat4 modelMatrix;
            void main() {
                fragColor = position * 0.5 + 0.5;
                gl_Position = projectionMatrix * cameraMatrix * modelMatrix * position;
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
