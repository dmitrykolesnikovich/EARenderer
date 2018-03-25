//
//  Renderer.hpp
//  EARenderer
//
//  Created by Pavlo Muratov on 29.03.17.
//  Copyright © 2017 MPO. All rights reserved.
//

#ifndef Renderer_hpp
#define Renderer_hpp

#include <unordered_set>

#include "Scene.hpp"
#include "GLFramebuffer.hpp"
#include "DefaultRenderComponentsProviding.hpp"
#include "FrustumCascades.hpp"
#include "Ray3D.hpp"
#include "LightProbeBuilder.hpp"

#include "GLSLCookTorrance.hpp"
#include "GLSLFullScreenQuad.hpp"
#include "GLSLDirectionalDepth.hpp"
#include "GLSLOmnidirectionalDepth.hpp"
#include "GLSLSkybox.hpp"
#include "GLSLGenericGeometry.hpp"
#include "GLSLEquirectangularMapConversion.hpp"
#include "GLSLRadianceConvolution.hpp"
#include "GLSLBRDFIntegration.hpp"
#include "GLSLSurfelLighting.hpp"
#include "GLSLSurfelClusterAveraging.hpp"

#include "GLDepthTexture2D.hpp"
#include "GLDepthTextureCubemap.hpp"
#include "GLHDRTexture2DArray.hpp"
#include "GLDepthTexture2DArray.hpp"
#include "GLHDRTexture2D.hpp"
#include "GLHDRTextureCubemap.hpp"
#include "GLTexture2DArray.hpp"

namespace EARenderer {
    
    class SceneRenderer {
    private:
        uint8_t mNumberOfCascades = 1;
        uint8_t mNumberOfIrradianceMips = 5;
        
        Scene *mScene = nullptr;
        DefaultRenderComponentsProviding *mDefaultRenderComponentsProvider = nullptr;
    
        GLSLDirectionalDepth mDirectionalDepthShader;
        GLSLOmnidirectionalDepth mOmnidirectionalDepthShader;
        GLSLSkybox mSkyboxShader;
        GLSLCookTorrance mCookTorranceShader;
        GLSLEquirectangularMapConversion mEqurectangularMapConversionShader;
        GLSLRadianceConvolution mRadianceConvolutionShader;
        GLSLBRDFIntegration mBRDFIntegrationShader;
        GLSLSurfelLighting mSurfelLightingShader;
        GLSLSurfelClusterAveraging mSurfelClusterAveragingShader;
        
        GLHDRTextureCubemap mEnvironmentMapCube;
        GLHDRTextureCubemap mDiffuseIrradianceMap;
        GLHDRTextureCubemap mSpecularIrradianceMap;
        GLHDRTexture2D mBRDFIntegrationMap;
        GLFramebuffer mIBLFramebuffer;

        GLHDRTexture2DArray mSurfelsGBuffer;
        GLLDRTexture2D mSurfelClustersGBuffer;
        GLHDRTexture2D mSurfelsLuminanceMap;
        GLHDRTexture2D mSurfelClustersLuminanceMap;
        GLFramebuffer mSurfelsLuminanceFramebuffer;
        GLFramebuffer mSurfelClustersLuminanceFramebuffer;

        GLDepthTexture2DArray mShadowMaps;
        GLDepthTextureCubemap mShadowCubeMap;
        GLFramebuffer mDepthFramebuffer;

//        // DEBUG
        GLSLFullScreenQuad mFSQuadShader;
        GLSLGenericGeometry mGenericShader;
//        //
        
        void renderShadowMapsForDirectionalLights(const FrustumCascades& cascades);
        void relightSurfels(const FrustumCascades& cascades);
        void averageSurfelClusterLuminances();
        void renderSkybox();
        
        void convertEquirectangularMapToCubemap();
        void buildDiffuseIrradianceMap();
        void buildSpecularIrradianceMap();
        void buildBRDFIntegrationMap();

        std::vector<std::vector<glm::vec3>> surfelsGBufferData() const;
        std::vector<uint8_t> surfelClustersGBufferData() const;
                
    public:
        SceneRenderer(Scene* scene);
        
        void setDefaultRenderComponentsProvider(DefaultRenderComponentsProviding *provider);
        bool raySelectsMesh(const Ray3D& ray, ID& meshID);
        void render();

        void renderSurfelsGBuffer();
        void renderSurfelLuminances();
        void renderSurfelClusterLuminances();
    };
    
}

#endif /* Renderer_hpp */
