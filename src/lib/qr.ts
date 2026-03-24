import QRCode from 'qrcode';

export function generateCheckInCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SS-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function generateQRCodeSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    width: 200,
  });
}
