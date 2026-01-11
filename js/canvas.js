function updateTexture(textureCtx, textureEl, pointerTrail, params) {
    textureCtx.fillStyle = 'black';
    textureCtx.fillRect(0, 0, textureEl.width, textureEl.height);

    pointerTrail.forEach((p, pIdx) => {
        if (pIdx === 0) {
            p.x = mouse.x;
            p.y = mouse.y;
        } else {
            p.vx += (pointerTrail[pIdx - 1].x - p.x) * params.tail.spring;
            p.vx *= params.tail.friction;

            p.vy += (pointerTrail[pIdx - 1].y - p.y) * params.tail.spring;
            p.vy *= params.tail.friction;
            p.vy += params.tail.gravity;

            p.x += p.vx;
            p.y += p.vy;
        }

        const grd = textureCtx.createRadialGradient(p.x, p.y, p.r * p.bordered, p.x, p.y, p.r);
        grd.addColorStop(0, 'rgba(255, 255, 255, ' + p.opacity + ')');
        grd.addColorStop(1, 'rgba(255, 255, 255, 0)');

        textureCtx.beginPath();
        textureCtx.fillStyle = grd;
        textureCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        textureCtx.fill();
    });
}

function resizeCanvas(canvasEl, textureEl, gl, uniforms, pointerTrail, params, devicePixelRatio) {
    const dotSize = (i) => params.size * window.innerHeight * (1. - .2 * Math.pow(3. * i / params.tail.dotsNumber - 1., 2.));

    canvasEl.width = window.innerWidth * devicePixelRatio;
    canvasEl.height = window.innerHeight * devicePixelRatio;
    textureEl.width = window.innerWidth;
    textureEl.height = window.innerHeight;
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
    gl.uniform1f(uniforms.u_ratio, canvasEl.width / canvasEl.height);

    for (let i = 0; i < params.tail.dotsNumber; i++) {
        pointerTrail[i].r = dotSize(i);
    }
}