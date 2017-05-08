//
//  GLElementArrayBuffer.cpp
//  EARenderer
//
//  Created by Pavlo Muratov on 18.03.17.
//  Copyright © 2017 MPO. All rights reserved.
//

#include "GLElementArrayBuffer.hpp"

namespace EARenderer {
    
    void GLElementArrayBuffer::bind() const {
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, mName);
    }
    
    void GLElementArrayBuffer::initialize(const std::vector<GLushort>& data) {
        bind();
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, data.size() * sizeof(GLushort), &data[0], GL_STATIC_DRAW);
    }
    
}
