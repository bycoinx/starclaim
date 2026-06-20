import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/Theme';

function ToolButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.toolButton, active && styles.toolButtonActive]} onPress={onPress}>
      <Ionicons name={icon} size={21} color={active ? THEME.colors.secondary : '#DDE5F2'} />
      <Text style={[styles.toolLabel, active && styles.toolLabelActive]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function ModeButton({ label, active, onPress }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.modeButton, active && styles.modeButtonActive]} onPress={onPress}>
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoLine({ icon, text }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={14} color="rgba(244,247,255,0.66)" />
      <Text style={styles.infoText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default function SkyLiveChrome({
  cardinal,
  previousCardinal,
  nextCardinal,
  azimuth,
  altitude,
  observer,
  now,
  selectedStar,
  selectedStarOwned,
  selectedHorizontal,
  showConstellations,
  showDeepSpace,
  mode,
  coordinateMode,
  searchQuery,
  searchResults,
  nightVision,
  surfaceAvailable = true,
  onExit,
  onSearch,
  onSelectSearchResult,
  onOpenSettings,
  onToggleConstellations,
  onToggleDeepSpace,
  onCenter,
  onManualMode,
  onSensorMode,
  onCameraMode,
  onClearSelection,
  onOpenDetails,
  onVoyage,
}) {
  const [searchVisible, setSearchVisible] = useState(false);
  const selectedName = selectedStar?.properName || selectedStar?.proper || (selectedStar ? `HIP ${selectedStar.hip || selectedStar.id}` : '');
  const constellation = selectedStar?.constellation || selectedStar?.con || 'Katalog yıldızı';

  const closeSearch = () => {
    setSearchVisible(false);
    onSearch('');
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <View style={styles.observationFrame} pointerEvents="none" />

      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.brandButton} onPress={onExit}>
          <Ionicons name="star" size={18} color={THEME.colors.secondary} />
          <Text style={styles.brandText}>STARCLAIM</Text>
        </TouchableOpacity>

        <View style={styles.compassStrip} pointerEvents="none">
          <Text style={styles.compassSide}>{previousCardinal}</Text>
          <View style={styles.compassCenter}>
            <Text style={styles.compassCardinal}>{cardinal}</Text>
            <View style={styles.compassMarker} />
          </View>
          <Text style={styles.compassSide}>{nextCardinal}</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setSearchVisible(!searchVisible)}>
            <Ionicons name="search" size={21} color="#F4F7FF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, nightVision && styles.nightButton]} onPress={onOpenSettings}>
            <Ionicons name="options-outline" size={21} color={nightVision ? '#FF6961' : '#F4F7FF'} />
          </TouchableOpacity>
        </View>
      </View>

      {surfaceAvailable && searchVisible && (
        <View style={styles.searchWidget}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={THEME.colors.primary} />
            <TextInput
              autoFocus
              style={styles.searchInput}
              placeholder="Yıldız, gezegen veya katalog kodu"
              placeholderTextColor="rgba(244,247,255,0.38)"
              value={searchQuery}
              onChangeText={onSearch}
            />
            <TouchableOpacity onPress={closeSearch}>
              <Ionicons name="close" size={20} color="rgba(244,247,255,0.6)" />
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={`${item.type || 'object'}-${item.id}`}
                  style={styles.searchResult}
                  onPress={() => { onSelectSearchResult(item); setSearchVisible(false); }}
                >
                  <Ionicons name="sparkles" size={14} color={THEME.colors.secondary} />
                  <Text style={styles.searchResultText} numberOfLines={1}>
                    {item.name || item.properName || item.proper || `HIP ${item.hip}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {surfaceAvailable && selectedStar && (
        <View style={styles.selectionPanel}>
          <View style={styles.selectionHeader}>
            <View style={styles.selectionIcon}><Ionicons name="sparkles" size={18} color={THEME.colors.primary} /></View>
            <View style={styles.selectionIdentity}>
              <Text style={styles.selectionName} numberOfLines={1}>{selectedName}</Text>
              <Text style={styles.selectionConstellation} numberOfLines={1}>{constellation}</Text>
            </View>
            <TouchableOpacity onPress={onClearSelection}><Ionicons name="close" size={18} color="rgba(244,247,255,0.5)" /></TouchableOpacity>
          </View>
          <Text style={styles.selectionMeta}>Parlaklık  {Number(selectedStar.mag).toFixed(2)}</Text>
          <Text style={styles.selectionMeta}>Yükseklik  {selectedHorizontal ? `${selectedHorizontal.alt.toFixed(1)}°` : '--'}</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionAction} onPress={onCenter}><Ionicons name="locate-outline" size={18} color={THEME.colors.primary} /></TouchableOpacity>
            <TouchableOpacity style={styles.selectionAction} onPress={onOpenDetails}><Ionicons name="information-circle-outline" size={18} color="#F4F7FF" /></TouchableOpacity>
            {selectedStarOwned && <TouchableOpacity style={styles.selectionAction} onPress={onVoyage}><Ionicons name="rocket-outline" size={18} color={THEME.colors.secondary} /></TouchableOpacity>}
          </View>
        </View>
      )}

      {surfaceAvailable && <View style={styles.locationPanel} pointerEvents="none">
        <InfoLine icon="location-outline" text={observer ? `${observer.latitude.toFixed(2)}°, ${observer.longitude.toFixed(2)}°` : 'Konum kapalı'} />
        <InfoLine icon="calendar-outline" text={now.toLocaleDateString('tr-TR')} />
        <InfoLine icon="time-outline" text={now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} />
      </View>}

      {surfaceAvailable && <View style={styles.rightTools} pointerEvents="box-none">
        <ToolButton icon="git-network-outline" label="Takımyıldızları" active={showConstellations} onPress={onToggleConstellations} />
        <ToolButton icon="planet-outline" label="Derin Uzay" active={showDeepSpace} onPress={onToggleDeepSpace} />
        <ToolButton icon="locate-outline" label="Merkeze Al" active={Boolean(selectedStar)} onPress={onCenter} />
      </View>}

      {surfaceAvailable && <View style={styles.bottomCenter} pointerEvents="box-none">
        <View style={styles.modeSelector}>
          <ModeButton label="Harita" active={mode === 'manual' && coordinateMode === 'equatorial'} onPress={onManualMode} />
          <ModeButton label="Sensör" active={mode === 'manual' && coordinateMode === 'horizontal'} onPress={onSensorMode} />
          <ModeButton label="Kamera" active={mode === 'camera'} onPress={onCameraMode} />
        </View>
        <View style={styles.coordinatePill} pointerEvents="none">
          <Text style={styles.coordinateText}>Yön: {azimuth.toFixed(0)}°</Text>
          <Text style={styles.coordinateText}>Yükseklik: {altitude.toFixed(0)}°</Text>
        </View>
      </View>}
    </View>
  );
}

const glass = {
  backgroundColor: 'rgba(3,7,14,0.76)',
  borderWidth: 1,
  borderColor: 'rgba(191,215,244,0.16)',
};

const styles = StyleSheet.create({
  observationFrame: { position: 'absolute', top: 7, right: 7, bottom: 7, left: 7, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(191,215,244,0.14)' },
  topBar: { position: 'absolute', top: 10, left: 18, right: 18, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandButton: { width: 150, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: '#F4F7FF', fontFamily: 'Cinzel_700Bold', fontSize: 17 },
  compassStrip: { ...glass, width: 220, height: 42, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  compassSide: { color: 'rgba(244,247,255,0.42)', fontSize: 11 },
  compassCenter: { alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  compassCardinal: { color: THEME.colors.secondary, fontSize: 16, fontWeight: '800' },
  compassMarker: { marginTop: 2, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: THEME.colors.secondary },
  topActions: { width: 150, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 },
  iconButton: { ...glass, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nightButton: { borderColor: 'rgba(255,105,97,0.5)' },
  searchWidget: { position: 'absolute', zIndex: 50, top: 62, right: 18, width: 330 },
  searchBar: { ...glass, minHeight: 46, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: '#F4F7FF', fontSize: 12, paddingVertical: 10 },
  searchResults: { ...glass, marginTop: 6, borderRadius: 10, overflow: 'hidden' },
  searchResult: { minHeight: 42, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(244,247,255,0.08)' },
  searchResultText: { flex: 1, color: '#F4F7FF', fontSize: 12 },
  selectionPanel: { ...glass, position: 'absolute', top: 74, left: 18, width: 246, borderRadius: 10, padding: 14 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center' },
  selectionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(119,191,255,0.09)', alignItems: 'center', justifyContent: 'center' },
  selectionIdentity: { flex: 1, marginLeft: 9 },
  selectionName: { color: '#F4F7FF', fontSize: 15, fontWeight: '700' },
  selectionConstellation: { color: 'rgba(244,247,255,0.5)', fontSize: 10, marginTop: 2 },
  selectionMeta: { color: 'rgba(244,247,255,0.68)', fontSize: 10, marginTop: 8 },
  selectionActions: { flexDirection: 'row', gap: 7, marginTop: 10 },
  selectionAction: { width: 34, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,247,255,0.06)' },
  locationPanel: { ...glass, position: 'absolute', left: 18, bottom: 18, width: 190, borderRadius: 10, padding: 12, gap: 8 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, color: 'rgba(244,247,255,0.76)', fontSize: 10 },
  rightTools: { position: 'absolute', right: 18, top: 78, gap: 9 },
  toolButton: { ...glass, width: 96, minHeight: 62, borderRadius: 10, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 5 },
  toolButtonActive: { borderColor: 'rgba(230,188,74,0.4)' },
  toolLabel: { color: 'rgba(244,247,255,0.72)', fontSize: 9, lineHeight: 12, textAlign: 'center' },
  toolLabelActive: { color: '#F0D47D' },
  bottomCenter: { position: 'absolute', left: '50%', bottom: 18, width: 330, marginLeft: -165, alignItems: 'center', gap: 7 },
  modeSelector: { ...glass, height: 35, borderRadius: 18, padding: 3, flexDirection: 'row' },
  modeButton: { minWidth: 82, height: 29, paddingHorizontal: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeButtonActive: { backgroundColor: 'rgba(119,191,255,0.16)' },
  modeLabel: { color: 'rgba(244,247,255,0.46)', fontSize: 9, fontWeight: '700' },
  modeLabelActive: { color: '#BFE1FF' },
  coordinatePill: { ...glass, minHeight: 30, borderRadius: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 14 },
  coordinateText: { color: 'rgba(244,247,255,0.72)', fontSize: 10 },
});
