let canvas = document.querySelector('.graphics-canvas');
let gl = canvas.getContext('webgl');

//object={position={x,y,z}, rotation={x,y,z}, scale={x,y,z}, id,
// vertex_array, element_array, vertexid, elementid}
//
//vertexid and elementid point to a buffer (buffer id).
let objects = [];
initialize();

//#region Object Functions

//r, g, b values from 0.0-1.0
function createTubeObject(id, points, r, g, b) {
    let vertex_array = [];
    let element_array = [];

    for (let j = 0; j < 2; j++) {
        for (let i = 0; i < points; i++) {
            vertex_array.push(Math.cos(2 * Math.PI / points * i));
            vertex_array.push(Math.sin(2 * Math.PI / points * i));
            vertex_array.push(j);

            vertex_array.push(r, g, b);
        }
    }

    for (let i = 0; i < points - 1; i++) {
        element_array.push(i);
        element_array.push(points + i);
        element_array.push(points + i + 1);

        element_array.push(i);
        element_array.push(points + i + 1);
        element_array.push(i + 1);
    }

    element_array.push(points - 1);
    element_array.push(2 * points - 1);
    element_array.push(points);

    element_array.push(points - 1);
    element_array.push(points);
    element_array.push(0);

    let vertexid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexid);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_array), gl.STATIC_DRAW);

    let elementid = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementid);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(element_array), gl.STATIC_DRAW);

    return {
        position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, id: id,
        vertex_array: vertex_array, element_array: element_array, vertexid: vertexid, elementid: elementid
    };
}

function createSphereObject(id, points, r, g, b) {
    // `points` is used as both latitude and longitude segments for a roughly even mesh.
    let vertex_array = [];
    let element_array = [];

    const radius = 1; // or parameterize as needed

    // Latitude and longitude subdivision
    const latBands = points;
    const longBands = points;

    // Vertex positions
    for (let lat = 0; lat <= latBands; lat++) {
        let theta = lat * Math.PI / latBands; // 0...PI
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longBands; lon++) {
            let phi = lon * 2 * Math.PI / longBands; // 0...2PI
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = radius * cosPhi * sinTheta;
            let y = radius * sinPhi * sinTheta;
            let z = radius * cosTheta;

            vertex_array.push(x, y, z, r, g, b);
        }
    }

    // Indices (elements)
    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            let first = (lat * (longBands + 1)) + lon;
            let second = first + longBands + 1;

            // two triangles for each quad
            element_array.push(first, second, first + 1);
            element_array.push(second, second + 1, first + 1);
        }
    }

    let vertexid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexid);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_array), gl.STATIC_DRAW);

    let elementid = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementid);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(element_array), gl.STATIC_DRAW);

    return {
        position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1},
        id: id,
        vertex_array: vertex_array,
        element_array: element_array,
        vertexid: vertexid,
        elementid: elementid
    };
}

function createTriangle() {
    let vertex_array = [-0.5, -0.5, 0.0, 0.0, 0.5, 0.0, 0.5, -0.5, 0.0];

    let element_array = [0, 1, 2];

    let vertexid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexid);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_array), gl.STATIC_DRAW);

    let elementid = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementid);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(element_array), gl.STATIC_DRAW);

    return { vertex_array: vertex_array, element_array: element_array, vertexid: vertexid, elementid: elementid };
}

//#endregion

//#region Opengl Functions

const program = gl.createProgram();

window.onresize = resize;

function resize() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(program, 'resolution'), canvas.width, canvas.height);
}

async function initialize() {
    const vertex_source = await fetch('DoublePendulum/Shaders/vertex.vs').then(response => response.text()).catch((err) => console.err(err));
    const fragment_source = await fetch('DoublePendulum/Shaders/fragment.fs').then(response => response.text()).catch((err) => console.err(err));

    let vertex_shader = createShader(gl.VERTEX_SHADER, vertex_source);
    let fragment_shader = createShader(gl.FRAGMENT_SHADER, fragment_source);

    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking failed:', gl.getProgramInfoLog(program));
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    resize();

    start();

    //Setup the perspective, it will be the same throughout the simulation.
    let perspective_matrix = createPerspectiveMatrix(Math.PI / 2 - 0.1, canvas.width / canvas.height, 0.1, 100.0);
    let perspective_loc = gl.getUniformLocation(program, 'perspective')
    gl.uniformMatrix4fv(perspective_loc, false, perspective_matrix);

    //A simple view matrix that orients the camera such that z is up.
    const viewZUp = new Float32Array([
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1
    ]);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'view'), false, viewZUp);

    setInterval(() => {
        requestAnimationFrame(drawFrame);
    }, 1000 / framerate);
}

function drawFrame() {
    time += 1 / framerate;
    gl.uniform1f(gl.getUniformLocation(program, 'time'), time);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (obj of objects) {
        const scaleMat = createScalingMatrix(obj.scale.x, obj.scale.y, obj.scale.z);
        const yrotateMat = createRotationYMatrix(obj.rotation.y);
        const zrotateMat = createRotationZMatrix(obj.rotation.z);
        const translateMat = createTranslationMatrix(obj.position.x, obj.position.y, obj.position.z);

        const transformMat = multiplyMatrices(scaleMat, multiplyMatrices(yrotateMat, multiplyMatrices(zrotateMat, translateMat)));

        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'model'), false, transformMat);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexid);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.elementid);

        let position = gl.getAttribLocation(program, 'position')
        gl.vertexAttribPointer(position, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(position);

        let color = gl.getAttribLocation(program, 'color')
        gl.vertexAttribPointer(color, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(color);

        gl.drawElements(gl.TRIANGLES, obj.element_array.length, gl.UNSIGNED_SHORT, 0);
    }

    update(1 / framerate);
}

function createShader(shader_type, shader_source) {
    let shader = gl.createShader(shader_type);
    gl.shaderSource(shader, shader_source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed: Source: ', shader_source, gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

//#endregion

//#region Matrices

function createPerspectiveMatrix(fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);

    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;

    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;

    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;

    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;

    return out;
}

function yrotationMatrix(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const out = new Float32Array(16);

    out[0] = c; out[1] = 0; out[2] = -s; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = s; out[9] = 0; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;

    return out;
}

function multiplyMatrices(a, b) {
    const out = new Float32Array(16);
    for (let row = 0; row < 4; ++row) {
        for (let col = 0; col < 4; ++col) {
            let sum = 0;
            for (let i = 0; i < 4; ++i) {
                sum += a[row * 4 + i] * b[i * 4 + col];
            }
            out[row * 4 + col] = sum;
        }
    }
    return out;
}

// Create a 4x4 identity matrix
function createIdentityMatrix() {
    const out = new Float32Array(16);
    for (let i = 0; i < 16; i++) {
        out[i] = (i % 5 === 0) ? 1 : 0;  // 1 at indices 0,5,10,15
    }
    return out;
}

// Create a translation matrix for translating by (x, y, z)
function createTranslationMatrix(x, y, z) {
    const out = createIdentityMatrix();
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
}

// Create a scaling matrix for scaling by (sx, sy, sz)
function createScalingMatrix(sx, sy, sz) {
    const out = createIdentityMatrix();
    out[0] = sx;
    out[5] = sy;
    out[10] = sz;
    return out;
}

// Create a rotation matrix around the Z axis by angle in radians
function createRotationZMatrix(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const out = createIdentityMatrix();
    out[0] = c;
    out[1] = s;
    out[4] = -s;
    out[5] = c;
    return out;
}

function createRotationYMatrix(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return new Float32Array([
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    ]);
}

function createRotationXMatrix(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return new Float32Array([
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    ]);
}

//Modified such that up is z, x is right, and y is towards the camera.
//More useful for physics.
function modifiedPerspectiveMatrix(
    fovYRadians, // field of view (vertical/"look") in radians
    aspect,      // width/height
    near,        // near clip (distance along +Y)
    far          // far clip (distance along +Y)
) {
    const f = 1.0 / Math.tan(fovYRadians / 2);
    const rangeInv = 1.0 / (far - near);

    // Notice:
    // - The "1" is moved to [6] (row 2, col 3, in column-major order)
    // - The Y and Z axes are swapped compared to the standard perspective matrix
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, 0, f, 0,
        0, (far + near) * rangeInv, 0, -1,
        0, 2 * far * near * rangeInv, 0, 0
    ]);
}

//#endregion

//vec1 x vec2
function crossProduct(vec1, vec2) {
    return { x: vec1.y * vec2.z - vec1.z * vec2.y, y: vec1.z * vec2.x - vec1.x * vec2.z, z: vec1.x * vec2.y - vec1.y * vec2.x };
}