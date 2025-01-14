'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

// WebGL shader programs
const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  in vec2 a_texCoord;
  out vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `#version 300 es
  precision highp float;
  uniform sampler2D u_image;
  in vec2 v_texCoord;
  out vec4 fragColor;
  
  // Convert RGB to YCbCr
  vec3 rgb2ycbcr(vec3 c) {
    vec3 yuv = mat3(
      vec3(0.299, 0.587, 0.114),
      vec3(-0.169, -0.331, 0.500),
      vec3(0.500, -0.419, -0.081)
    ) * c;
    return yuv;
  }

  // Enhanced spill suppression with maximum edge-aware blending
  vec3 suppressSpill(vec3 color, float amount, float edgeFactor) {
    float gr = color.g / color.r;
    float gb = color.g / color.b;
    
    float naturalGreen = max(0.0, 1.0 - abs(color.g - 0.4) * 1.8);
    float spillStrength = max(0.0, gr - 1.0) * max(0.0, gb - 1.0);
    
    if (spillStrength > 0.0) {
      float targetGreen = max(color.r, color.b) * mix(1.0, amount, spillStrength);
      float edgeAwareAmount = mix(0.5, 1.0, edgeFactor);
      color.g = mix(color.g, targetGreen, (1.0 - naturalGreen) * edgeAwareAmount);
    }
    return color;
  }
  
  float getDetailMask(vec4 color, vec3 ycbcr, float brightness) {
    float colorVar = max(abs(color.r - color.g), max(abs(color.g - color.b), abs(color.r - color.b)));
    float colorVarNorm = smoothstep(0.02, 0.35, colorVar);
    
    float lumEdge = abs(ycbcr.x - 0.5);
    float sharpEdge = 1.0 - smoothstep(0.0, 0.35, lumEdge);
    float softEdge = 1.0 - smoothstep(0.0, 0.7, lumEdge);
    
    float darkness = pow(1.0 - brightness, 1.1);
    
    float edgeDetail = mix(softEdge, sharpEdge, darkness) * 0.95;
    float colorDetail = colorVarNorm * darkness;
    float finalDetail = max(edgeDetail, colorDetail);
    
    return smoothstep(0.03, 0.97, finalDetail);
  }

  // Maximum edge intensity calculation with wide sampling
  float getEdgeIntensity(float alpha, vec2 uv) {
    vec2 texelSize = vec2(1.0 / 1920.0, 1.0 / 1080.0);
    float dx = dFdx(alpha) * 2.0;
    float dy = dFdy(alpha) * 2.0;
    
    // Sample in 8 directions for maximum edge detection
    float alpha_n = texture(u_image, uv + vec2(0.0, texelSize.y)).a;
    float alpha_s = texture(u_image, uv - vec2(0.0, texelSize.y)).a;
    float alpha_e = texture(u_image, uv + vec2(texelSize.x, 0.0)).a;
    float alpha_w = texture(u_image, uv - vec2(texelSize.x, 0.0)).a;
    float alpha_ne = texture(u_image, uv + texelSize).a;
    float alpha_nw = texture(u_image, uv + vec2(-texelSize.x, texelSize.y)).a;
    float alpha_se = texture(u_image, uv + vec2(texelSize.x, -texelSize.y)).a;
    float alpha_sw = texture(u_image, uv - texelSize).a;
    
    float gradientMagnitude = length(vec2(dx, dy));
    float neighborDiff = max(
      max(abs(alpha - alpha_n), abs(alpha - alpha_s)),
      max(max(abs(alpha - alpha_e), abs(alpha - alpha_w)),
      max(max(abs(alpha - alpha_ne), abs(alpha - alpha_nw)),
          max(abs(alpha - alpha_se), abs(alpha - alpha_sw))))
    );
    
    // Wider edge detection range
    return smoothstep(0.005, 0.12, gradientMagnitude) + smoothstep(0.01, 0.25, neighborDiff);
  }
  
  void main() {
    vec4 color = texture(u_image, v_texCoord);
    vec3 rgb = color.rgb;
    float alpha = 1.0;
    
    float greenDominance = color.g - max(color.r, color.b);
    vec3 ycbcr = rgb2ycbcr(rgb);
    float chromaDist = length(ycbcr.yz);
    float brightness = max(max(color.r, color.g), color.b);
    
    if (greenDominance > 0.012 || (color.g > 0.1 && chromaDist < 0.48)) {
      float greenFactor = smoothstep(0.012, 0.38, greenDominance);
      float chromaFactor = smoothstep(0.58, 0.1, chromaDist);
      
      float detailMask = getDetailMask(color, ycbcr, brightness);
      float greenScreenness = greenFactor * 0.65 + chromaFactor * 0.35;
      
      if (detailMask > 0.1) {
        float detailStrength = smoothstep(0.1, 0.9, detailMask);
        float detailGreenScreen = greenScreenness * (1.0 - detailStrength * 0.85);
        alpha = 1.0 - smoothstep(0.1, 0.9, detailGreenScreen);
        
        if (detailStrength > 0.7) {
          alpha = mix(alpha, 1.0, pow(detailStrength - 0.7, 1.4) * 2.0);
        }
      } else {
        float solidGreenScreen = greenScreenness * 1.2;
        alpha = 1.0 - smoothstep(0.4, 0.6, solidGreenScreen);
      }
      
      float edgeIntensity = getEdgeIntensity(alpha, v_texCoord);
      
      if (alpha < 0.998) {
        float spillAmount = mix(0.88, 0.98, alpha);
        rgb = suppressSpill(rgb, spillAmount, edgeIntensity);
      }
      
      if (edgeIntensity > 0.0) {
        // Maximum feathering
        float featherAmount = edgeIntensity * 0.85;
        alpha = mix(alpha, smoothstep(0.03, 0.97, alpha), featherAmount);
        
        // Enhanced color bleeding with wider radius and more samples
        vec2 bleedOffset = vec2(3.0 / 1920.0, 3.0 / 1080.0);
        vec2 halfOffset = bleedOffset * 0.5;
        
        vec4 neighborColor1 = texture(u_image, v_texCoord + bleedOffset);
        vec4 neighborColor2 = texture(u_image, v_texCoord - bleedOffset);
        vec4 neighborColor3 = texture(u_image, v_texCoord + vec2(bleedOffset.x, -bleedOffset.y));
        vec4 neighborColor4 = texture(u_image, v_texCoord + vec2(-bleedOffset.x, bleedOffset.y));
        vec4 neighborColor5 = texture(u_image, v_texCoord + halfOffset);
        vec4 neighborColor6 = texture(u_image, v_texCoord - halfOffset);
        vec4 neighborColor7 = texture(u_image, v_texCoord + vec2(halfOffset.x, -halfOffset.y));
        vec4 neighborColor8 = texture(u_image, v_texCoord + vec2(-halfOffset.x, halfOffset.y));
        
        vec3 blendColor = (
          neighborColor1.rgb + neighborColor2.rgb + neighborColor3.rgb + neighborColor4.rgb +
          neighborColor5.rgb + neighborColor6.rgb + neighborColor7.rgb + neighborColor8.rgb
        ) * 0.125;
        
        rgb = mix(rgb, blendColor, featherAmount * 0.5);
      }
    }
    
    fragColor = vec4(rgb, alpha);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Shader compilation failed');
  }
  
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Program linking failed');
  }
  
  return program;
}

export function VideoBackground({
  className
}: {
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Initialize WebGL 2
    const gl = canvas.getContext('webgl2', { 
      premultipliedAlpha: false, 
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      depth: false,
      stencil: false,
      failIfMajorPerformanceCaveat: true,
      desynchronized: true
    });
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }
    glRef.current = gl;

    // Enable alpha blending with optimized settings
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Clear to transparent
    gl.clearColor(0, 0, 0, 0);

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    programRef.current = program;

    // Set up geometry
    const positionBuffer = gl.createBuffer();
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    const texCoords = new Float32Array([
      0.0, 1.0,
      1.0, 1.0,
      0.0, 0.0,
      1.0, 0.0
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // Create and set up texture
    const texture = gl.createTexture();
    textureRef.current = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.useProgram(program);
    
    // Render loop
    function render() {
      if (!gl || !video || !canvas || !program || !texture) return;
      
      // Only update canvas size if video dimensions change
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Skip frame if video is not ready or hasn't changed
      if (video.readyState < video.HAVE_CURRENT_DATA) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Update texture with new video frame
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      // Draw
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      rafRef.current = requestAnimationFrame(render);
    }

    // Video playback handling
    const handleTimeUpdate = () => {
      const buffer = 0.2;
      if (video.currentTime > video.duration - buffer) {
        video.currentTime = 0;
      }
    };

    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Video playback failed:", error);
        });
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', () => {
      startPlayback();
      render();
    });
    video.addEventListener('ended', () => { video.currentTime = 0 });
    video.addEventListener('pause', startPlayback);

    if (video.readyState >= 2) {
      startPlayback();
      render();
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', startPlayback);
      video.removeEventListener('ended', () => { video.currentTime = 0 });
      video.removeEventListener('pause', startPlayback);
      cancelAnimationFrame(rafRef.current);
      
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteTexture(texture);
      }
    };
  }, []);

  return (
    <div className={cn("fixed inset-0 -z-10", className)}>
      {/* Gradient background */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,rgba(6,78,59,0.2)_45%,rgba(15,23,42,0.4)_100%)]"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Video layer */}
      <div className="absolute inset-0 flex items-end justify-center overflow-hidden z-[1]">
        <canvas 
          ref={canvasRef}
          className="h-[90vh] w-auto object-contain"
          style={{ 
            imageRendering: 'crisp-edges',
            transform: 'translateZ(0)', // Force GPU acceleration
          }}
        />
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="hidden"
          webkit-playsinline="true"
          crossOrigin="anonymous"
          style={{
            transform: 'translateZ(0)', // Force hardware acceleration
          }}
        >
          <source 
            src="https://v3.fal.media/files/penguin/pgQL_9OO0I2MZKDmBFuKF_output.mp4" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
} 