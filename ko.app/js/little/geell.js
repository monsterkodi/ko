var _k_ = {min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }}

var geell

import kxk from "../kxk.js"
let randInt = kxk.randInt
let randRange = kxk.randRange
let elem = kxk.elem
let post = kxk.post


geell = (function ()
{
    function geell (main)
    {
        var layer

        this.main = main
    
        this["clearCanvas"] = this["clearCanvas"].bind(this)
        this["resize"] = this["resize"].bind(this)
        this["loaded"] = this["loaded"].bind(this)
        this["loadTiles"] = this["loadTiles"].bind(this)
        this["draw"] = this["draw"].bind(this)
        this["win2Pos"] = this["win2Pos"].bind(this)
        this.useFBO = false
        this.textureInfos = []
        this.quadDataLength = 13
        this.bloomSpread = 3
        this.bloomIntensity = 0.3
        this.canvas = elem('canvas',{class:'canvas'})
        this.main.appendChild(this.canvas)
        this.numLayers = 2
        this.quadsPerLayer = 100000
        this.layerStart = []
        this.numQuads = []
        for (var _a_ = layer = 0, _b_ = this.numLayers; (_a_ <= _b_ ? layer < this.numLayers : layer > this.numLayers); (_a_ <= _b_ ? ++layer : --layer))
        {
            this.layerStart.push(layer * this.quadsPerLayer)
            this.numQuads.push(0)
        }
        this.maxQuads = this.quadsPerLayer * this.numLayers
        this.data = new Float32Array(this.maxQuads * this.quadDataLength)
        this.camCenter = 'center'
        this.clearColor = [0.1,0.1,0.1,1.0]
        this.camPosX = 0
        this.camPosY = 0
        this.camScale = 0.2
        post.on('resize',this.resize)
        this.initGL()
        this.initUV()
        this.loadTiles()
    }

    geell.prototype["initUV"] = function ()
    {
        var ni, ri, s, ti, uv

        s = 40.96 / 2048
        uv = function (u, uu, v, vv)
        {
            return [s * u,s * v,s * uu,s * vv]
        }
        this.tubeUV = []
        for (ti = 0; ti <= 8; ti++)
        {
            this.tubeUV.push([uv(ti * 4 + 2,ti * 4 + 2,8,10),uv(ti * 4 + 2,ti * 4 + 4,8,10),uv(ti * 4 + 2,ti * 4 + 4,10,10),uv(ti * 4 + 2,ti * 4 + 4,10,12),uv(ti * 4,ti * 4 + 2,10,12),uv(ti * 4,ti * 4 + 2,8,10)])
        }
        this.ringUV = []
        for (ri = 0; ri <= 8; ri++)
        {
            this.ringUV.push(uv(ri * 4,(ri + 1) * 4,8,12))
        }
        this.numberUV = []
        for (ni = 0; ni <= 10; ni++)
        {
            this.numberUV.push(uv(ni * 3,(ni + 1) * 3,0,4))
        }
        this.quadUV = uv(37,39,9,11)
        this.circleUV = uv(36,40,8,12)
        this.circleTopUV = uv(36,40,8,10)
        return this.pieUV = [uv(36,38,8,10),uv(38,40,8,10),uv(38,40,10,12),uv(36,38,10,12)]
    }

    geell.prototype["win2Pos"] = function (winPos)
    {
        var x, y

        x = (((winPos.x - this.br.left) / this.br.width - 0.5) * 2) / (this.camScale * this.aspect) + this.bufCamPos[0]
        y = (((winPos.y - this.br.top) / this.br.height - 0.5) * -2) / this.camScale + this.bufCamPos[1]
        return [x,y]
    }

    geell.prototype["initGL"] = function ()
    {
        var fsPost, fsSource, loadShader, r, vsPost, vsSource

        this.gl = this.canvas.getContext('webgl2')
        vsSource = `#version 300 es
precision mediump float;
in vec2  aQuadVertex;
in vec2  aQuadPosition;
in vec2  aQuadScale;
in vec4  aQuadColor;
in vec4  aQuadUV;
in float aQuadRot;
uniform vec2 uCamPos;
uniform vec2 uCamScale;
out vec4 vColor;
out vec2 vUV;

void main(void) {
    vec2 vertex = aQuadVertex * aQuadScale;
    vec2 rotated = vertex*cos(aQuadRot)+vec2(-vertex.y,vertex.x)*sin(aQuadRot);
    vec2 pos = uCamScale * (rotated + aQuadPosition) - uCamPos * uCamScale;
    gl_Position = vec4(pos.x, pos.y, 0, 1);
    vColor = aQuadColor;
    vUV = mix(aQuadUV.xw,aQuadUV.zy,aQuadVertex+vec2(0.5, 0.5));
}
`
        fsSource = `#version 300 es
precision mediump float;
in vec4 vColor;
in vec2 vUV;
uniform sampler2D uSampler;
out vec4 fragColor;

void main(void) {
    fragColor = texture(uSampler,vUV)*vColor;
}`
        vsPost = `#version 300 es
precision mediump float;
in vec4  aVertex;
out vec2 vUV;

void main(void) {
    gl_Position = vec4(aVertex.x, aVertex.y, 0, 1);
    vUV = vec2(aVertex.z, aVertex.w);
}`
        fsPost = `#version 300 es
precision mediump float;
in vec2 vUV;
uniform sampler2D uSampler;

uniform float bloom_spread;
uniform float bloom_intensity;

out vec4 fragColor;

void main(void) {

    fragColor = texture(uSampler,vUV);
    
    if (true) 
    {
        ivec2 size = textureSize(uSampler, 0);
        
        float uv_x = vUV.x * float(size.x);
        float uv_y = vUV.y * float(size.y);
        
        vec4 sum = vec4(0.0);
        
        for (int n = 0; n < 9; ++n) 
        {
            uv_y = (vUV.y * float(size.y)) + (bloom_spread * float(n - 4));
            vec4 h_sum = vec4(0.0);
            h_sum += texelFetch(uSampler, ivec2(uv_x - (4.0 * bloom_spread), uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x - (3.0 * bloom_spread), uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x - (2.0 * bloom_spread), uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x - bloom_spread, uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x, uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x + bloom_spread, uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x + (2.0 * bloom_spread), uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x + (3.0 * bloom_spread), uv_y), 0);
            h_sum += texelFetch(uSampler, ivec2(uv_x + (4.0 * bloom_spread), uv_y), 0);
            sum += h_sum / 9.0;
        }
        
        sum = sum / 9.0;
        
        fragColor = texture(uSampler,vUV) + (sum * bloom_intensity);
    }
}`
        loadShader = (function (type, source)
        {
            var shader

            shader = this.gl.createShader(type)
            this.gl.shaderSource(shader,source)
            this.gl.compileShader(shader)
            if (!this.gl.getShaderParameter(shader,this.gl.COMPILE_STATUS))
            {
                console.error('Shader compilation failed:',this.gl.getShaderInfoLog(shader))
                this.gl.deleteShader(shader)
                return null
            }
            return shader
        }).bind(this)
        this.shaderProgram = this.gl.createProgram()
        this.gl.attachShader(this.shaderProgram,loadShader(this.gl.VERTEX_SHADER,vsSource))
        this.gl.attachShader(this.shaderProgram,loadShader(this.gl.FRAGMENT_SHADER,fsSource))
        this.gl.linkProgram(this.shaderProgram)
        if (!this.gl.getProgramParameter(this.shaderProgram,this.gl.LINK_STATUS))
        {
            console.error('Shader linking failed:',this.gl.getProgramInfoLog(this.shaderProgram))
        }
        this.postProgram = this.gl.createProgram()
        this.gl.attachShader(this.postProgram,loadShader(this.gl.VERTEX_SHADER,vsPost))
        this.gl.attachShader(this.postProgram,loadShader(this.gl.FRAGMENT_SHADER,fsPost))
        this.gl.linkProgram(this.postProgram)
        if (!this.gl.getProgramParameter(this.postProgram,this.gl.LINK_STATUS))
        {
            console.error('Shader linking failed:',this.gl.getProgramInfoLog(this.postProgram))
        }
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA)
        this.gl.enable(this.gl.BLEND)
        r = 0.5
        this.quadVertices = new Float32Array([-r,-r,r,-r,r,r,-r,r])
        this.screenVertices = new Float32Array([0,0,0,1,1,0,1,1,1,1,1,0,0,1,0,0])
        this.bufCamScale = new Float32Array(2)
        this.bufCamPos = new Float32Array(2)
        this.quadVertexLoc = this.gl.getAttribLocation(this.shaderProgram,'aQuadVertex')
        this.positionLoc = this.gl.getAttribLocation(this.shaderProgram,'aQuadPosition')
        this.scaleLoc = this.gl.getAttribLocation(this.shaderProgram,'aQuadScale')
        this.colorLoc = this.gl.getAttribLocation(this.shaderProgram,'aQuadColor')
        this.uvLoc = this.gl.getAttribLocation(this.shaderProgram,'aQuadUV')
        this.rotLoc = this.gl.getAttribLocation(this.shaderProgram,'aQuadRot')
        this.camScaleLoc = this.gl.getUniformLocation(this.shaderProgram,'uCamScale')
        this.camPosLoc = this.gl.getUniformLocation(this.shaderProgram,'uCamPos')
        this.bloomSpreadLoc = this.gl.getUniformLocation(this.postProgram,'bloom_spread')
        this.bloomIntensityLoc = this.gl.getUniformLocation(this.postProgram,'bloom_intensity')
        this.quadBuffer = this.gl.createBuffer()
        this.dataBuffer = this.gl.createBuffer()
        this.postBuffer = this.gl.createBuffer()
        this.fbo = this.gl.createFramebuffer()
        this.renderTexture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D,this.renderTexture)
        this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,4096,4096,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,null)
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.NEAREST)
        return this.gl.bindTexture(this.gl.TEXTURE_2D,null)
    }

    geell.prototype["draw"] = function (time)
    {
        var attrib, offset, screenVertices, stride, u, v, vertexPosition

        if (this.useFBO)
        {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.fbo)
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,this.renderTexture,0)
        }
        if ((this.textureInfos[0] != null ? this.textureInfos[0].glTexture : undefined))
        {
            this.gl.activeTexture(this.gl.TEXTURE0)
            this.gl.bindTexture(this.gl.TEXTURE_2D,this.textureInfos[0].glTexture)
        }
        this.gl.useProgram(this.shaderProgram)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.quadBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER,this.quadVertices,this.gl.STATIC_DRAW)
        this.gl.vertexAttribPointer(this.quadVertexLoc,2,this.gl.FLOAT,false,0,0)
        this.gl.enableVertexAttribArray(this.quadVertexLoc)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.dataBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER,this.data,this.gl.DYNAMIC_DRAW)
        stride = this.quadDataLength * 4
        offset = 0
        attrib = (function (loc, cnt)
        {
            this.gl.vertexAttribPointer(loc,cnt,this.gl.FLOAT,false,stride,offset)
            this.gl.vertexAttribDivisor(loc,1)
            this.gl.enableVertexAttribArray(loc)
            return offset += 4 * cnt
        }).bind(this)
        attrib(this.positionLoc,2)
        attrib(this.scaleLoc,2)
        attrib(this.colorLoc,4)
        attrib(this.uvLoc,4)
        attrib(this.rotLoc,1)
        this.gl.uniform2fv(this.camScaleLoc,this.bufCamScale)
        this.gl.uniform2fv(this.camPosLoc,this.bufCamPos)
        this.clearCanvas()
        this.gl.viewport(0,0,this.canvas.width,this.canvas.height)
        this.gl.drawArraysInstanced(this.gl.TRIANGLE_FAN,0,4,this.maxQuads)
        this.gl.flush()
        if (this.useFBO)
        {
            this.gl.useProgram(this.postProgram)
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,null,0)
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null)
            this.gl.uniform1f(this.bloomSpreadLoc,this.bloomSpread)
            this.gl.uniform1f(this.bloomIntensityLoc,this.bloomIntensity)
            this.gl.disable(this.gl.DEPTH_TEST)
            this.gl.disable(this.gl.CULL_FACE)
            this.gl.clearColor(0,0,0,1)
            this.gl.clear(this.gl.COLOR_BUFFER_BIT)
            this.gl.viewport(0,0,this.canvas.width,this.canvas.height)
            this.gl.bindTexture(this.gl.TEXTURE_2D,this.renderTexture)
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.postBuffer)
            u = this.canvas.width / 4096
            v = this.canvas.height / 4096
            screenVertices = new Float32Array([-1,-1,0,0,1,-1,u,0,1,1,u,v,-1,1,0,v])
            this.gl.bufferData(this.gl.ARRAY_BUFFER,screenVertices,this.gl.STATIC_DRAW)
            vertexPosition = this.gl.getAttribLocation(this.postProgram,'aVertex')
            this.gl.vertexAttribPointer(vertexPosition,4,this.gl.FLOAT,false,0,0)
            this.gl.enableVertexAttribArray(vertexPosition)
            this.gl.drawArrays(this.gl.TRIANGLE_FAN,0,4)
            this.gl.flush()
        }
        this.numQuads[0] = 0
        this.numQuads[1] = 0
        return this.data.fill(0,0,this.data.length)
    }

    geell.prototype["updateCamera"] = function ()
    {
        this.bufCamScale[0] = this.camScale * this.aspect
        this.bufCamScale[1] = this.camScale
        switch (this.camCenter)
        {
            case 'center':
                this.bufCamPos[0] = this.camPosX
                return this.bufCamPos[1] = this.camPosY

            case 'topleft':
                this.bufCamPos[0] = this.camPosX + 1 / this.bufCamScale[0]
                return this.bufCamPos[1] = this.camPosY - 1 / this.bufCamScale[1]

        }

    }

    geell.prototype["loadTiles"] = function ()
    {
        var imageSources, promises

        imageSources = ['./tiles0000.png']
        promises = imageSources.map((function (src, textureIndex)
        {
            return new Promise((function (resolve)
            {
                var image

                image = new Image
                image.onerror = image.onload = (function ()
                {
                    this.textureInfos[textureIndex] = {image:image,size:[image.width,image.height],width:image.width,height:image.height,glTexture:this.createTexture(image)}
                    return resolve()
                }).bind(this)
                return image.src = src
            }).bind(this))
        }).bind(this))
        return Promise.all(promises).then(this.loaded)
    }

    geell.prototype["loaded"] = function ()
    {
        if ((this.textureInfos[0] != null ? this.textureInfos[0].glTexture : undefined))
        {
            this.gl.activeTexture(this.gl.TEXTURE0)
            this.gl.bindTexture(this.gl.TEXTURE_2D,this.textureInfos[0].glTexture)
        }
        return this.resize()
    }

    geell.prototype["createTexture"] = function (image)
    {
        var texture

        if (!image)
        {
            return
        }
        texture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D,texture)
        this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,image)
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR)
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR)
        return texture
    }

    geell.prototype["resize"] = function ()
    {
        var devicePixelRatio

        this.br = this.main.getBoundingClientRect()
        devicePixelRatio = window.devicePixelRatio || 1
        this.aspect = this.br.height / this.br.width
        this.canvas.width = _k_.min(4096,this.br.width * devicePixelRatio)
        this.canvas.height = this.canvas.width * this.aspect
        this.canvas.style.width = this.br.width + "px"
        this.canvas.style.height = this.br.height + "px"
        this.gl.viewport(0,0,this.canvas.width,this.canvas.height)
        return this.updateCamera()
    }

    geell.prototype["clearCanvas"] = function ()
    {
        this.gl.clearColor(this.clearColor[0],this.clearColor[1],this.clearColor[2],this.clearColor[3])
        return this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    }

    return geell
})()

export default geell;