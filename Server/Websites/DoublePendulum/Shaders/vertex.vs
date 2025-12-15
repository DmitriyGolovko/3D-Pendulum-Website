precision mediump float;

attribute vec3 position;
attribute vec3 color;

uniform mat4 model;
uniform mat4 view;
uniform mat4 perspective;

varying vec3 vcolor;

void main() {
    vcolor = color;
    gl_Position = perspective * view * model * vec4(position, 1.0);
}