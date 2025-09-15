export interface PosterData {
  player1: {
    name: string;
    rating: number;
    city: string;
    avatar?: string;
    record?: string;
    nickname?: string;
  };
  player2: {
    name: string;
    rating: number;
    city: string;
    avatar?: string;
    record?: string;
    nickname?: string;
  };
  event: {
    title: string;
    date: string;
    time?: string;
    location: string;
    stakes: string;
    gameType?: string;
    tableType?: string;
    hypeText?: string;
    callToAction?: string;
  };
  content?: {
    tagline?: string;
    challenge?: string;
  };
  design?: {
    template: 'fight-night' | 'championship' | 'classic' | 'neon';
    theme: 'dark' | 'green' | 'gold' | 'neon';
  };
}

// Theme color configurations
const themeColors = {
  dark: {
    primary: '#00ff41',
    secondary: '#22c55e', 
    accent: '#85bb65',
    background: ['#1a4a2e', '#0f2818', '#0a0a0a'],
    text: '#ffffff',
    highlight: '#ff4d6d'
  },
  green: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#047857',
    background: ['#064e3b', '#022c22', '#000000'],
    text: '#ffffff',
    highlight: '#fbbf24'
  },
  gold: {
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#d97706',
    background: ['#451a03', '#292524', '#0c0a09'],
    text: '#fef3c7',
    highlight: '#dc2626'
  },
  neon: {
    primary: '#a855f7',
    secondary: '#ec4899',
    accent: '#06b6d4',
    background: ['#1e1b4b', '#0f0f23', '#000000'],
    text: '#e879f9',
    highlight: '#f97316'
  }
};

// Main poster generation function that routes to specific templates
export function generatePoster(data: PosterData): Promise<string> {
  const template = data.design?.template || 'fight-night';
  
  switch (template) {
    case 'fight-night':
      return generateFightNightPoster(data);
    case 'championship':
      return generateChampionshipPoster(data);
    case 'classic':
      return generateClassicPoster(data);
    case 'neon':
      return generateNeonPoster(data);
    default:
      return generateFightNightPoster(data);
  }
}

export function generateFightNightPoster(data: PosterData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 1200;
    
    // Get theme colors
    const theme = data.design?.theme || 'dark';
    const colors = themeColors[theme as keyof typeof themeColors];
    
    // Background
    const gradient = ctx.createRadialGradient(400, 600, 0, 400, 600, 600);
    gradient.addColorStop(0, colors.background[0]);
    gradient.addColorStop(0.5, colors.background[1]);
    gradient.addColorStop(1, colors.background[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);
    
    // Add subtle texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 1200;
      ctx.fillRect(x, y, 2, 2);
    }
    
    // Hype Text (AI generated)
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 52px Inter';
    ctx.textAlign = 'center';
    const hypeText = data.event.hypeText || 'FIGHT NIGHT';
    ctx.fillText(hypeText.toUpperCase(), 400, 120);
    
    // Event title
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 36px Inter';
    ctx.fillText(data.event.title, 400, 180);
    
    // Tagline (AI generated)
    if (data.content?.tagline) {
      ctx.fillStyle = colors.accent;
      ctx.font = 'italic 18px Inter';
      ctx.fillText(data.content.tagline, 400, 210);
    }
    
    // VS section with dramatic styling
    ctx.save();
    ctx.shadowColor = colors.highlight;
    ctx.shadowBlur = 20;
    ctx.fillStyle = colors.highlight;
    ctx.font = 'bold 80px Inter';
    ctx.fillText('VS', 400, 620);
    ctx.restore();
    
    // Player 1 (Left side)
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 36px Inter';
    
    // Player name with shadow effect
    ctx.save();
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 10;
    ctx.fillText(data.player1.name.toUpperCase(), 50, 400);
    ctx.restore();
    
    // Player stats
    ctx.font = '24px Inter';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`Rating: ${data.player1.rating}`, 50, 440);
    ctx.fillText(data.player1.city, 50, 470);
    if (data.player1.record) {
      ctx.fillText(`Record: ${data.player1.record}`, 50, 500);
    }
    
    // Player 2 (Right side)
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 36px Inter';
    
    // Player name with shadow effect
    ctx.save();
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 10;
    ctx.fillText(data.player2.name.toUpperCase(), 750, 400);
    ctx.restore();
    
    // Player stats
    ctx.font = '24px Inter';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`Rating: ${data.player2.rating}`, 750, 440);
    ctx.fillText(data.player2.city, 750, 470);
    if (data.player2.record) {
      ctx.fillText(`Record: ${data.player2.record}`, 750, 500);
    }
    
    // Event details section
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.text;
    ctx.font = '28px Inter';
    ctx.fillText(data.event.date, 400, 800);
    if (data.event.time) {
      ctx.fillText(`${data.event.time}`, 400, 840);
    }
    ctx.fillText(data.event.location, 400, 880);
    ctx.fillText(data.event.stakes, 400, 920);
    
    // Call to Action (AI generated)
    if (data.event.callToAction) {
      ctx.fillStyle = colors.highlight;
      ctx.font = 'bold 32px Inter';
      ctx.fillText(data.event.callToAction.toUpperCase(), 400, 980);
    }
    
    // Footer branding
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 36px Inter';
    ctx.fillText('ACTIONLADDER', 400, 1100);
    ctx.font = '20px Inter';
    ctx.fillStyle = colors.secondary;
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

// Championship template - formal and prestigious
export function generateChampionshipPoster(data: PosterData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 800;
    canvas.height = 1200;
    
    const theme = data.design?.theme || 'gold';
    const colors = themeColors[theme as keyof typeof themeColors];
    
    // Elegant background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
    gradient.addColorStop(0, colors.background[0]);
    gradient.addColorStop(0.5, colors.background[1]);
    gradient.addColorStop(1, colors.background[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);
    
    // Decorative border
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 1160);
    
    // Championship banner
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('CHAMPIONSHIP', 400, 80);
    
    // Event title
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 40px Inter';
    ctx.fillText(data.event.title, 400, 140);
    
    // Hype text (AI generated)
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 28px Inter';
    ctx.fillText(data.event.hypeText || 'ELITE SHOWDOWN', 400, 180);
    
    // Players in formal layout
    const centerY = 600;
    
    // Player 1 - formal presentation
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 32px Inter';
    ctx.fillText(data.player1.name, 200, centerY - 60);
    
    ctx.font = '20px Inter';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`Rating: ${data.player1.rating}`, 200, centerY - 30);
    ctx.fillText(data.player1.city, 200, centerY);
    if (data.player1.record) {
      ctx.fillText(data.player1.record, 200, centerY + 30);
    }
    
    // VS separator
    ctx.fillStyle = colors.highlight;
    ctx.font = 'bold 48px Inter';
    ctx.fillText('VS', 400, centerY - 20);
    
    // Player 2 - formal presentation
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 32px Inter';
    ctx.fillText(data.player2.name, 600, centerY - 60);
    
    ctx.font = '20px Inter';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`Rating: ${data.player2.rating}`, 600, centerY - 30);
    ctx.fillText(data.player2.city, 600, centerY);
    if (data.player2.record) {
      ctx.fillText(data.player2.record, 600, centerY + 30);
    }
    
    // Event details
    ctx.fillStyle = colors.text;
    ctx.font = '24px Inter';
    ctx.fillText(data.event.date, 400, 800);
    if (data.event.time) {
      ctx.fillText(data.event.time, 400, 840);
    }
    ctx.fillText(data.event.location, 400, 880);
    ctx.fillText(data.event.stakes, 400, 920);
    
    // Call to action
    if (data.event.callToAction) {
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 28px Inter';
      ctx.fillText(data.event.callToAction, 400, 980);
    }
    
    // Tagline
    if (data.content?.tagline) {
      ctx.fillStyle = colors.accent;
      ctx.font = 'italic 18px Inter';
      ctx.fillText(data.content.tagline, 400, 1020);
    }
    
    // Footer
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 32px Inter';
    ctx.fillText('ACTIONLADDER', 400, 1100);
    ctx.font = '18px Inter';
    ctx.fillText('Championship Series', 400, 1130);
    
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, 'image/png');
  });
}

// Classic template - timeless billiards design
export function generateClassicPoster(data: PosterData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 800;
    canvas.height = 1200;
    
    const theme = data.design?.theme || 'green';
    const colors = themeColors[theme as keyof typeof themeColors];
    
    // Pool table felt background
    ctx.fillStyle = colors.background[1];
    ctx.fillRect(0, 0, 800, 1200);
    
    // Add felt texture pattern
    ctx.fillStyle = colors.background[0];
    for (let x = 0; x < 800; x += 20) {
      for (let y = 0; y < 1200; y += 20) {
        if ((x + y) % 40 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    
    // Classic billiards header
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('BILLIARDS CHALLENGE', 400, 100);
    
    // Event title
    ctx.fillStyle = colors.text;
    ctx.font = '32px serif';
    ctx.fillText(data.event.title, 400, 150);
    
    // Hype text with classic styling
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 24px serif';
    ctx.fillText(data.event.hypeText || 'CLASSIC MATCHUP', 400, 190);
    
    // Players with traditional layout
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 28px serif';
    ctx.fillText(data.player1.name, 100, 350);
    
    ctx.font = '20px serif';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`Skill Level: ${data.player1.rating}`, 100, 380);
    ctx.fillText(`From: ${data.player1.city}`, 100, 410);
    if (data.player1.record) {
      ctx.fillText(`Record: ${data.player1.record}`, 100, 440);
    }
    
    // Classic VS
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.highlight;
    ctx.font = 'bold 36px serif';
    ctx.fillText('VERSUS', 400, 500);
    
    // Player 2
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 28px serif';
    ctx.fillText(data.player2.name, 700, 350);
    
    ctx.font = '20px serif';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`Skill Level: ${data.player2.rating}`, 700, 380);
    ctx.fillText(`From: ${data.player2.city}`, 700, 410);
    if (data.player2.record) {
      ctx.fillText(`Record: ${data.player2.record}`, 700, 440);
    }
    
    // Event information
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.text;
    ctx.font = '24px serif';
    ctx.fillText(data.event.date, 400, 700);
    if (data.event.time) {
      ctx.fillText(data.event.time, 400, 730);
    }
    ctx.fillText(`At ${data.event.location}`, 400, 760);
    ctx.fillText(data.event.stakes, 400, 790);
    
    // Call to action
    if (data.event.callToAction) {
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 26px serif';
      ctx.fillText(data.event.callToAction, 400, 850);
    }
    
    // Classic tagline
    if (data.content?.tagline) {
      ctx.fillStyle = colors.accent;
      ctx.font = 'italic 20px serif';
      ctx.fillText(data.content.tagline, 400, 900);
    }
    
    // Traditional footer
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 28px serif';
    ctx.fillText('ActionLadder League', 400, 1080);
    ctx.font = '16px serif';
    ctx.fillText('Established Pool Hall Competition', 400, 1110);
    
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, 'image/png');
  });
}

// Neon template - modern cyberpunk aesthetic
export function generateNeonPoster(data: PosterData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 800;
    canvas.height = 1200;
    
    const theme = data.design?.theme || 'neon';
    const colors = themeColors[theme as keyof typeof themeColors];
    
    // Cyberpunk background
    ctx.fillStyle = colors.background[2];
    ctx.fillRect(0, 0, 800, 1200);
    
    // Grid pattern
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1200);
      ctx.stroke();
    }
    for (let y = 0; y < 1200; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Neon title with glow effect
    ctx.save();
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 20;
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◄ NEON CHALLENGE ►', 400, 120);
    ctx.restore();
    
    // Event title with cyberpunk styling
    ctx.save();
    ctx.shadowColor = colors.secondary;
    ctx.shadowBlur = 15;
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 32px monospace';
    ctx.fillText(data.event.title.toUpperCase(), 400, 170);
    ctx.restore();
    
    // Hype text with electric effect
    ctx.save();
    ctx.shadowColor = colors.highlight;
    ctx.shadowBlur = 25;
    ctx.fillStyle = colors.highlight;
    ctx.font = 'bold 28px monospace';
    ctx.fillText(data.event.hypeText || 'DIGITAL WARFARE', 400, 210);
    ctx.restore();
    
    // Players in cyberpunk boxes
    const drawNeonBox = (x: number, y: number, width: number, height: number) => {
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    };
    
    // Player 1 box
    drawNeonBox(50, 300, 280, 200);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.player1.name.toUpperCase(), 190, 340);
    
    ctx.font = '16px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`[RATING: ${data.player1.rating}]`, 190, 370);
    ctx.fillText(`[LOCATION: ${data.player1.city}]`, 190, 390);
    if (data.player1.record) {
      ctx.fillText(`[W/L: ${data.player1.record}]`, 190, 410);
    }
    
    // VS with electric effect
    ctx.save();
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 30;
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ VS ]', 400, 420);
    ctx.restore();
    
    // Player 2 box
    drawNeonBox(470, 300, 280, 200);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.player2.name.toUpperCase(), 610, 340);
    
    ctx.font = '16px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`[RATING: ${data.player2.rating}]`, 610, 370);
    ctx.fillText(`[LOCATION: ${data.player2.city}]`, 610, 390);
    if (data.player2.record) {
      ctx.fillText(`[W/L: ${data.player2.record}]`, 610, 410);
    }
    
    // Event data in terminal style
    ctx.fillStyle = colors.primary;
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('> DATE:', 100, 600);
    ctx.fillStyle = colors.text;
    ctx.fillText(data.event.date, 200, 600);
    
    if (data.event.time) {
      ctx.fillStyle = colors.primary;
      ctx.fillText('> TIME:', 100, 630);
      ctx.fillStyle = colors.text;
      ctx.fillText(data.event.time, 200, 630);
    }
    
    ctx.fillStyle = colors.primary;
    ctx.fillText('> LOCATION:', 100, 660);
    ctx.fillStyle = colors.text;
    ctx.fillText(data.event.location, 230, 660);
    
    ctx.fillStyle = colors.primary;
    ctx.fillText('> STAKES:', 100, 690);
    ctx.fillStyle = colors.text;
    ctx.fillText(data.event.stakes, 200, 690);
    
    // Call to action with neon glow
    if (data.event.callToAction) {
      ctx.save();
      ctx.shadowColor = colors.highlight;
      ctx.shadowBlur = 20;
      ctx.fillStyle = colors.highlight;
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`>> ${data.event.callToAction} <<`, 400, 800);
      ctx.restore();
    }
    
    // Cyberpunk tagline
    if (data.content?.tagline) {
      ctx.fillStyle = colors.accent;
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.content.tagline, 400, 860);
    }
    
    // Neon footer
    ctx.save();
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 15;
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ACTIONLADDER.NET', 400, 1080);
    ctx.restore();
    
    ctx.fillStyle = colors.secondary;
    ctx.font = '16px monospace';
    ctx.fillText('[DIGITAL POOL ARENA]', 400, 1110);
    
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, 'image/png');
  });
}

// Break and Run celebration poster
export function generateBreakAndRunPoster(playerName: string, amount: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 800;
    canvas.height = 800;
    
    // Celebration background
    const gradient = ctx.createRadialGradient(400, 400, 0, 400, 400, 400);
    gradient.addColorStop(0, '#ffb703');
    gradient.addColorStop(0.7, '#ff4d6d');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);
    
    // Celebration particles
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 800;
      const size = Math.random() * 8 + 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Title with glow
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('💥 BREAK & RUN! 💥', 400, 200);
    ctx.restore();
    
    // Player name with emphasis
    ctx.save();
    ctx.shadowColor = '#ff4d6d';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter';
    ctx.fillText(playerName.toUpperCase(), 400, 300);
    ctx.restore();
    
    // Amount with golden glow
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#85bb65';
    ctx.font = 'bold 72px Inter';
    ctx.fillText(`$${amount}`, 400, 450);
    ctx.restore();
    
    // Celebration text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter';
    ctx.fillText('JACKPOT CLAIMED!', 400, 550);
    
    // Achievement note
    ctx.fillStyle = '#fbbf24';
    ctx.font = '24px Inter';
    ctx.fillText('Perfect game achievement unlocked', 400, 590);
    
    // Footer
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 28px Inter';
    ctx.fillText('ACTIONLADDER', 400, 700);
    ctx.font = '18px Inter';
    ctx.fillText('Pool. Points. Pride.', 400, 730);
    
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, 'image/png');
  });
}