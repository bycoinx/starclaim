export const NASA_LANDMARKS = [
  {
    code: "NASA-M17",
    name: "Swan Nebula",
    nameTr: "Kuğu Bulutsusu",
    catalog: "Messier 17 / NGC 6618",
    constellation: "Sagittarius",
    ra: "18h 20m 26s",
    dec: "-16° 10' 36\"",
    distanceLy: 5500,
    spanLy: 15,
    spectralModes: ["Visible", "Infrared", "Radio"],
    hue: "#ffb347",
    description:
      "A massive stellar nursery whose bright gas ridges mark one of the Milky Way's most active star-forming landmarks.",
    descriptionTr:
      "Samanyolu'nun en aktif yıldız doğum bölgelerinden biri; parlak gaz sırtları HUD üzerinde kuğu formu gibi izlenir.",
  },
  {
    code: "NASA-IC1805",
    name: "Heart Nebula",
    nameTr: "Kalp Bulutsusu",
    catalog: "IC 1805",
    constellation: "Cassiopeia",
    ra: "02h 32m 42s",
    dec: "+61° 27' 00\"",
    distanceLy: 7500,
    spanLy: 200,
    spectralModes: ["Hydrogen Alpha", "Infrared", "X-Ray"],
    hue: "#ff4f8b",
    description:
      "A large emission nebula sculpted by young hot stars, visible as a heart-shaped deep-space structure.",
    descriptionTr:
      "Genç ve sıcak yıldızların şekillendirdiği, kalp formuyla tanınan geniş bir emisyon bulutsusu.",
  },
  {
    code: "NASA-IC1848",
    name: "Soul Nebula",
    nameTr: "Ruh Bulutsusu",
    catalog: "IC 1848 / Westerhout 5",
    constellation: "Cassiopeia",
    ra: "02h 51m 00s",
    dec: "+60° 26' 00\"",
    distanceLy: 6500,
    spanLy: 100,
    spectralModes: ["Infrared", "Hydrogen Alpha", "Radio"],
    hue: "#9f7aea",
    description:
      "A neighboring star-forming complex to the Heart Nebula, rich with clustered newborn stars and dust lanes.",
    descriptionTr:
      "Kalp Bulutsusu'nun komşusu olan, yeni doğan yıldız kümeleri ve toz şeritleriyle zengin bir yıldız oluşum alanı.",
  },
  {
    code: "NASA-NGC2070",
    name: "Tarantula Nebula",
    nameTr: "Tarantula Bulutsusu",
    catalog: "30 Doradus / NGC 2070",
    constellation: "Dorado",
    ra: "05h 38m 38s",
    dec: "-69° 05' 42\"",
    distanceLy: 160000,
    spanLy: 1000,
    spectralModes: ["Visible", "Infrared", "X-Ray"],
    hue: "#38bdf8",
    description:
      "The Local Group's most intense known starburst region, anchored in the Large Magellanic Cloud.",
    descriptionTr:
      "Büyük Macellan Bulutu içinde yer alan, Yerel Grup'un bilinen en yoğun yıldız doğum bölgelerinden biri.",
  },
  {
    code: "NASA-M16",
    name: "Eagle Nebula",
    nameTr: "Kartal Bulutsusu",
    catalog: "Messier 16 / NGC 6611",
    constellation: "Serpens",
    ra: "18h 18m 48s",
    dec: "-13° 49' 00\"",
    distanceLy: 7000,
    spanLy: 70,
    spectralModes: ["Visible", "Infrared", "Hydrogen Alpha"],
    hue: "#fde68a",
    description:
      "Home of the Pillars of Creation, a landmark where dense dust columns cradle emerging stars.",
    descriptionTr:
      "Yaratılış Sütunları'na ev sahipliği yapan, yoğun toz kolonlarında yeni yıldızların oluştuğu ikonik bölge.",
  },
  {
    code: "NASA-M42",
    name: "Orion Nebula",
    nameTr: "Avcı Bulutsusu",
    catalog: "Messier 42 / NGC 1976",
    constellation: "Orion",
    ra: "05h 35m 17s",
    dec: "-05° 23' 28\"",
    distanceLy: 1344,
    spanLy: 24,
    spectralModes: ["Visible", "Infrared", "X-Ray"],
    hue: "#7dd3fc",
    description:
      "One of Earth's closest massive star-forming regions, bright enough to anchor the naked-eye Orion sword.",
    descriptionTr:
      "Dünya'ya en yakın büyük yıldız oluşum bölgelerinden biri; Orion'un kılıcında çıplak gözle seçilebilir.",
  },
];

export const NASA_LANDMARK_BY_CODE = NASA_LANDMARKS.reduce((acc, landmark) => {
  acc[landmark.code] = landmark;
  return acc;
}, {});
