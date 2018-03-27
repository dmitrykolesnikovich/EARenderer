#version 400 core

// Constants

const float Y00 = 0.28209479177387814347f; // 1 / (2*sqrt(pi))
const float Y11 = 0.48860251190291992159f; // sqrt(3 /(4pi))
const float Y10 = Y11;
const float Y1_1 = Y11;
const float Y21 = 1.09254843059207907054f; // 1 / (2*sqrt(pi))
const float Y2_1 = Y21;
const float Y2_2 = Y21;
const float Y20 = 0.31539156525252000603f; // 1/4 * sqrt(5/pi)
const float Y22 = 0.54627421529603953527f; // 1/4 * sqrt(15/pi)

// Output

out vec4 oFragColor;

// Input

in vec3 vTexCoords;

// Uniforms

uniform int uProbesPerGridDimensionCount;

uniform samplerBuffer uProjectionClusterSphericalHarmonics;
uniform usamplerBuffer uProjectionClusterIndices;
uniform usamplerBuffer uProbeProjectionsMetadata;

uniform sampler2D uSurfelClustersLuminanceMap;

// Types

struct SH {
    vec3 L00;
    vec3 L11;
    vec3 L10;
    vec3 L1_1;
    vec3 L21;
    vec3 L2_1;
    vec3 L2_2;
    vec3 L20;
    vec3 L22;
};

// Functions

SH ZeroSH() {
    SH result;

    result.L00  = vec3(0.0);

    result.L1_1 = vec3(0.0);
    result.L10  = vec3(0.0);
    result.L11  = vec3(0.0);

    result.L2_2 = vec3(0.0);
    result.L2_1 = vec3(0.0);
    result.L21  = vec3(0.0);

    result.L20  = vec3(0.0);

    result.L22  = vec3(0.0);

    return result;
}

SH MultiplySHByColor(SH sh, vec3 color) {
    SH result;

    result.L00  = color * Y00;

    result.L1_1 = color * Y1_1;
    result.L10  = color * Y10;
    result.L11  = color * Y11;

    result.L2_2 = color * Y2_2;
    result.L2_1 = color * Y2_1;
    result.L21  = color * Y21;

    result.L20  = color * Y20;

    result.L22  = color * Y22;

    return result;
}

SH AddTwoSH(SH first, SH second) {
    SH result;

    result.L00  = first.L00 + second.L00;

    result.L1_1 = first.L1_1 + second.L1_1;
    result.L10  = first.L10 + second.L10;
    result.L11  = first.L11 + second.L11;

    result.L2_2 = first.L2_2 + second.L2_2;
    result.L2_1 = first.L2_1 + second.L2_1;
    result.L21  = first.L21 + second.L21;

    result.L20  = first.L20 + second.L20;

    result.L22  = first.L22 + second.L22;

    return result;
}

//
// Unpacks spherical harmonics coefficients
// from the corresponding sample buffer
//
SH UnpackSH(uint surfelClusterIndex) {
    SH sh;

    sh.L00  = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 0).rgb);
    sh.L11  = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 1).rgb);
    sh.L10  = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 2).rgb);
    sh.L1_1 = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 3).rgb);
    sh.L21  = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 4).rgb);
    sh.L2_1 = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 5).rgb);
    sh.L2_2 = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 6).rgb);
    sh.L20  = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 7).rgb);
    sh.L22  = vec3(texelFetch(uProjectionClusterSphericalHarmonics, surfelClusterIndex + 8).rgb);

    return sh;
}

// Pack SH coefficients into texels of 7 3D textures
// since minimum of 7 4-component textures are required
// to store 3rd order spherical harmonics for 3 color channels
void PackSHToRenderTargets(SH sh) {
    gl_FragData[0] = vec4(sh.L00.rgb, sh.L11.r);
    gl_FragData[1] = vec4(sh.L11.gb, sh.L10.rg);
    gl_FragData[2] = vec4(sh.L10.b, sh.L1_1.rgb);
    gl_FragData[3] = vec4(sh.L21.rgb, sh.L2_1.r);
    gl_FragData[4] = vec4(sh.L2_1.gb, sh.L2_2.rg);
    gl_FragData[5] = vec4(sh.L2_2.b, sh.L20.rgb);
    gl_FragData[6] = vec4(sh.L22.rgb, 0.0);
}

// Schematically, the update of a single light probe on the GPU works like this:
// • Read light probe metadata to determine which projections are used.
// • Loop over all the projections and for every projection:
//
// – Get the SH of the projection.
// – Get the surface group index of the projection.
// – Using the surface group index, get the average luminance of the surface group (calculated in the previous step and stored in an intermediate render target).
// – Add the product of the SH and the luminance to the result SHs.
//
void main() {
    uvec3 unnormalizedTexCoords = uvec3(uProbesPerGridDimensionCount * vTexCoords.x,
                                        uProbesPerGridDimensionCount * vTexCoords.y,
                                        uProbesPerGridDimensionCount * vTexCoords.z);

    uint size = uProbesPerGridDimensionCount;
    uint metadataIndex = size * size * unnormalizedTexCoords.z +
                         size * unnormalizedTexCoords.y +
                         unnormalizedTexCoords.x;

    metadataIndex *= 2; // Data in uProbeProjectionsMetadata is represented by sequence of offset-length pairs

    uint projectionGroupOffset = texelFetch(uProbeProjectionsMetadata, metadataIndex).r;
    uint projectionGroupSize = texelFetch(uProbeProjectionsMetadata, metadataIndex + 1).r;

    ivec2 luminanceMapSize = textureSize(uSurfelClustersLuminanceMap, 0);
    int luminanceMapWidth = luminanceMapSize.x;
    int luminanceMapHeight = luminanceMapSize.y;

    SH resultingSH = ZeroSH();

    for (uint i = projectionGroupOffset; i < projectionGroupOffset + projectionGroupSize; ++i) {
        uint surfelClusterIndex = texelFetch(uProjectionClusterIndices, i).r;

        vec2 luminanceUV = vec2(float(surfelClusterIndex % luminanceMapWidth) / luminanceMapWidth,
                                float(surfelClusterIndex / luminanceMapWidth) / luminanceMapHeight);

        vec3 surfelClusterLuminance = texture(uSurfelClustersLuminanceMap, uv).rgb;

        SH surfelClusterPrecomputedSH = UnpackSH(surfelClusterIndex);

        SH luminanceSH = MultiplySHByColor(surfelClusterPrecomputedSH, surfelClusterLuminance);

        resultingSH = AddTwoSH(resultingSH, luminanceSH);
    }

    PackSHToRenderTargets(resultingSH);
}