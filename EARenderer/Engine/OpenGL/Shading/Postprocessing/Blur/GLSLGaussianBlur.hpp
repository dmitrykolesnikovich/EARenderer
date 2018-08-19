//
//  GLSLGaussianBlur.hpp
//  EARenderer
//
//  Created by Pavel Muratov on 6/13/18.
//  Copyright © 2018 MPO. All rights reserved.
//

#ifndef GLSLGaussianBlur_hpp
#define GLSLGaussianBlur_hpp

#include "GLProgram.hpp"
#include "GLTexture2D.hpp"

#include <glm/mat4x4.hpp>
#include <vector>

namespace EARenderer {

    class GLSLGaussianBlur: public GLProgram {
    public:
        using GLProgram::GLProgram;

        enum class BlurDirection { Vertical, Horizontal };

        GLSLGaussianBlur();

        void setBlurDirection(BlurDirection direction);
        void setTexture(const GLFloatTexture2D<GLTexture::Float::RGBA16F>& texture, size_t mipLevel);
        void setKernelWeights(const std::vector<float>& weights);
        void setTextureOffsets(const std::vector<float>& offsets);
        void setRenderTargetSize(const Size2D& RTSize);
    };

}

#endif /* GLSLGaussianBlur_hpp */