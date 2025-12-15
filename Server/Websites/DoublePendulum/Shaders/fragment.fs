precision mediump float;

uniform vec2 resolution;
uniform float time;

varying vec3 vcolor;

void main() {
    gl_FragColor = vec4(vcolor, 1.0);
}