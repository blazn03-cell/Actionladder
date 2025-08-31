export interface PosterData {
  player1: {
    name: string;
    rating: number;
    city: string;
    avatar?: string;
  };
  player2: {
    name: string;
    rating: number;
    city: string;
    avatar?: string;
  };
  event: {
    title: string;
    date: string;
    location: string;
    stakes: string;
  };
}

export function generateFightNightPoster(data: PosterData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 1200;
    
    // Background
    const gradient = ctx.createRadialGradient(400, 600, 0, 400, 600, 600);
    gradient.addColorStop(0, '#1a4a2e');
    gradient.addColorStop(0.5, '#0f2818');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);
    
    // Title
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('FIGHT NIGHT', 400, 100);
    
    // Event title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter';
    ctx.fillText(data.event.title, 400, 160);
    
    // VS text
    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 72px Inter';
    ctx.fillText('VS', 400, 600);
    
    // Player 1
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(data.player1.name, 50, 400);
    ctx.font = '24px Inter';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`Rating: ${data.player1.rating}`, 50, 440);
    ctx.fillText(data.player1.city, 50, 470);
    
    // Player 2
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(data.player2.name, 750, 400);
    ctx.font = '24px Inter';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`Rating: ${data.player2.rating}`, 750, 440);
    ctx.fillText(data.player2.city, 750, 470);
    
    // Event details
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(data.event.date, 400, 800);
    ctx.fillText(data.event.location, 400, 840);
    ctx.fillText(`Stakes: ${data.event.stakes}`, 400, 880);
    
    // Footer
    ctx.fillStyle = '#85bb65';
    ctx.font = 'bold 28px Inter';
    ctx.fillText('ACTIONLADDER', 400, 1100);
    ctx.font = '18px Inter';
    ctx.fillText('Pool. Points. Pride.', 400, 1130);
    
    // Convert to blob URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }
    }, 'image/png');
  });
}

export function generateBreakAndRunPoster(playerName: string, amount: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 800;
    
    // Background
    const gradient = ctx.createRadialGradient(400, 400, 0, 400, 400, 400);
    gradient.addColorStop(0, '#ffb703');
    gradient.addColorStop(0.7, '#ff4d6d');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('💥 BREAK & RUN! 💥', 400, 200);
    
    // Player name
    ctx.font = 'bold 48px Inter';
    ctx.fillText(playerName, 400, 300);
    
    // Amount
    ctx.fillStyle = '#85bb65';
    ctx.font = 'bold 72px Inter';
    ctx.fillText(`$${amount}`, 400, 450);
    
    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Inter';
    ctx.fillText('JACKPOT CLAIMED!', 400, 550);
    
    // Footer
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 28px Inter';
    ctx.fillText('ACTIONLADDER', 400, 700);
    
    // Convert to blob URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }
    }, 'image/png');
  });
}
