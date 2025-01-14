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
  
  // Threshold values for transparency regions
  const float TRANSPARENT_THRESHOLD = 0.03;  // Below this: fully transparent
  const float OPAQUE_THRESHOLD = 0.07;       // Above this: fully opaque
  const vec3 DISTANCE_WEIGHTS = vec3(0.2, 1.0, 1.0);  // Weights for Y, Cb, Cr components
  
  // Convert RGB to YCbCr
  vec3 rgb2ycbcr(vec3 c) {
    vec3 yuv = mat3(
      vec3(0.299, 0.587, 0.114),
      vec3(-0.169, -0.331, 0.500),
      vec3(0.500, -0.419, -0.081)
    ) * c;
    return yuv;
  }
  
  void main() {
    vec4 color = texture(u_image, v_texCoord);
    vec3 rgb = color.rgb;
    
    // Target color (#15363E)
    vec3 targetColor = vec3(0.082, 0.212, 0.243);
    
    // Convert both colors to YCbCr for better matching
    vec3 ycbcr = rgb2ycbcr(rgb);
    vec3 targetYcbcr = rgb2ycbcr(targetColor);
    
    // Calculate color distance using weights
    float colorDist = length((ycbcr - targetYcbcr) * DISTANCE_WEIGHTS);
    
    // Three distinct regions based on thresholds
    float alpha;
    if (colorDist < TRANSPARENT_THRESHOLD) {
        alpha = 0.0;  // Fully transparent
    } else if (colorDist > OPAQUE_THRESHOLD) {
        alpha = 1.0;  // Fully opaque
    } else {
        // Smooth transition only in the middle range
        alpha = smoothstep(TRANSPARENT_THRESHOLD, OPAQUE_THRESHOLD, colorDist);
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
            src="https://v3.fal.media/files/rabbit/ODZjIWFmKLwzJ7hdM9mlK_output.mp4" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
} 