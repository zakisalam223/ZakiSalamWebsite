
uniform vec3 lightPosition;
uniform vec3 viewPosition;
uniform float ambientStrength;
uniform float specularStrength;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vFragPos;

uniform float time;
uniform vec3 color;
uniform vec3 fogColor;

void main() {

  vec3 patternColor = vec3(0.0, 0.0, 0.0);

  float pattern = sin(dot(vFragPos, vec3(1.5, 2.0, 1.0)) + time * 2.0);
  pattern = pattern * 0.5;
  patternColor += pattern * 0.3;

  vec3 newColor = mix(patternColor, color, 0.7);

  vec3 ambient = ambientStrength * newColor;

  // diffuse
  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(lightPosition - vFragPos);
  float diff = max(dot(norm, lightDir), 0.0);
  vec3 diffuse = diff * newColor;

  // specular
  vec3 viewDir = normalize(viewPosition - vFragPos);
  vec3 reflectDir = reflect(-lightDir, norm);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specular = specularStrength * spec * vec3(1.0);

  // fog for distant objs
  float depth = length(vFragPos - viewPosition);
  float fog = smoothstep(20.0, 40.0, depth);

  vec3 result = ambient + diffuse + specular;

  // mix scene color with fog
  result = mix(result, fogColor, fog);

  gl_FragColor = vec4(result, 1.0);
}