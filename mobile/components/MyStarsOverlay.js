import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyStarsOverlay({ stars, onSelectStar }) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [owned, setOwned] = useState([]);

  useEffect(() => { loadOwned(); }, []);

  const loadOwned = async () => {
    const raw = await AsyncStorage.getItem('@purchases');
    const list = raw ? JSON.parse(raw) : [];
    setOwned(list.map((item) => ({ code: item.id, name: item.name, method: item.method }))); 
  };

  const filtered = owned.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity style={styles.button} onPress={() => setVisible(!visible)}>
        <Text style={styles.buttonText}>{visible ? 'Kapat' : 'Yıldızlarım'}</Text>
      </TouchableOpacity>
      {visible ? (
        <View style={styles.panel}>
          <TextInput style={styles.search} placeholder="Kod veya isim ara" placeholderTextColor="#8A8A9A" value={search} onChangeText={setSearch} />
          <FlatList data={filtered} keyExtractor={(item) => item.code} renderItem={({ item }) => (
            <TouchableOpacity style={styles.entry} onPress={() => onSelectStar && onSelectStar(item)}>
              <Text style={styles.entryName}>{item.name || item.code}</Text>
              <Text style={styles.entryMeta}>{item.code}</Text>
            </TouchableOpacity>
          )} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, bottom: 20, width: 180 },
  button: { backgroundColor: 'rgba(201,168,76,0.95)', padding: 12, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '800' },
  panel: { marginTop: 10, backgroundColor: '#07070A', borderRadius: 14, padding: 12, maxHeight: 280 },
  search: { backgroundColor: '#111', color: '#fff', padding: 10, borderRadius: 10, marginBottom: 10 },
  entry: { paddingVertical: 10, borderBottomColor: '#222', borderBottomWidth: 1 },
  entryName: { color: '#fff', fontWeight: '700' },
  entryMeta: { color: '#8A8A9A', fontSize: 12 }
});
