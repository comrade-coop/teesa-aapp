'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState, useCallback } from 'react'

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
  
  // Input/Output
  uniform sampler2D u_image;
  in vec2 v_texCoord;
  out vec4 fragColor;
  
  // Transparency thresholds
  const float TRANSPARENT_THRESHOLD = 0.03;
  const float OPAQUE_THRESHOLD = 0.1;
  const float MAX_OPACITY = 0.90;
  
  // Color adjustments
  const float COLOR_DARKENING = 0.95;
  const vec3 TARGET_COLOR = vec3(0.082, 0.212, 0.243);  // #15363E
  
  // YCbCr conversion matrix
  const mat3 RGB_TO_YCBCR = mat3(
    vec3(0.299, 0.587, 0.114),
    vec3(-0.169, -0.331, 0.500),
    vec3(0.500, -0.419, -0.081)
  );
  
  // Convert RGB to YCbCr
  vec3 rgb2ycbcr(vec3 c) {
    return RGB_TO_YCBCR * c;
  }
  
  void main() {
    vec4 color = texture(u_image, v_texCoord);
    vec3 rgb = color.rgb;
    
    // Convert both colors to YCbCr for better matching
    vec3 ycbcr = rgb2ycbcr(rgb);
    vec3 targetYcbcr = rgb2ycbcr(TARGET_COLOR);
    
    // Calculate color distance using weights
    float colorDist = length(ycbcr - targetYcbcr);
    
    // Smoother transition with adjusted curve
    float alpha;
    if (colorDist < TRANSPARENT_THRESHOLD) {
        alpha = 0.0;
    } else if (colorDist > OPAQUE_THRESHOLD) {
        alpha = MAX_OPACITY;
    } else {
        alpha = smoothstep(TRANSPARENT_THRESHOLD, OPAQUE_THRESHOLD, colorDist) * MAX_OPACITY;
    }
    
    // Apply color darkening
    rgb *= COLOR_DARKENING;
    
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
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const texCoordBufferRef = useRef<WebGLBuffer | null>(null);
  const positionLocationRef = useRef<number>(-1);
  const texCoordLocationRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const initAttemptsRef = useRef(0);
  const maxInitAttempts = 3;

  const initializeWebGL = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return false;

    try {
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
        return false;
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
      positionBufferRef.current = positionBuffer;
      const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const texCoordBuffer = gl.createBuffer();
      texCoordBufferRef.current = texCoordBuffer;
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
      positionLocationRef.current = positionLocation;
      texCoordLocationRef.current = texCoordLocation;

      gl.useProgram(program);

      return true;
    } catch (error) {
      console.error('WebGL initialization error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Reset initialization state when component mounts
    isInitializedRef.current = false;
    initAttemptsRef.current = 0;

    const tryInitialize = () => {
      if (initAttemptsRef.current >= maxInitAttempts) {
        console.error('Max initialization attempts reached');
        return;
      }

      if (!video.videoWidth) {
        // Video metadata not yet loaded, wait and retry
        initAttemptsRef.current++;
        setTimeout(tryInitialize, 500);
        return;
      }

      const success = initializeWebGL();
      if (success) {
        isInitializedRef.current = true;
        setVideoLoaded(true);
        startPlayback();
        render();
      } else if (initAttemptsRef.current < maxInitAttempts) {
        // Retry initialization
        initAttemptsRef.current++;
        setTimeout(tryInitialize, 500);
      }
    };

    // Video playback handling
    const handleLoadedMetadata = () => {
      if (video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (glRef.current) glRef.current.viewport(0, 0, canvas.width, canvas.height);
        tryInitialize();
      }
    };

    const startPlayback = async () => {
      try {
        await video.play();
      } catch (error) {
        console.log("Video playback failed:", error);
        // Retry playback after a short delay
        setTimeout(startPlayback, 1000);
      }
    };

    // Render loop
    function render() {
      if (!glRef.current || !video || !canvas || !programRef.current || !textureRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      
      try {
        // Only update canvas size if video dimensions change
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          glRef.current.viewport(0, 0, canvas.width, canvas.height);
        }

        // Ensure video is actually ready
        if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) {
          rafRef.current = requestAnimationFrame(render);
          return;
        }

        glRef.current.clear(glRef.current.COLOR_BUFFER_BIT);
        
        // Update texture with new video frame
        glRef.current.bindTexture(glRef.current.TEXTURE_2D, textureRef.current);
        glRef.current.texImage2D(glRef.current.TEXTURE_2D, 0, glRef.current.RGBA, glRef.current.RGBA, glRef.current.UNSIGNED_BYTE, video);

        // Draw
        if (positionBufferRef.current && texCoordBufferRef.current && positionLocationRef.current >= 0 && texCoordLocationRef.current >= 0) {
          glRef.current.bindBuffer(glRef.current.ARRAY_BUFFER, positionBufferRef.current);
          glRef.current.enableVertexAttribArray(positionLocationRef.current);
          glRef.current.vertexAttribPointer(positionLocationRef.current, 2, glRef.current.FLOAT, false, 0, 0);

          glRef.current.bindBuffer(glRef.current.ARRAY_BUFFER, texCoordBufferRef.current);
          glRef.current.enableVertexAttribArray(texCoordLocationRef.current);
          glRef.current.vertexAttribPointer(texCoordLocationRef.current, 2, glRef.current.FLOAT, false, 0, 0);

          glRef.current.drawArrays(glRef.current.TRIANGLE_STRIP, 0, 4);
        }
      } catch (error) {
        console.error('Render error:', error);
      }
      
      rafRef.current = requestAnimationFrame(render);
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', () => {
      const buffer = 0.2;
      if (video.currentTime > video.duration - buffer) {
        video.currentTime = 0;
      }
    });
    video.addEventListener('ended', () => { video.currentTime = 0 });
    video.addEventListener('pause', startPlayback);

    // Start immediately if video is already loaded
    if (video.readyState >= 2 && video.videoWidth) {
      handleLoadedMetadata();
    }

    return () => {
      isInitializedRef.current = false;
      setVideoLoaded(false);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', () => {
        const buffer = 0.2;
        if (video.currentTime > video.duration - buffer) {
          video.currentTime = 0;
        }
      });
      video.removeEventListener('ended', () => { video.currentTime = 0 });
      video.removeEventListener('pause', startPlayback);
      cancelAnimationFrame(rafRef.current);
      
      if (glRef.current) {
        const gl = glRef.current;
        if (programRef.current) gl.deleteProgram(programRef.current);
        if (textureRef.current) gl.deleteTexture(textureRef.current);
      }
    };
  }, [initializeWebGL]);

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Gradient background - show immediately as fallback */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,rgba(6,78,59,0.2)_45%,rgba(15,23,42,0.4)_100%)]"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Video layer */}
      <div className="absolute inset-0 flex items-end justify-center overflow-hidden z-[1]">
        <div className="flex items-end justify-center w-full max-w-[1800px] mx-auto">
          <div className="w-[512px] hidden md:block" /> {/* Left spacer for chat UI */}
          <div className="flex items-end justify-center flex-1 px-4">
            <canvas 
              ref={canvasRef}
              className={cn(
                "h-[90vh] w-auto object-contain transition-opacity duration-500",
                videoLoaded ? "opacity-100" : "opacity-0"
              )}
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
                src="/teesa-idle.mp4"
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="w-80 hidden md:block" /> {/* Right spacer for panel */}
        </div>
      </div>
    </div>
  );
} 