import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import tr from './tr.json';
import ru from './ru.json';
import es from './es.json';
import zh from './zh.json';
import de from './de.json';
import fr from './fr.json';

const resources = { en:{translation:en}, tr:{translation:tr}, ru:{translation:ru}, es:{translation:es}, zh:{translation:zh}, de:{translation:de}, fr:{translation:fr} }

i18n.use(initReactI18next).init({
  resources,
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false }
});

export default i18n;
