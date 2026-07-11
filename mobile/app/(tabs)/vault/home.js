import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpaceBackground from '../../../components/SpaceBackground';
import { Audio } from 'expo-av';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Sharing from 'expo-sharing';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES, starDetailRoute, starMapRoute } from '../../../src/platform/navigation/routes';
import { useOwnershipStore } from '../../../src/platform/ownership/ownershipStore';
import { useVaultStore } from '../../../src/platform/vault/vaultStore';
import { useCatalogStore } from '../../../src/platform/stars/catalogStore';
import { getPurchaseMapParams } from '../../../src/utils/starIdentity';
import { downloadCertificatePdf } from '../../../src/platform/certificates/certificateRepository';

const quickActions = [
  { label: 'Yildiz Al', icon: 'star', href: ROUTES.claim },
  { label: 'Sertifikalar', icon: 'shield-check', href: ROUTES.vaultPurchases },
  { label: 'Hikaye Ekle', icon: 'book-plus-outline', href: ROUTES.vaultNewMessage },
  { label: 'Pazaryeri', icon: 'globe', href: ROUTES.marketplace },
  { label: 'Guvenlik', icon: 'shield-lock-outline', href: ROUTES.vaultLockSettings },
  { label: 'Profil', icon: 'account-circle-outline', href: ROUTES.profile },
];

function starKeys(star = {}) {
  return [
    star.starId,
    star.star_id,
    star.id,
    star.canonicalId,
    star.catalogId,
    star.starClaimCode,
    star.code,
    star.hip,
  ]
    .filter(Boolean)
    .map((value) => String(value));
}

function buildStarIndex(stars = []) {
  const index = new Map();
  stars.forEach((star) => {
    starKeys(star).forEach((key) => index.set(key, star));
  });
  return index;
}

function normalizeVaultStar(record = {}, catalogStar = {}) {
  const raw = { ...catalogStar, ...record };
  const id = raw.starId || raw.star_id || raw.id || raw.canonicalId || raw.code || `star-${raw.name || 'unknown'}`;
  const name = raw.name || raw.displayName || raw.properName || 'StarClaim Star';
  const price = Number(raw.price || raw.askingPrice || raw.asking_price || 0);
  const storyCount = Number(raw.storyCount || raw.stories_count || (raw.message ? 1 : 0) || 0);
  const verified = Boolean(raw.verified || raw.orderId || raw.order_id || raw.starClaimCode || raw.code);

  return {
    ...raw,
    starId: String(id),
    id: String(id),
    name,
    code: raw.code || raw.starClaimCode || raw.star_code || String(id).slice(0, 12),
    orderId: raw.orderId || raw.order_id || '',
    constellation: raw.constellation || 'Unknown',
    spectralType: raw.spectralType || raw.spect || 'N/A',
    magnitude: raw.magnitude ?? raw.mag ?? 'N/A',
    distanceParsec: raw.distanceParsec ?? raw.distance ?? raw.dist ?? null,
    rarity: raw.rarity || raw.tierLabel || raw.tier || 'Standard',
    ownedSince: raw.ownedSince || raw.createdAt || raw.date || raw.claimed_at || 'Recently',
    owner: raw.owner || raw.ownerName || raw.owner_name || 'Pilot',
    ownershipStatus: verified ? 'Private Reserve' : 'Local Vault',
    certificateStatus: verified ? 'Verified' : 'Pending',
    sharedStatus: 'Private',
    price,
    storyCount,
    memoryCount: storyCount ? storyCount * 3 : (raw.message ? 1 : 0),
    verified,
    raw,
  };
}

function buildVaultStars(records = [], catalogStars = []) {
  const index = buildStarIndex(catalogStars);
  if (!records.length) {
    return [];
  }

  return records.map((record) => {
    const match = starKeys(record).map((key) => index.get(key)).find(Boolean) || {};
    return normalizeVaultStar(record, match);
  });
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${Math.round(amount)}`;
}

function formatDistance(star) {
  const parsec = Number(star.distanceParsec ?? star.distance ?? star.dist);
  if (!Number.isFinite(parsec) || parsec <= 0) return 'N/A';
  return `${parsec.toFixed(parsec < 10 ? 1 : 0)} pc`;
}

function shortDate(value) {
  if (!value || value === 'Recently') return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function VaultHomeScreen() {
  const soundRef = useRef(null);
  const router = useRouter();
  const ownershipRecords = useOwnershipStore((state) => state.records);
  const ownershipSummary = useOwnershipStore((state) => state.summary);
  const ownershipLoading = useOwnershipStore((state) => state.loading);
  const ownershipError = useOwnershipStore((state) => state.error);
  const ownershipLoadedAt = useOwnershipStore((state) => state.loadedAt);
  const loadOwnership = useOwnershipStore((state) => state.load);
  const refreshOwnership = useOwnershipStore((state) => state.refresh);
  const messages = useVaultStore((state) => state.messages);
  const unlocked = useVaultStore((state) => state.unlockedIds);
  const vaultSummary = useVaultStore((state) => state.summary);
  const loadVault = useVaultStore((state) => state.load);
  const unlockVault = useVaultStore((state) => state.unlock);
  const playingId = useVaultStore((state) => state.playingId);
  const setPlayingId = useVaultStore((state) => state.setPlayingId);
  const catalogStars = useCatalogStore((state) => state.stars);
  const loadCatalog = useCatalogStore((state) => state.loadCatalog);

  const [selectedStarId, setSelectedStarId] = useState(null);
  const [previewStar, setPreviewStar] = useState(null);
  const [certificateBusyId, setCertificateBusyId] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      loadOwnership();
      loadVault();
      loadCatalog();
    }, [loadOwnership, loadVault, loadCatalog])
  );

  const vaultStars = useMemo(
    () => buildVaultStars(ownershipRecords, catalogStars),
    [ownershipRecords, catalogStars]
  );

  const selectedStar = useMemo(() => {
    return vaultStars.find((star) => star.starId === selectedStarId) || vaultStars[0] || null;
  }, [selectedStarId, vaultStars]);

  const totalValue = vaultStars.reduce((sum, star) => sum + Number(star.price || 0), 0);
  const verifiedCount = vaultStars.filter((star) => star.certificateStatus === 'Verified').length;
  const storyCount = vaultStars.reduce((sum, star) => sum + Number(star.storyCount || 0), 0);
  const constellations = Array.from(new Set(vaultStars.map((star) => star.constellation).filter(Boolean)));
  const legendaryCount = vaultStars.filter((star) => String(star.rarity || '').toLowerCase().includes('legend')).length;
  const rank = vaultStars.length >= 8 ? 'Galactic' : vaultStars.length >= 5 ? 'Voyager' : vaultStars.length >= 3 ? 'Navigator' : vaultStars.length >= 1 ? 'Explorer' : 'Cadet';
  const syncLabel = ownershipLoading
    ? 'Senkronize ediliyor'
    : ownershipError
      ? 'Yerel kayit kullaniliyor'
      : ownershipLoadedAt
        ? `Son sync ${shortDate(ownershipLoadedAt)}`
        : 'Sync bekleniyor';

  const stats = [
    { label: 'Sahip Yildiz', value: String(vaultStars.length || ownershipSummary.ownedStars || 0), icon: 'star-four-points' },
    { label: 'Sertifika', value: String(verifiedCount || ownershipSummary.certificates || 0), icon: 'shield-check' },
    { label: 'Hikaye', value: String(storyCount || vaultSummary.totalItems || 0), icon: 'book-open-page-variant' },
    { label: 'Deger', value: formatMoney(totalValue), icon: 'diamond-stone' },
  ];

  const isUnlocked = (item) => {
    if (unlocked.includes(String(item.id))) return true;
    if (!item.lockType || item.lockType === 'none') return true;
    if (item.lockType === 'date' && item.lockValue) {
      const ts = Number(item.lockValue) || Date.parse(item.lockValue);
      return !Number.isNaN(ts) && Date.now() >= ts;
    }
    return false;
  };

  const tryUnlock = async (item) => {
    if (item.lockType === 'date') {
      const ts = Number(item.lockValue) || Date.parse(item.lockValue);
      if (!Number.isNaN(ts) && Date.now() >= ts) {
        await unlockVault(item.id);
        Alert.alert('Sistem Onayi', 'Kilit acildi. Veri erisilebilir.');
      } else {
        Alert.alert('Erisim Reddi', 'Kilit suresi henuz dolmadi.');
      }
      return;
    }

    if (item.lockType === 'person') {
      try {
        const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Biyometrik dogrulama gerekli' });
        if (res.success) {
          await unlockVault(item.id);
          Alert.alert('Yetki Verildi', 'Kimlik dogrulandi.');
        } else {
          Alert.alert('Hata', 'Dogrulama basarisiz.');
        }
      } catch (e) {
        Alert.alert('Sistem Hatasi', String(e));
      }
      return;
    }

    Alert.alert('Guvenli Erisim', 'Bu veriyi manuel olarak acmak istiyor musunuz?', [
      { text: 'Iptal' },
      {
        text: 'Evet',
        onPress: async () => {
          await unlockVault(item.id);
          Alert.alert('Veri Acildi');
        },
      },
    ]);
  };

  const stopAndUnload = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.warn(e);
    }
    setPlayingId(null);
  };

  const playAudio = async (item) => {
    if (!isUnlocked(item)) return tryUnlock(item);
    try {
      if (soundRef.current) {
        await stopAndUnload();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: item.audioUri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) stopAndUnload();
      });
    } catch (e) {
      console.warn(e);
      Alert.alert('Sistem Hatasi', String(e));
    }
  };

  const viewMessage = (item) => {
    if (item.type === 'text') {
      Alert.alert(item.title || 'Vault Metni', item.text || 'Bu icerik su anda goruntulenemiyor.');
      return;
    }

    if (item.type === 'audio') {
      playAudio(item);
      return;
    }

    Alert.alert('Bilgi', 'Bu oge icin bir islem yapilamiyor.');
  };

  const goToStarMap = (star) => {
    router.push(starMapRoute(getPurchaseMapParams(star)));
  };

  const goToStarDetail = (star) => {
    router.push(starDetailRoute({ starId: star.starId, name: star.name }));
  };

  const refreshVault = async () => {
    await Promise.all([refreshOwnership(), loadVault(), loadCatalog()]);
  };

  const shareCertificate = async (star) => {
    if (!star?.orderId) {
      Alert.alert('Sertifika Hazir Degil', 'Bu yildiz icin dogrulanmis orderId bulunamadi.');
      return;
    }
    try {
      setCertificateBusyId(star.starId);
      const uri = await downloadCertificatePdf(star.orderId);
      if (!uri) {
        Alert.alert('Sertifika Alinamadi', 'PDF icin oturum veya sunucu yaniti dogrulanamadi.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Sertifika Hatasi', error.message || String(error));
    } finally {
      setCertificateBusyId(null);
    }
  };

  const renderVaultStar = (star) => {
    const selected = selectedStar?.starId === star.starId;
    return (
      <TouchableOpacity
        key={star.starId}
        style={[styles.starCard, selected && styles.starCardSelected]}
        onPress={() => setSelectedStarId(star.starId)}
        activeOpacity={0.85}
      >
        <View style={styles.starGlyph}>
          <MaterialCommunityIcons name="star-four-points" size={28} color={THEME.colors.secondary} />
        </View>
        <View style={styles.starContent}>
          <View style={styles.starHeader}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.starName}>{star.name}</Text>
              <Text numberOfLines={1} style={styles.starMeta}>{star.code} / {star.constellation}</Text>
            </View>
            <View style={[styles.statusPill, star.verified ? styles.verifiedPill : styles.pendingPill]}>
              <Text style={styles.statusPillText}>{star.verified ? 'VERIFIED' : 'LOCAL'}</Text>
            </View>
          </View>

          <View style={styles.starDataRow}>
            <Text style={styles.starData}>{String(star.rarity).toUpperCase()}</Text>
            <Text style={styles.starData}>{formatDistance(star)}</Text>
            <Text style={styles.starData}>{formatMoney(star.price)}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.smallButton} onPress={() => setPreviewStar(star)}>
              <Text style={styles.smallButtonText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButtonDark} onPress={() => goToStarMap(star)}>
              <Text style={styles.smallButtonDarkText}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = (item) => {
    const unlockedState = isUnlocked(item);
    return (
      <View key={item.id} style={[styles.messageCard, { borderColor: unlockedState ? THEME.colors.primary + '30' : THEME.colors.secondary + '20' }]}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageType}>{item.type === 'audio' ? 'VOICE LOG' : 'DATA ENTRY'}</Text>
          <View style={[styles.messageBadge, { backgroundColor: unlockedState ? THEME.colors.primary + '12' : THEME.colors.secondary + '12' }]}>
            <Text style={[styles.messageBadgeText, { color: unlockedState ? THEME.colors.primary : THEME.colors.secondary }]}>
              {unlockedState ? 'ACIK' : 'KILITLI'}
            </Text>
          </View>
        </View>
        <Text numberOfLines={2} style={[styles.messageTitle, !unlockedState && styles.lockedText]}>
          {unlockedState ? (item.type === 'text' ? item.text : 'ACTIVE_AUDIO_BROADCAST') : 'Sifrelenmis icerik gizlendi'}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageMeta}>PROTOKOL: {String(item.lockType || 'none').toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: unlockedState ? THEME.colors.primary : THEME.colors.secondary }]}
            onPress={() => (unlockedState ? viewMessage(item) : tryUnlock(item))}
          >
            <Text style={styles.actionBtnText}>
              {unlockedState ? (item.type === 'audio' ? (playingId === item.id ? 'DURDUR' : 'OYNAT') : 'GORUNTULE') : 'KILIDI AC'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'transparent', 'rgba(0,0,0,0.98)']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <LinearGradient colors={['rgba(8,14,31,0.96)', 'rgba(3,7,18,0.94)']} style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>STARVAULT / LEGACY</Text>
              </View>
              <TouchableOpacity style={styles.heroAction} onPress={refreshVault}>
                <Text style={styles.heroActionText}>{ownershipLoading ? 'SYNC' : 'YENILE'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroTitle}>STARVAULT</Text>
            <Text style={styles.heroSubtitle}>
              Yildiz koleksiyonun, sertifikalarin, anilarin ve gelecek aktarimlarin icin web kalitesinde premium mobil kasa.
            </Text>
            <View style={[styles.syncStrip, ownershipError && styles.syncStripWarning]}>
              <MaterialCommunityIcons
                name={ownershipError ? 'cloud-alert-outline' : 'cloud-check-outline'}
                size={17}
                color={ownershipError ? THEME.colors.secondary : THEME.colors.primary}
              />
              <Text style={styles.syncText}>{syncLabel}</Text>
            </View>
            <View style={styles.metricsGrid}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.metricCard}>
                  <MaterialCommunityIcons name={stat.icon} size={18} color={THEME.colors.secondary} />
                  <Text style={styles.metricValue}>{stat.value}</Text>
                  <Text style={styles.metricLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Benim Takimyildizim</Text>
              <Text style={styles.sectionBadge}>{rank}</Text>
            </View>
            <Text style={styles.sectionDesc}>Sahiplik kayitlari katalog verisiyle eslestirilir; sertifika, hikaye ve piyasa bilgisi ayni kartta toplanir.</Text>
            {vaultStars.length ? vaultStars.map(renderVaultStar) : (
              <EmptyVaultState
                loading={ownershipLoading}
                error={ownershipError}
                onRefresh={refreshVault}
                onClaim={() => router.push(ROUTES.claim)}
              />
            )}
          </View>

          {selectedStar ? (
            <LinearGradient colors={['rgba(6,10,22,0.96)', 'rgba(11,16,38,0.9)']} style={styles.selectedPanel}>
              <View style={styles.panelTopRow}>
                <Text style={styles.panelEyebrow}>Vault Compass</Text>
                <Text style={styles.panelBadge}>{selectedStar.certificateStatus}</Text>
              </View>
              <Text style={styles.panelTitle}>{selectedStar.name}</Text>
              <Text style={styles.panelSub}>{selectedStar.constellation} / {selectedStar.spectralType}</Text>
              <View style={styles.panelStats}>
                <DataCell label="Magnitude" value={String(selectedStar.magnitude)} />
                <DataCell label="Distance" value={formatDistance(selectedStar)} />
                <DataCell label="Owner" value={selectedStar.owner} />
                <DataCell label="Since" value={shortDate(selectedStar.ownedSince)} />
              </View>
              <View style={styles.panelActions}>
                <TouchableOpacity style={styles.primaryPanelAction} onPress={() => goToStarDetail(selectedStar)}>
                  <Text style={styles.primaryPanelActionText}>Detay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryPanelAction} onPress={() => setPreviewStar(selectedStar)}>
                  <Text style={styles.secondaryPanelActionText}>Onizleme</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryPanelAction, !selectedStar.orderId && styles.disabledAction]}
                  onPress={() => shareCertificate(selectedStar)}
                  disabled={!selectedStar.orderId || certificateBusyId === selectedStar.starId}
                >
                  <Text style={styles.secondaryPanelActionText}>
                    {certificateBusyId === selectedStar.starId ? 'Hazir...' : 'PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Kisa Yollar</Text>
            <Text style={styles.sectionDesc}>Yildizlar, sertifikalar ve guvenli kayitlar icin dogrudan erisim.</Text>
            <View style={styles.actionGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity key={action.label} style={styles.actionTile} onPress={() => router.push(action.href)}>
                  <MaterialCommunityIcons name={action.icon} size={18} color={THEME.colors.primary} />
                  <Text style={styles.actionTileText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Sertifikalar</Text>
              <Text style={styles.sectionBadge}>{verifiedCount} Verified</Text>
            </View>
            {vaultStars.length ? vaultStars.slice(0, 4).map((star) => (
              <InfoRow
                key={`cert-${star.starId}`}
                icon="shield-check"
                title={`${star.name} Certificate`}
                detail={`${star.certificateStatus} / ${shortDate(star.ownedSince)}`}
              />
            )) : (
              <InfoRow
                icon="shield-alert-outline"
                title="Sertifika bekleniyor"
                detail="Ilk satin alma sonrasi web ve mobil ayni orderId ile PDF uretir."
              />
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Hikaye ve Anilar</Text>
              <Text style={styles.sectionBadge}>{messages.length} Kayit</Text>
            </View>
            {messages.length ? messages.slice(0, 4).map(renderMessage) : (
              <View style={styles.emptyMemoryCard}>
                <Text style={styles.emptyMemoryTitle}>Ilk guvenli kaydini olustur</Text>
                <Text style={styles.emptyMemoryText}>Mesaj, ses kaydi veya zaman kilitli ani ekleyerek StarVault'unu kullanmaya basla.</Text>
                <TouchableOpacity style={styles.ctaButton} onPress={() => router.push(ROUTES.vaultNewMessage)}>
                  <Text style={styles.ctaButtonText}>Hikaye Ekle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Koleksiyonlar</Text>
              <Text style={styles.sectionBadge}>{constellations.length} Grup</Text>
            </View>
            <View style={styles.collectionGrid}>
              <MiniPanel title="Constellation Vault" detail={`${constellations.length} takim`} icon="orbit" />
              <MiniPanel title="Legendary Archive" detail={`${legendaryCount} nadir`} icon="diamond-stone" />
              <MiniPanel title="Storyline Deck" detail={`${storyCount} hikaye`} icon="book-open-page-variant" />
              <MiniPanel title="Future Reserve" detail={`${vaultStars.length + 1} slot`} icon="lock-clock" />
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Vault Timeline</Text>
              <Text style={styles.sectionBadge}>Live</Text>
            </View>
            {vaultStars.length ? vaultStars.slice(0, 3).map((star) => (
              <InfoRow
                key={`timeline-${star.starId}`}
                icon="timeline-clock-outline"
                title={`${star.name} koleksiyona eklendi`}
                detail={`${shortDate(star.ownedSince)} / ${star.ownershipStatus}`}
              />
            )) : (
              <InfoRow
                icon="timeline-alert-outline"
                title="Timeline hazirlaniyor"
                detail="Sahiplik snapshot'i geldiginde kayitlar burada siralanir."
              />
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Guvenlik Durumu</Text>
              <Text style={styles.sectionBadge}>Optimal</Text>
            </View>
            <View style={styles.securityGrid}>
              {[
                { label: 'Sifreleme', value: 'Aktif' },
                { label: 'Yedekleme', value: 'Senkr.' },
                { label: 'Kilit', value: 'Hazir' },
              ].map((item) => (
                <View key={item.label} style={styles.securityCard}>
                  <Text style={styles.securityValue}>{item.value}</Text>
                  <Text style={styles.securityLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <PreviewModal
        star={previewStar}
        onClose={() => setPreviewStar(null)}
        onMap={goToStarMap}
        onDetail={goToStarDetail}
      />
    </View>
  );
}

function DataCell({ label, value }) {
  return (
    <View style={styles.dataCell}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.dataValue}>{value || 'N/A'}</Text>
    </View>
  );
}

function InfoRow({ icon, title, detail }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={THEME.colors.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.infoTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.infoDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function MiniPanel({ title, detail, icon }) {
  return (
    <View style={styles.miniPanel}>
      <MaterialCommunityIcons name={icon} size={20} color={THEME.colors.primary} />
      <Text style={styles.miniTitle}>{title}</Text>
      <Text style={styles.miniDetail}>{detail}</Text>
    </View>
  );
}

function EmptyVaultState({ loading, error, onRefresh, onClaim }) {
  return (
    <View style={styles.emptyVaultCard}>
      <MaterialCommunityIcons
        name={error ? 'cloud-alert-outline' : 'star-plus-outline'}
        size={34}
        color={error ? THEME.colors.secondary : THEME.colors.primary}
      />
      <Text style={styles.emptyVaultTitle}>
        {loading ? 'StarVault senkronize ediliyor' : error ? 'Snapshot okunamadi' : 'Henuz sahip yildiz yok'}
      </Text>
      <Text style={styles.emptyVaultText}>
        {error || 'Bir yildiz aldiginda sertifika, hikaye, timeline ve guvenlik kayitlari burada ayni ownership sozlesmesiyle gorunur.'}
      </Text>
      <View style={styles.emptyVaultActions}>
        <TouchableOpacity style={styles.ctaButton} onPress={onClaim}>
          <Text style={styles.ctaButtonText}>Yildiz Al</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryEmptyButton} onPress={onRefresh}>
          <Text style={styles.secondaryEmptyButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PreviewModal({ star, onClose, onMap, onDetail }) {
  if (!star) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <LinearGradient colors={['rgba(8,14,31,0.98)', 'rgba(3,7,18,0.98)']} style={styles.previewPanel}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewEyebrow}>Yildiz Onizlemesi</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.previewGlyph}>
            <MaterialCommunityIcons name="star-four-points" size={74} color={THEME.colors.secondary} />
          </View>
          <Text style={styles.previewTitle}>{star.name}</Text>
          <Text style={styles.previewSub}>{star.constellation} / {star.spectralType}</Text>
          <View style={styles.previewGrid}>
            <DataCell label="Fiyat" value={formatMoney(star.price)} />
            <DataCell label="Parlaklik" value={String(star.magnitude)} />
            <DataCell label="Uzaklik" value={formatDistance(star)} />
            <DataCell label="Owner" value={star.owner} />
          </View>
          <View style={styles.panelActions}>
            <TouchableOpacity style={styles.primaryPanelAction} onPress={() => onDetail(star)}>
              <Text style={styles.primaryPanelActionText}>Detay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryPanelAction} onPress={() => onMap(star)}>
              <Text style={styles.secondaryPanelActionText}>Harita</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  heroCard: { borderRadius: 28, padding: 24, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroBadge: { backgroundColor: 'rgba(119,191,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  heroBadgeText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroAction: { backgroundColor: THEME.colors.primary, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  heroActionText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  heroTitle: { color: '#fff', fontSize: 38, fontWeight: '900', lineHeight: 42, letterSpacing: 2 },
  heroSubtitle: { color: THEME.colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 14, marginBottom: 22 },
  syncStrip: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 14, backgroundColor: 'rgba(119,191,255,0.08)', borderWidth: 1, borderColor: 'rgba(119,191,255,0.16)' },
  syncStripWarning: { backgroundColor: 'rgba(230,188,74,0.08)', borderColor: 'rgba(230,188,74,0.18)' },
  syncText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  metricCard: { width: '50%', padding: 10, minHeight: 112, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  metricValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 10 },
  metricLabel: { color: THEME.colors.textMuted, fontSize: 9, marginTop: 7, letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionBlock: { marginBottom: 24 },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  sectionBadge: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionDesc: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  starCard: { flexDirection: 'row', gap: 14, borderRadius: 22, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  starCardSelected: { borderColor: THEME.colors.secondary + '80', backgroundColor: 'rgba(230,188,74,0.08)' },
  starGlyph: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(230,188,74,0.1)', borderWidth: 1, borderColor: 'rgba(230,188,74,0.18)' },
  starContent: { flex: 1 },
  starHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  starName: { color: '#fff', fontSize: 17, fontWeight: '900' },
  starMeta: { color: THEME.colors.textMuted, fontSize: 11, marginTop: 4 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1 },
  verifiedPill: { borderColor: 'rgba(16,185,129,0.35)', backgroundColor: 'rgba(16,185,129,0.12)' },
  pendingPill: { borderColor: 'rgba(230,188,74,0.35)', backgroundColor: 'rgba(230,188,74,0.1)' },
  statusPillText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  starDataRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  starData: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallButton: { borderRadius: 999, backgroundColor: THEME.colors.primary, paddingHorizontal: 14, paddingVertical: 9 },
  smallButtonText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  smallButtonDark: { borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 9 },
  smallButtonDarkText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  selectedPanel: { borderRadius: 26, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  panelTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelEyebrow: { color: THEME.colors.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
  panelBadge: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  panelTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 12 },
  panelSub: { color: THEME.colors.textMuted, fontSize: 12, marginTop: 5 },
  panelStats: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 16 },
  dataCell: { width: '50%', padding: 10 },
  dataLabel: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase' },
  dataValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 6 },
  panelActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryPanelAction: { flex: 1, borderRadius: 16, backgroundColor: THEME.colors.primary, paddingVertical: 14, alignItems: 'center' },
  primaryPanelActionText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  secondaryPanelAction: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 14, alignItems: 'center' },
  secondaryPanelActionText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  disabledAction: { opacity: 0.42 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  actionTile: { width: '50%', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, marginBottom: 12 },
  actionTileText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  infoIcon: { width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(230,188,74,0.08)' },
  infoTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  infoDetail: { color: THEME.colors.textMuted, fontSize: 11, marginTop: 4 },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.035)' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  messageType: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  messageBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  messageBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  messageTitle: { color: '#fff', fontSize: 14, lineHeight: 20 },
  lockedText: { color: THEME.colors.textMuted },
  messageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8 },
  messageMeta: { color: THEME.colors.textMuted, fontSize: 9, letterSpacing: 1.3, flex: 1 },
  actionBtn: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  actionBtnText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  emptyMemoryCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyMemoryTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  emptyMemoryText: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  ctaButton: { backgroundColor: THEME.colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  ctaButtonText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  emptyVaultCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyVaultTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  emptyVaultText: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 16, textAlign: 'center' },
  emptyVaultActions: { width: '100%', gap: 10 },
  secondaryEmptyButton: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)' },
  secondaryEmptyButtonText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  collectionGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  miniPanel: { width: '50%', padding: 12, minHeight: 126, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  miniTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 10 },
  miniDetail: { color: THEME.colors.textMuted, fontSize: 11, marginTop: 6 },
  securityGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  securityCard: { flex: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  securityValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  securityLabel: { color: THEME.colors.textMuted, fontSize: 9, marginTop: 8, letterSpacing: 1.3 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.72)' },
  previewPanel: { borderRadius: 28, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewEyebrow: { color: THEME.colors.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.7, textTransform: 'uppercase' },
  previewGlyph: { alignSelf: 'center', marginTop: 18, width: 132, height: 132, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(230,188,74,0.09)', borderWidth: 1, borderColor: 'rgba(230,188,74,0.18)' },
  previewTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 20, textAlign: 'center' },
  previewSub: { color: THEME.colors.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 18 },
});
