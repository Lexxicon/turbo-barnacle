
precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float stime;

attribute float id;
attribute vec3 position;
attribute vec2 offset;
attribute vec3 color;

varying vec3 _color;

void main() {
  vec3 vPosition = position;
  _color = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(offset, id * 0.01) + vPosition, 1.0 );
}
