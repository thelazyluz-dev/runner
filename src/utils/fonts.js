// Rubik font loader with system-font fallback
// If @expo-google-fonts/rubik is not installed, all exports are undefined
// and React Native will fall back to the system default font.

let Rubik_400Regular;
let Rubik_700Bold;
let Rubik_500Medium;

try {
  const pkg = require('@expo-google-fonts/rubik');
  Rubik_400Regular = pkg.Rubik_400Regular;
  Rubik_700Bold    = pkg.Rubik_700Bold;
  Rubik_500Medium  = pkg.Rubik_500Medium;
} catch (_) {
  // package not installed — use system font
}

export const RUBIK        = Rubik_400Regular ? 'Rubik_400Regular' : undefined;
export const RUBIK_BOLD   = Rubik_700Bold    ? 'Rubik_700Bold'    : undefined;
export const RUBIK_MEDIUM = Rubik_500Medium  ? 'Rubik_500Medium'  : undefined;

/** Pass to useFonts() in App.js */
export function buildFontMap() {
  const map = {};
  if (Rubik_400Regular) map['Rubik_400Regular'] = Rubik_400Regular;
  if (Rubik_700Bold)    map['Rubik_700Bold']    = Rubik_700Bold;
  if (Rubik_500Medium)  map['Rubik_500Medium']  = Rubik_500Medium;
  return map;
}
