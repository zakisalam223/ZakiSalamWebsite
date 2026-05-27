uniform float time;
uniform float morphSpeed;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vFragPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec3 newPosition = position;
  newPosition.z += sin(position.x * 3.0 + time * morphSpeed) * 0.2;

  vFragPos = vec3(modelMatrix * vec4(newPosition, 1.0));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}