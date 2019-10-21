import { mat4, vec3 } from 'gl-matrix';

declare type AsyncTexture = WebGLTexture & { ready: boolean; };
declare type VertexBuffer = WebGLBuffer & { vertexCount: number; };

export class App {

    private gl: WebGLRenderingContext;
    private canvasEl: HTMLCanvasElement;
    private infoEl: HTMLElement;

    private program: WebGLProgram;
    private buffer: VertexBuffer;
    private drawMode: number;
    private projectionMatrix: mat4;
    private cameraMatrix: mat4;
    private modelMatrix: mat4;
    private texture: AsyncTexture = { ready: false };

    private lastRenderTime = 0;
    private collectedFrameDuration = 0;
    private collectedFrameCount = 0;

    constructor() { }

    public run(): void {
        const canvas = document.getElementById('glCanvas') as HTMLCanvasElement;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this.canvasEl = canvas;
        this.gl = canvas.getContext('webgl');
        this.resizeCanvas(null);
        this.infoEl = document.getElementById('glInfo');
        //
        this.createTexture();
        this.program = this.makeProgram();
        this.createTriangleBuffer();
        this.createMatrix();
        this.render(0);
        addEventListener('resize', e => this.resizeCanvas(e));
    }

    private resizeCanvas(e: Event): void {
        if (!this.gl) {
            return;
        }
        this.canvasEl.width = this.canvasEl.clientWidth;
        this.canvasEl.height = this.canvasEl.clientHeight;
        this.gl.viewport(0, 0, this.canvasEl.width, this.canvasEl.height);
        if (!this.projectionMatrix) {
            return;
        }
        mat4.perspective(
            this.projectionMatrix,
            90 / 180.0 * Math.PI,
            this.canvasEl.width / this.canvasEl.height,
            0.1,
            1000
        );
    }

    private createMatrix(): void {
        this.projectionMatrix = mat4.create();
        mat4.perspective(
            this.projectionMatrix,
            90 / 180.0 * Math.PI,
            this.canvasEl.width / this.canvasEl.height,
            0.1,
            1000
        );
        this.cameraMatrix = mat4.create();
        mat4.lookAt(
            this.cameraMatrix,
            vec3.fromValues(0,0,1),
            vec3.fromValues(0,0,0),
            vec3.fromValues(0,1,0)
        );
        this.modelMatrix = mat4.create();
    }

    private createTriangleBuffer(): void {
        const triangle = [
            // Z轴上的平面
            -0.5,   0.5,    0.5,  0, 0, 1,  0, 0,
            -0.5,   -0.5,   0.5,  0, 0, 1,  0, 1,
            0.5,    -0.5,   0.5,  0, 0, 1,  1, 1,
            0.5,    -0.5,   0.5,  0, 0, 1,  1, 1,
            0.5,    0.5,    0.5,  0, 0, 1,  1, 0,
            -0.5,   0.5,    0.5,  0, 0, 1,  0, 0,
            -0.5,   0.5,    -0.5, 0, 0, -1, 0, 0,
            -0.5,   -0.5,   -0.5, 0, 0, -1, 0, 1,
            0.5,    -0.5,   -0.5, 0, 0, -1, 1, 1,
            0.5,    -0.5,   -0.5, 0, 0, -1, 1, 1,
            0.5,    0.5,    -0.5, 0, 0, -1, 1, 0,
            -0.5,   0.5,    -0.5, 0, 0, -1, 0, 0,
            // X轴上的平面
            0.5,    -0.5,   0.5,  1, 0, 0,  0, 0,
            0.5,    -0.5,   -0.5, 1, 0, 0,  0, 1,
            0.5,    0.5,    -0.5, 1, 0, 0,  1, 1,
            0.5,    0.5,    -0.5, 1, 0, 0,  1, 1,
            0.5,    0.5,    0.5,  1, 0, 0,  1, 0,
            0.5,    -0.5,   0.5,  1, 0, 0,  0, 0,
            -0.5,   -0.5,   0.5,  -1, 0, 0, 0, 0,
            -0.5,   -0.5,   -0.5, -1, 0, 0, 0, 1,
            -0.5,   0.5,    -0.5, -1, 0, 0, 1, 1,
            -0.5,   0.5,    -0.5, -1, 0, 0, 1, 1,
            -0.5,   0.5,    0.5,  -1, 0, 0, 1, 0,
            -0.5,   -0.5,   0.5,  -1, 0, 0, 0, 0,
            // Y轴上的平面
            -0.5,   0.5,    0.5,  0, 1, 0,  0, 0,
            -0.5,   0.5,    -0.5, 0, 1, 0,  0, 1,
            0.5,    0.5,    -0.5, 0, 1, 0,  1, 1,
            0.5,    0.5,    -0.5, 0, 1, 0,  1, 1,
            0.5,    0.5,    0.5,  0, 1, 0,  1, 0,
            -0.5,   0.5,    0.5,  0, 1, 0,  0, 0,
            -0.5,   -0.5,   0.5,  0, -1, 0, 0, 0,
            -0.5,   -0.5,   -0.5, 0, -1, 0, 0, 1,
            0.5,    -0.5,   -0.5, 0, -1, 0, 1, 1,
            0.5,    -0.5,   -0.5, 0, -1, 0, 1, 1,
            0.5,    -0.5,   0.5,  0, -1, 0, 1, 0,
            -0.5,   -0.5,   0.5,  0, -1, 0, 0, 0,
        ];
        this.buffer = this.createBuffer(triangle, 6 * 6);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
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
                this.infoEl.innerHTML = "FPS: " + fps;
            }
            this.collectedFrameCount = 0;
            this.collectedFrameDuration = 0;
        }
    }

    private draw(deltaTime: number, elapsedTime: number): void {
        this.gl.viewport(0, 0, this.canvasEl.width, this.canvasEl.height);
        this.gl.clearColor(0.2, 0.2, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        //
        this.gl.useProgram(this.program);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        //
        const positionLoc = this.gl.getAttribLocation(
            this.program,
            'position'
        );
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(
            positionLoc,
            3,
            this.gl.FLOAT,
            false,
            4 * 8,
            0
        );
        //
        const normalLoc = this.gl.getAttribLocation(this.program, 'normal');
        this.gl.enableVertexAttribArray(normalLoc);
        this.gl.vertexAttribPointer(
            normalLoc,
            3,
            this.gl.FLOAT,
            false,
            4 * 8,
            4 * 3
        );
        // uv
        const uvLoc = this.gl.getAttribLocation(this.program, 'uv');
        this.gl.enableVertexAttribArray(uvLoc);
        this.gl.vertexAttribPointer(
            uvLoc,
            2,
            this.gl.FLOAT,
            false,
            4 * 8,
            4 * 6
        );
        //
        const elapsedTimeUniformLoc = this.gl.getUniformLocation(
            this.program,
            'elapsedTime'
        );
        this.gl.uniform1f(elapsedTimeUniformLoc, elapsedTime);
        //
        const lightDirection = vec3.fromValues(0, -1, 0);
        const lightDirectionLoc = this.gl.getUniformLocation(
            this.program,
            'lightDirection'
        );
        this.gl.uniform3fv(lightDirectionLoc, lightDirection);
        //
        const varyingFactor = (Math.sin(elapsedTime / 1000.0) + 1) / 2.0;
        mat4.lookAt(
            this.cameraMatrix,
            vec3.fromValues(0, 0, 2 * (varyingFactor + 1)),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0)
        );
        // setup model
        let rotateMatrix = mat4.create();
        mat4.rotate(
            rotateMatrix,
            rotateMatrix,
            varyingFactor * Math.PI * 2,
            vec3.fromValues(1, 1, 1)
        );
        let translateMatrix = mat4.create();
        mat4.translate(
            translateMatrix,
            translateMatrix,
            vec3.fromValues(0, 0, -0.5)
        );
        mat4.multiply(this.modelMatrix, translateMatrix, rotateMatrix);
        // set matrix to shader.
        const projectionUniformLoc = this.gl.getUniformLocation(
            this.program,
            'projectionMatrix'
        );
        this.gl.uniformMatrix4fv(
            projectionUniformLoc,
            false,
            this.projectionMatrix
        );
        //
        const cameraUniformLoc = this.gl.getUniformLocation(
            this.program,
            'cameraMatrix'
        );
        this.gl.uniformMatrix4fv(
            cameraUniformLoc,
            false,
            this.cameraMatrix
        );
        //  model
        let modelUniformLoc = this.gl.getUniformLocation(
            this.program,
            'modelMatrix'
        );
        this.gl.uniformMatrix4fv(modelUniformLoc, false, this.modelMatrix);
        // normal
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, this.modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        const normalMatrixLoc = this.gl.getUniformLocation(
            this.program,
            'normalMatrix'
        );
        this.gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix);
        // texture
        if (this.texture.ready) {
            const textureLoc = this.gl.getUniformLocation(
                this.program,
                'texture'
            );
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(textureLoc, 0);
        }
        //
        this.gl.drawArrays(this.drawMode, 0, this.buffer.vertexCount);
    }

    private makeProgram(): WebGLProgram {
        const program = this.gl.createProgram();
        const vertSource = `
            attribute vec4 position;
            attribute vec3 normal;
            attribute vec2 uv;

            varying vec3 fragNormal;
            varying vec2 fragUV;

            uniform float elapsedTime;
            uniform mat4 projectionMatrix;
            uniform mat4 cameraMatrix;
            uniform mat4 modelMatrix;
            void main() {
                fragNormal = normal;
                fragUV = uv;
                gl_Position = projectionMatrix * cameraMatrix * modelMatrix * position;
            }
        `;
        const vertShader = this.createShader(vertSource, this.gl.VERTEX_SHADER);
        const fragSource = `
            precision highp float;

            varying vec3 fragNormal;
            varying vec2 fragUV;

            uniform float elapsedTime;
            uniform vec3 lightDirection;
            uniform mat4 normalMatrix;

            uniform sampler2D texture;

            void main(void) {
                vec3 normalizedLightDirection = normalize(-lightDirection);
                vec3 transformedNormal = normalize((normalMatrix * vec4(fragNormal, 1.0)).xyz);

                float diffuseStrength = dot(normalizedLightDirection, transformedNormal);
                diffuseStrength = clamp(diffuseStrength, 0.0, 1.0);
                vec3 diffuse = vec3(diffuseStrength);

                vec3 ambient = vec3(0.3);

                vec4 finalLightStrength = vec4(ambient + diffuse, 1.0);
                vec4 materialColor = texture2D(texture, fragUV);

                gl_FragColor = finalLightStrength * materialColor;
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

    private createBuffer(data: number[], vertexCount: number): VertexBuffer {
        const buffer = this.gl.createBuffer() as VertexBuffer;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(data),
            this.gl.STATIC_DRAW
        );
        buffer.vertexCount = vertexCount;
        return buffer;
    }

    private createTexture(): void {
        this.texture = this.gl.createTexture() as AsyncTexture;
        const image = new Image();
        // image.crossOrigin = '';
        image.onload = (e) => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.texture.ready = true;
        };
        image.src = './assets/wood.png';
    }

}
