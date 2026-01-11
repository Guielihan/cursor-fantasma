const canvasEl = document.querySelector("#ghost");

const mouseThreshold = .1;
const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

const mouse = {
    x: .25 * window.innerWidth,
    y: .8 * window.innerHeight,
    tX: .25 * window.innerWidth,
    tY: .8 * window.innerHeight,
    moving: false,
    controlsPadding: 0
}

const params = {
    size: .1,
    tail: {
        dotsNumber: 25,
        spring: 1.4,
        friction: .3,
        gravity: 0,
    },
    smile: 1,
    mainColor: [.98, .96, .96],
    borderColor: [.2, .5, .7],
    isFlatColor: false,
};

const textureEl = document.createElement("canvas");
const textureCtx = textureEl.getContext("2d");
const pointerTrail = new Array(params.tail.dotsNumber);
let dotSize = (i) => params.size * window.innerHeight * (1. - .2 * Math.pow(3. * i / params.tail.dotsNumber - 1., 2.));

for (let i = 0; i < params.tail.dotsNumber; i++) {
    pointerTrail[i] = {
        x: mouse.x,
        y: mouse.y,
        vx: 0,
        vy: 0,
        opacity: .04 + .3 * Math.pow(1 - i / params.tail.dotsNumber, 4),
        bordered: .6 * Math.pow(1 - i / pointerTrail.length, 1),
        r: dotSize(i)
    }
}

let uniforms;
const shaderResult = initShader(canvasEl, textureEl);
const gl = shaderResult.gl;
uniforms = shaderResult.uniforms;

gl.uniform1f(uniforms.u_size, params.size);
gl.uniform3f(uniforms.u_main_color, params.mainColor[0], params.mainColor[1], params.mainColor[2]);
gl.uniform3f(uniforms.u_border_color, params.borderColor[0], params.borderColor[1], params.borderColor[2]);

createControls();

window.addEventListener("resize", () => resizeCanvas(canvasEl, textureEl, gl, uniforms, pointerTrail, params, devicePixelRatio));
resizeCanvas(canvasEl, textureEl, gl, uniforms, pointerTrail, params, devicePixelRatio);
render();

window.addEventListener("mousemove", e => {
    updateMousePosition(e.clientX, e.clientY);
});
window.addEventListener("touchmove", e => {
    updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
});
window.addEventListener("click", e => {
    updateMousePosition(e.clientX, e.clientY);
});

let movingTimer = setTimeout(() => mouse.moving = false, 300);

function updateMousePosition(eX, eY) {
    mouse.moving = true;
    if (mouse.controlsPadding < 0) {
        mouse.moving = false;
    }
    clearTimeout(movingTimer);
    movingTimer = setTimeout(() => {
        mouse.moving = false;
    }, 300);

    mouse.tX = eX;

    const size = params.size * window.innerHeight;
    eY -= .6 * size;
    mouse.tY = eY > size ? eY : size;
    mouse.tY -= mouse.controlsPadding;
}

function render() {
    const currentTime = performance.now();
    gl.uniform1f(uniforms.u_time, currentTime);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (mouse.moving) {
        params.smile -= .05;
        params.smile = Math.max(params.smile, -.1);
        params.tail.gravity -= 10 * params.size;
        params.tail.gravity = Math.max(params.tail.gravity, 0);
    } else {
        params.smile += .01;
        params.smile = Math.min(params.smile, 1);
        if (params.tail.gravity > 25 * params.size) {
            params.tail.gravity = (25 + 5 * (1 + Math.sin(.002 * currentTime))) * params.size;
        } else {
            params.tail.gravity += params.size;
        }
    }

    mouse.x += (mouse.tX - mouse.x) * mouseThreshold;
    mouse.y += (mouse.tY - mouse.y) * mouseThreshold;

    gl.uniform1f(uniforms.u_smile, params.smile);
    gl.uniform2f(uniforms.u_pointer, mouse.x / window.innerWidth, 1. - mouse.y / window.innerHeight);
    gl.uniform2f(uniforms.u_target_pointer, mouse.tX / window.innerWidth, 1. - mouse.tY / window.innerHeight);

    updateTexture(textureCtx, textureEl, pointerTrail, params);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureEl);
    requestAnimationFrame(render);
}

function createControls() {
    const gui = new lil.GUI();
    gui.close();
    gui.add(params, "size", .02, .3, .01)
        .onChange(v => {
            for (let i = 0; i < params.tail.dotsNumber; i++) {
                pointerTrail[i].r = dotSize(i);
            }
            gl.uniform1f(uniforms.u_size, params.size);
        });
    gui.addColor(params, "mainColor").onChange(v => {
        gl.uniform3f(uniforms.u_main_color, v[0], v[1], v[2]);
    });
    const borderColorControl = gui.addColor(params, "borderColor").onChange(v => {
        gl.uniform3f(uniforms.u_border_color, v[0], v[1], v[2]);
    });
    gui.add(params, "isFlatColor")
        .onFinishChange(v => {
            borderColorControl.disable(v);
            gl.uniform1f(uniforms.u_flat_color, v ? 1 : 0);
        });

    const controlsEl = document.querySelector(".lil-gui");
    controlsEl.addEventListener("mouseenter", () => {
        mouse.controlsPadding = -controlsEl.getBoundingClientRect().height;
    });
    controlsEl.addEventListener("mouseleave", () => {
        mouse.controlsPadding = 0;
    });
}