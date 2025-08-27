export function generateQRCodeUrl(data: string, size: number = 200): string {
  // Using QR Server API for QR code generation
  const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: data,
    format: 'png',
    bgcolor: '000000',
    color: '00ff41',
    qzone: '1'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

export function generateJoinUrl(): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/join`;
}
