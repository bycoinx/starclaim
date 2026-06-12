import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hyg_stars_v2';
const CSV_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';

const HEADERS = ['id','hip','hd','hr','gl','bf','proper','ra','dec','dist','mag','absmag','spect','con','x','y','z','vx','vy','vz','rarad','decrad','pmra','pmdec','rv','hab','d'];

function csvLineToFields(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  values.push(current);
  return values;
}

export async function ensureStarData() {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`HYG catalog request failed: ${response.status}`);
    }
    const text = await response.text();
    const lines = text.split('\n');
    const header = lines.shift();
    const headerFields = csvLineToFields(header);
    const indexes = {
      id: headerFields.indexOf('id'),
      hip: headerFields.indexOf('hip'),
      hd: headerFields.indexOf('hd'),
      proper: headerFields.indexOf('proper'),
      ra: headerFields.indexOf('ra'),
      dec: headerFields.indexOf('dec'),
      dist: headerFields.indexOf('dist'),
      mag: headerFields.indexOf('mag'),
      spect: headerFields.indexOf('spect'),
      con: headerFields.indexOf('con')
    };

    const stars = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = csvLineToFields(line);
      const mag = parseFloat(cols[indexes.mag]);
      if (Number.isNaN(mag) || mag >= 6.5) continue;
      const ra = parseFloat(cols[indexes.ra]);
      const dec = parseFloat(cols[indexes.dec]);
      if (Number.isNaN(ra) || Number.isNaN(dec)) continue;
      stars.push({
        id: cols[indexes.id] || String(stars.length + 1),
        hip: cols[indexes.hip] || '',
        hd: cols[indexes.hd] || '',
        proper: cols[indexes.proper] || '',
        properName: cols[indexes.proper] || '',
        ra,
        raHours: ra,
        raDegrees: ra * 15,
        dec,
        decDegrees: dec,
        dist: parseFloat(cols[indexes.dist]) || 0,
        distanceParsec: parseFloat(cols[indexes.dist]) || 0,
        mag,
        spect: cols[indexes.spect] || '',
        spectralType: cols[indexes.spect] || '',
        con: cols[indexes.con] || '',
        constellation: cols[indexes.con] || '',
        starClaimCode: '',
        type: 'star',
      });
      if (stars.length >= 10000) break;
    }

    stars.sort((a, b) => a.mag - b.mag);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
    return stars;
  } catch (error) {
    console.warn('StarLoader error', error);
    return [];
  }
}

export async function getStoredStars() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('getStoredStars', error);
    return [];
  }
}
