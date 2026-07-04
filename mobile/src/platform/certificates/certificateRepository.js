import { Buffer } from 'buffer';
import { File, Paths } from 'expo-file-system';
import { CONFIG } from '../../../constants/Config';
import { SecurityService } from '../../../lib/security';

export async function downloadCertificatePdf(orderId) {
  if (!orderId) return null;
  const session = await SecurityService.getSession();
  if (!session?.token) return null;

  const baseUrl = await CONFIG.getAPIUrl();
  const response = await fetch(`${baseUrl}/api/orders/certificate/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!response.ok) return null;

  const bytes = new Uint8Array(await response.arrayBuffer());
  const file = new File(Paths.cache, `starclaim-certificate-${orderId}.pdf`);
  file.write(bytes);
  return file.uri;
}

export function htmlToDataUri(html) {
  return `data:text/html;base64,${Buffer.from(html, 'utf8').toString('base64')}`;
}
