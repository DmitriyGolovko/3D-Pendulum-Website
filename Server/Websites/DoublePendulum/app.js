
let isplaying = true;
let speed = 1.0;

let result;
let coefficients;
let constants;

let framerate = 30;
let time = 0;
let dt = 0.00028;
//Repeating the solution derivation several times
//larger timesteps increase the volitality of the 3d double pendulum but small timesteps are slow in real time.
//So the adhoc solution is to just repeat the integrals solutions multiple times to achieve an expensive but beautiful
//simulation of a 3d pendulum.
let repeats = 200;

let lambda = 0.0000001;
//Lambda parameter for ridge regression. The higher the value the more stability at the cost of accurate solutions.

//Initial energy found at start.
let E0;

let l1 = 50 / 30;
let l2 = 50 / 30;
let m1 = 50 / 200;
let m2 = 50 / 200;

let g = 1;

let phi1;
let phi2;
let theta1;
let theta2;

let dphi1;
let dphi2;
let dtheta1;
let dtheta2;

//Pendulum origin.
let porigin = { x: 0, y: 5.0, z: 0 };

//This function will be called once webgl completes the compilation of shaders and creates the program.
function start() {
    objects.push(createTubeObject('l1', 8, 0.0, 0.0, 1.0));
    objects[0].position = porigin;

    objects.push(createSphereObject('m1', 16, 1.0, 0.0, 0.0));

    objects.push(createTubeObject('l2', 8, 0.0, 0.0, 1.0));
    objects.push(createSphereObject('m2', 16, 1.0, 0.0, 0.0));
}

function update() {
    objects[0].scale = { x: 0.05, y: 0.05, z: l1 };
    objects[0].rotation = { x: 0, y: theta1, z: phi1 };
    objects[1].position = { x: l1 * Math.sin(theta1) * Math.cos(phi1) + porigin.x, y: l1 * Math.sin(theta1) * Math.sin(phi1) + porigin.y, z: l1 * Math.cos(theta1) + porigin.z };
    objects[1].scale = { x: m1, y: m1, z: m1 };

    objects[2].scale = { x: 0.05, y: 0.05, z: l2 };
    objects[2].position = { x: l1 * Math.sin(theta1) * Math.cos(phi1) + porigin.x, y: l1 * Math.sin(theta1) * Math.sin(phi1) + porigin.y, z: l1 * Math.cos(theta1) + porigin.z };
    objects[2].rotation = { x: 0, y: theta2, z: phi2 };

    objects[3].position = { x: l2 * Math.sin(theta2) * Math.cos(phi2) + objects[1].position.x, y: l2 * Math.sin(theta2) * Math.sin(phi2) + objects[1].position.y, z: l2 * Math.cos(theta2) + objects[1].position.z };
    objects[3].scale = { x: m2, y: m2, z: m2 };

    let state = [phi1, dphi1, phi2, dphi2, theta1, dtheta1, theta2, dtheta2];

    for (let i = 0; i < repeats; i++) {

        //Coefficients for second order variables
        coefficients = [
            [ //LP1
                1.0 * Math.pow(l1, 2) * (m1 + m2) * Math.pow(Math.sin(theta1), 2),                //ddphi1
                1.0 * l1 * l2 * m2 * Math.sin(theta1) * Math.sin(theta2) * Math.cos(phi1 - phi2), //ddphi2
                0.0,                                                                              //ddtheta1
                -1.0 * l1 * l2 * m2 * Math.sin(phi1 - phi2) * Math.sin(theta1) * Math.cos(theta2) //ddtheta2
            ],
            [ //LP2
                1.0 * l1 * l2 * m2 * Math.sin(theta1) * Math.sin(theta2) * Math.cos(phi1 - phi2),
                1.0 * Math.pow(l2, 2) * m2 * Math.pow(Math.sin(theta2), 2),
                1.0 * l1 * l2 * m2 * Math.sin(phi1 - phi2) * Math.sin(theta2) * Math.cos(theta1),
                0.0
            ],
            [ //LT1
                0.0,
                1.0 * l1 * l2 * m2 * Math.sin(phi1 - phi2) * Math.sin(theta2) * Math.cos(theta1),
                1.0 * Math.pow(l1, 2) * (m1 + m2),
                1.0 * l1 * l2 * m2 * (Math.sin(theta1) * Math.sin(theta2) + Math.cos(phi1 - phi2) * Math.cos(theta1) * Math.cos(theta2))
            ],
            [ //LT2
                -1.0 * l1 * l2 * m2 * Math.sin(phi1 - phi2) * Math.sin(theta1) * Math.cos(theta2),
                0.0,
                1.0 * l1 * l2 * m2 * (Math.sin(theta1) * Math.sin(theta2) + Math.cos(phi1 - phi2) * Math.cos(theta1) * Math.cos(theta2)),
                1.0 * Math.pow(l2, 2) * m2,
            ]];

        constants = [ //LP1 LP2 LT1 LT2
            -l1 * (2.0 * dphi1 * dtheta1 * l1 * m1 * Math.cos(theta1) + 2.0 * dphi1 * dtheta1 * l1 * m2 * Math.cos(theta1) + 1.0 * Math.pow(dphi2, 2) * l2 * m2 * Math.sin(phi1 - phi2) * Math.sin(theta2) + 2.0 * dphi2 * dtheta2 * l2 * m2 * Math.cos(phi1 - phi2) * Math.cos(theta2) + 1.0 * Math.pow(dtheta2, 2) * l2 * m2 * Math.sin(phi1 - phi2) * Math.sin(theta2)) * Math.sin(theta1),
            l2 * m2 * (1.0 * Math.pow(dphi1, 2) * l1 * Math.sin(phi1 - phi2) * Math.sin(theta1) - 2.0 * dphi1 * dtheta1 * l1 * Math.cos(phi1 - phi2) * Math.cos(theta1) - 2.0 * dphi2 * dtheta2 * l2 * Math.cos(theta2) + 1.0 * Math.pow(dtheta1, 2) * l1 * Math.sin(phi1 - phi2) * Math.sin(theta1)) * Math.sin(theta2),
            l1 * (1.0 * Math.pow(dphi1, 2) * l1 * m1 * Math.sin(theta1) * Math.cos(theta1) + 1.0 * Math.pow(dphi1, 2) * l1 * m2 * Math.sin(theta1) * Math.cos(theta1) + 1.0 * Math.pow(dphi2, 2) * l2 * m2 * Math.sin(theta2) * Math.cos(phi1 - phi2) * Math.cos(theta1) - 2.0 * dphi2 * dtheta2 * l2 * m2 * Math.sin(phi1 - phi2) * Math.cos(theta1) * Math.cos(theta2) - 1.0 * Math.pow(dtheta2, 2) * l2 * m2 * Math.sin(theta1) * Math.cos(theta2) + 1.0 * Math.pow(dtheta2, 2) * l2 * m2 * Math.sin(theta2) * Math.cos(phi1 - phi2) * Math.cos(theta1) + 1.0 * g * m1 * Math.sin(theta1) + 1.0 * g * m2 * Math.sin(theta1)),
            l2 * m2 * (1.0 * Math.pow(dphi1, 2) * l1 * Math.sin(theta1) * Math.cos(phi1 - phi2) * Math.cos(theta2) + 2.0 * dphi1 * dtheta1 * l1 * Math.sin(phi1 - phi2) * Math.cos(theta1) * Math.cos(theta2) + 1.0 * Math.pow(dphi2, 2) * l2 * Math.sin(theta2) * Math.cos(theta2) + 1.0 * Math.pow(dtheta1, 2) * l1 * Math.sin(theta1) * Math.cos(phi1 - phi2) * Math.cos(theta2) - 1.0 * Math.pow(dtheta1, 2) * l1 * Math.sin(theta2) * Math.cos(theta1) + 1.0 * g * Math.sin(theta2))
        ]

        //Normalizing phi angles
        phi1 = ((phi1 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        phi2 = ((phi2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        //Tihikonov's regularization method.
        let result = math.multiply(math.transpose(coefficients), coefficients);
        result = math.add(result, math.multiply(lambda, math.identity(4)));
        result = math.inv(result);
        result = math.multiply(result, math.transpose(coefficients));
        result = math.multiply(result, constants).toArray();

        state = rk4StepWithFixedAccel(state, result, dt);

        [phi1, dphi1, phi2, dphi2, theta1, dtheta1, theta2, dtheta2] = state;
    }

    console.log('Total Energy:', calculateEnergy())
}

//Return total energy of state
function calculateEnergy() {
    return g * l1 * m1 * Math.cos(theta1) + g * m2 * (l1 * Math.cos(theta1) + l2 * Math.cos(theta2))
        + 0.5 * Math.pow(l1, 2) * m1 * (Math.pow(dphi1, 2) * Math.pow(Math.sin(theta1), 2) + Math.pow(dtheta1, 2))
        + 0.5 * m2 * (Math.pow(dphi1, 2) * Math.pow(l1, 2) * Math.pow(Math.sin(theta1), 2)
            + 2 * dphi1 * dphi2 * l1 * l2 * Math.sin(theta1) * Math.sin(theta2) * Math.cos(phi1 - phi2)
            - 2 * dphi1 * dtheta2 * l1 * l2 * Math.sin(phi1 - phi2) * Math.sin(theta1) * Math.cos(theta2)
            + Math.pow(dphi2, 2) * Math.pow(l2, 2) * Math.pow(Math.sin(theta2), 2)
            + 2 * dphi2 * dtheta1 * l1 * l2 * Math.sin(phi1 - phi2) * Math.sin(theta2) * Math.cos(theta1)
            + Math.pow(dtheta1, 2) * Math.pow(l1, 2) + 2 * dtheta1 * dtheta2 * l1 * l2 * Math.sin(theta1) * Math.sin(theta2)
            + 2 * dtheta1 * dtheta2 * l1 * l2 * Math.cos(phi1 - phi2) * Math.cos(theta1) * Math.cos(theta2) + Math.pow(dtheta2, 2) * Math.pow(l2, 2));
}

// Helper functions for LU decomposition and solve
// LU decomposition with partial pivoting (returns {LU, P})
function luDecompose(A) {
    const n = A.length;
    // Deep copy of A, and permutation vector
    let LU = A.map(row => row.slice());
    let P = Array.from({ length: n }, (_, i) => i);
    for (let k = 0; k < n; ++k) {
        // Pivot: find max element in column k at or below row k
        let p = k, maxA = Math.abs(LU[k][k]);
        for (let i = k + 1; i < n; ++i) {
            if (Math.abs(LU[i][k]) > maxA) {
                maxA = Math.abs(LU[i][k]);
                p = i;
            }
        }
        if (p !== k) {
            // Swap rows in LU and permutation vector
            [LU[p], LU[k]] = [LU[k], LU[p]];
            [P[p], P[k]] = [P[k], P[p]];
        }
        // LU Decomposition
        for (let i = k + 1; i < n; ++i) {
            if (LU[k][k] === 0) throw new Error('Singular matrix');
            LU[i][k] /= LU[k][k];
            for (let j = k + 1; j < n; ++j) {
                LU[i][j] -= LU[i][k] * LU[k][j];
            }
        }
    }
    return { LU, P };
}

// Solves A x = b using LU decomposition
function luSolve(A, b) {
    const n = A.length;
    const { LU, P } = luDecompose(A);
    // Apply permutation to b
    let Pb = P.map(i => b[i]);
    // Forward substitution to solve L y = Pb
    let y = Array(n);
    for (let i = 0; i < n; ++i) {
        y[i] = Pb[i];
        for (let j = 0; j < i; ++j)
            y[i] -= LU[i][j] * y[j];
    }
    // Backward substitution to solve U x = y
    let x = Array(n);
    for (let i = n - 1; i >= 0; --i) {
        x[i] = y[i];
        for (let j = i + 1; j < n; ++j)
            x[i] -= LU[i][j] * x[j];
        x[i] /= LU[i][i];
    }
    return x;
}

function rk4StepWithFixedAccel(state, result, dt) {
    // Derivatives based on state and given accelerations (assumed constant at k1)
    function derivatives(s, acc) {
        return [
            s[1],      // d(phi1)/dt = dphi1
            acc[0],    // d(dphi1)/dt = ddphi1 (fixed)
            s[3],      // d(phi2)/dt = dphi2
            acc[1],    // d(dphi2)/dt = ddphi2 (fixed)
            s[5],      // d(theta1)/dt = dtheta1
            acc[2],    // d(dtheta1)/dt = ddtheta1 (fixed)
            s[7],      // d(theta2)/dt = dtheta2
            acc[3]     // d(dtheta2)/dt = ddtheta2 (fixed)
        ];
    }

    // k1
    let k1 = derivatives(state, result).map(v => v * dt);

    // For k2, k3, k4, use the same acceleration vector 'result'
    let state2 = state.map((v, i) => v + k1[i] / 2);
    let k2 = derivatives(state2, result).map(v => v * dt);

    let state3 = state.map((v, i) => v + k2[i] / 2);
    let k3 = derivatives(state3, result).map(v => v * dt);

    let state4 = state.map((v, i) => v + k3[i]);
    let k4 = derivatives(state4, result).map(v => v * dt);

    // Combine increments
    let newState = state.map((v, i) => v + (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);

    return newState;
}

//Set all the values at the default.
reset();

//Toggles the simulation
function pauseplay() {
    isplaying = !isplaying;
}

//Reset the simulation and start the values at the initial set by user.
function reset() {
    console.clear();
    textboxes = document.querySelectorAll('input[type="text"]');

    for (box of textboxes) {
        value = parseFloat(box.value);

        if (Number.isNaN(value)) {
            document.querySelector('.textbox-error-message').innerHTML = `${box.id} not a float value.`;
            console.error(`${box.id} not a float value.`);
            continue;
        }

        switch (box.id) {
            case 'phi1i-textbox':
                phi1 = value
                break;
            case 'phi2i-textbox':
                phi2 = value
                break;
            case 'dphi1i-textbox':
                dphi1 = value
                break;
            case 'dphi2i-textbox':
                dphi2 = value;
                break;
            case 'theta1i-textbox':
                theta1 = value;
                break;
            case 'theta2i-textbox':
                theta2 = value;
                break;
            case 'dtheta1i-textbox':
                dtheta1 = value;
                break;
            case 'dtheta2i-textbox':
                dtheta2 = value;
                break;
        }
    }

    E0 = calculateEnergy();
}

//From the html document, updates the corresponding slider value.
function updateSliderValue(variable, value) {
    value = parseFloat(value);

    if (Number.isNaN(value)) return;

    switch (variable) {
        case 'l1':
            l1 = value / 30;
            break;
        case 'l2':
            l2 = value / 30;
            break;
        case 'm1':
            m1 = value / 200;
            break;
        case 'm2':
            m2 = value / 200;
            break;
    }
}