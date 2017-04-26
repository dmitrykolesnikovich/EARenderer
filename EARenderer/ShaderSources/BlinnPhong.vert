#version 400

layout (location = 0) in vec4 iPosition;
layout (location = 1) in vec3 iTexCoords;
layout (location = 2) in vec3 iNormal;

uniform mat4 uViewProjectionMat;
uniform mat4 uModelMat;
uniform mat4 uNormalMat;

uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;

out vec3 oNormal;
out vec3 oToLight;
out vec3 oToCamera;
out vec3 oTexCoords;

void main() {
    vec4 worldPosition = uModelMat * iPosition;
    
    // Flip texture Y coordinate
    oTexCoords = vec3(iTexCoords.s, 1.0 - iTexCoords.t, iTexCoords.r);
    oNormal = normalize(uNormalMat * vec4(iNormal, 0.0)).xyz;
    oToLight = normalize(uLightPosition - worldPosition.xyz);
    oToCamera = normalize(uCameraPosition - worldPosition.xyz);
    
    gl_Position = uViewProjectionMat * worldPosition;
}
