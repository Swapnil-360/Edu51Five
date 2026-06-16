export interface WC26Team {
  code: string; // matches football-data.org TLA exactly
  name: string;
  group: string;
  logo: string; // filename in /public/world-cup-2026-logos/
}

export function teamLogoUrl(filename: string): string {
  return `/world-cup-2026-logos/${filename}`;
}

export const WC26_TEAMS: WC26Team[] = [
  // Group A
  { code: "CZE", name: "Czechia",          group: "A", logo: "czechia.png" },
  { code: "MEX", name: "Mexico",            group: "A", logo: "mexico.png" },
  { code: "RSA", name: "South Africa",      group: "A", logo: "south-africa.png" },
  { code: "KOR", name: "South Korea",       group: "A", logo: "south-korea.png" },
  // Group B
  { code: "BIH", name: "Bosnia-Herz.",      group: "B", logo: "bosnia-herzegovina.png" },
  { code: "CAN", name: "Canada",            group: "B", logo: "canada.png" },
  { code: "QAT", name: "Qatar",             group: "B", logo: "qatar.png" },
  { code: "SUI", name: "Switzerland",       group: "B", logo: "switzerland.png" },
  // Group C
  { code: "BRA", name: "Brazil",            group: "C", logo: "brazil.png" },
  { code: "HAI", name: "Haiti",             group: "C", logo: "haiti.png" },
  { code: "MAR", name: "Morocco",           group: "C", logo: "morocco.png" },
  { code: "SCO", name: "Scotland",          group: "C", logo: "scotland.png" },
  // Group D
  { code: "AUS", name: "Australia",         group: "D", logo: "australia.png" },
  { code: "PAR", name: "Paraguay",          group: "D", logo: "paraguay.png" },
  { code: "TUR", name: "Türkiye",           group: "D", logo: "turkiye.png" },
  { code: "USA", name: "United States",     group: "D", logo: "united-states.png" },
  // Group E
  { code: "CUW", name: "Curaçao",           group: "E", logo: "curacao.png" },
  { code: "ECU", name: "Ecuador",           group: "E", logo: "ecuador.png" },
  { code: "GER", name: "Germany",           group: "E", logo: "germany.png" },
  { code: "CIV", name: "Ivory Coast",       group: "E", logo: "ivory-coast.png" },
  // Group F
  { code: "JPN", name: "Japan",             group: "F", logo: "japan.png" },
  { code: "NED", name: "Netherlands",       group: "F", logo: "netherlands.png" },
  { code: "SWE", name: "Sweden",            group: "F", logo: "sweden.png" },
  { code: "TUN", name: "Tunisia",           group: "F", logo: "tunisia.png" },
  // Group G
  { code: "BEL", name: "Belgium",           group: "G", logo: "belgium.png" },
  { code: "EGY", name: "Egypt",             group: "G", logo: "egypt.png" },
  { code: "IRN", name: "Iran",              group: "G", logo: "iran.png" },
  { code: "NZL", name: "New Zealand",       group: "G", logo: "new-zealand.png" },
  // Group H
  { code: "CPV", name: "Cape Verde",        group: "H", logo: "cape-verde.png" },
  { code: "KSA", name: "Saudi Arabia",      group: "H", logo: "saudi-arabia.png" },
  { code: "ESP", name: "Spain",             group: "H", logo: "spain.png" },
  { code: "URY", name: "Uruguay",           group: "H", logo: "uruguay.png" },
  // Group I
  { code: "FRA", name: "France",            group: "I", logo: "france.png" },
  { code: "IRQ", name: "Iraq",              group: "I", logo: "iraq.png" },
  { code: "NOR", name: "Norway",            group: "I", logo: "norway.png" },
  { code: "SEN", name: "Senegal",           group: "I", logo: "senegal.png" },
  // Group J
  { code: "ALG", name: "Algeria",           group: "J", logo: "algeria.png" },
  { code: "ARG", name: "Argentina",         group: "J", logo: "argentina.png" },
  { code: "AUT", name: "Austria",           group: "J", logo: "austria.png" },
  { code: "JOR", name: "Jordan",            group: "J", logo: "jordan.png" },
  // Group K
  { code: "COL", name: "Colombia",          group: "K", logo: "colombia.png" },
  { code: "COD", name: "Congo DR",          group: "K", logo: "dr-congo.png" },
  { code: "POR", name: "Portugal",          group: "K", logo: "portugal.png" },
  { code: "UZB", name: "Uzbekistan",        group: "K", logo: "uzbekistan.png" },
  // Group L
  { code: "CRO", name: "Croatia",           group: "L", logo: "croatia.png" },
  { code: "ENG", name: "England",           group: "L", logo: "england.png" },
  { code: "GHA", name: "Ghana",             group: "L", logo: "ghana.png" },
  { code: "PAN", name: "Panama",            group: "L", logo: "panama.png" },
];

export function getTeamByCode(code: string): WC26Team | undefined {
  return WC26_TEAMS.find((t) => t.code === code);
}
