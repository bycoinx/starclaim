import { CONFIG } from '../../../constants/Config';
import { SecurityService } from '../../../lib/security';

export async function claimStar({ star, customName, paymentMethod }) {
  const session = await SecurityService.getSession();
  if (!session?.token || !session?.user) {
    throw new Error('Satin alma islemi icin StarClaim hesabina giris yapin.');
  }

  const baseUrl = await CONFIG.getAPIUrl();
  const starId = star?.star_id || star?.starId || star?.id;
  const response = await fetch(`${baseUrl}/api/stars/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      star_id: starId,
      custom_name: customName || star?.proper || star?.properName || star?.name,
      payment_method: paymentMethod,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Satin alma islemi basarisiz oldu (${response.status}).`);
  }

  return normalizeClaimResponse(data, { star, customName, paymentMethod });
}

function normalizeClaimResponse(data, context) {
  const claimedStar = data.star || {};
  const star = context.star || {};
  const createdAt = claimedStar.claimed_at || new Date().toISOString();
  return {
    id: data.order_id || `local-${Date.now()}`,
    orderId: data.order_id || '',
    starId: claimedStar.star_id || star.star_id || star.starId || star.id || '',
    canonicalId: claimedStar.canonical_id || star.canonicalId || '',
    catalogId: claimedStar.catalog_id || star.catalogId || '',
    sourceId: claimedStar.source_id || star.sourceId || '',
    gaiaSourceId: claimedStar.gaia_source_id || star.gaiaSourceId || star.gaiaId || '',
    hip: claimedStar.hip || star.hip || '',
    hd: claimedStar.hd || star.hd || '',
    starClaimCode: claimedStar.code || data.star_claim_code || data.starClaimCode || data.code || '',
    name: claimedStar.custom_name || context.customName || claimedStar.name || star.proper || star.properName || star.name || 'Yeni Yildiz',
    constellation: claimedStar.constellation || star.constellation || '',
    ra: claimedStar.ra ?? star.ra,
    dec: claimedStar.dec ?? star.dec,
    method: context.paymentMethod,
    message: claimedStar.personal_message || '',
    createdAt,
    date: createdAt,
    verified: true,
    raw: data,
  };
}
