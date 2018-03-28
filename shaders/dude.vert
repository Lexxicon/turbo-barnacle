
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
  float f = sin(time + id);
  vec3 vPosition = position + vec3(f * 0.1, f * 0.1, 0.0);
  _color = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(offset,  0.0) + vPosition, 1.0 );
}
