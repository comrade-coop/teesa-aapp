'use client';

import { usePrivy } from '@privy-io/react-auth';
import { VideoBackground } from './video-background';

export function BackgroundContainer() {
  const { ready, authenticated, login } = usePrivy();
  
  return <VideoBackground isLoggedIn={authenticated} onLogin={login} />;
} 