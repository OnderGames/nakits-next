export type SubcategoryDef = {
  slug: string;
  name: string;
  /** Konut: Satılık/Kiralık + yapı tipi; diğer emlak dalları: yalnız Satılık/Kiralık; Otomobil: marka seçimi */
  drilldown?: "konut" | "emlak-listing-kind" | "otomobil-marka";
};

/** Otomobil altı marka (slug URL/güvenli; name ekranda birebir) */
export const OTOMOBIL_MARKALARI = [
  { slug: "bmw", name: "BMW" },
  { slug: "chery", name: "Chery" },
  { slug: "citroen", name: "Citroën" },
  { slug: "fiat", name: "Fiat" },
  { slug: "ford", name: "Ford" },
  { slug: "hyundai", name: "Hyundai" },
  { slug: "opel", name: "Opel" },
  { slug: "peugeot", name: "Peugeot" },
  { slug: "renault", name: "Renault" },
  { slug: "skoda", name: "Skoda" },
  { slug: "togg", name: "TOGG" },
  { slug: "toyota", name: "Toyota" },
  { slug: "tofas", name: "Tofaş" },
  { slug: "volkswagen", name: "Volkswagen" }
] as const;

export type OtomobilMarkaModelDef = { slug: string; name: string };

/** Marka → modeller (yaprak: tasitlar.otomobil-{marka}-{model}) */
export const OTOMOBIL_MARKA_MODELS: Partial<
  Record<(typeof OTOMOBIL_MARKALARI)[number]["slug"], readonly OtomobilMarkaModelDef[]>
> = {
  bmw: [
    { slug: "1-serisi", name: "1 Serisi" },
    { slug: "1-serisi-116d", name: "1 Serisi › 116d" },
    { slug: "1-serisi-116d-ed", name: "1 Serisi › 116d ED" },
    { slug: "1-serisi-116i", name: "1 Serisi › 116i" },
    { slug: "1-serisi-118d", name: "1 Serisi › 118d" },
    { slug: "1-serisi-118i", name: "1 Serisi › 118i" },
    { slug: "1-serisi-120", name: "1 Serisi › 120" },
    { slug: "1-serisi-120d", name: "1 Serisi › 120d" },
    { slug: "1-serisi-120i", name: "1 Serisi › 120i" },
    { slug: "1-serisi-128ia", name: "1 Serisi › 128ia" },
    { slug: "1-serisi-128ti", name: "1 Serisi › 128ti" },
    { slug: "2-serisi", name: "2 Serisi" },
    { slug: "2-serisi-216d-active-tourer", name: "2 Serisi › 216d Active Tourer" },
    { slug: "2-serisi-216d-gran-coupe", name: "2 Serisi › 216d Gran Coupe" },
    { slug: "2-serisi-216d-gran-tourer", name: "2 Serisi › 216d Gran Tourer" },
    { slug: "2-serisi-218i", name: "2 Serisi › 218i" },
    { slug: "2-serisi-218i-active-tourer", name: "2 Serisi › 218i Active Tourer" },
    { slug: "2-serisi-218i-gran-coupe", name: "2 Serisi › 218i Gran Coupe" },
    { slug: "2-serisi-220d", name: "2 Serisi › 220d" },
    { slug: "2-serisi-220-gran-coupe", name: "2 Serisi › 220 Gran Coupe" },
    { slug: "2-serisi-220i-active-tourer", name: "2 Serisi › 220i Active Tourer" },
    {
      slug: "2-serisi-230e-xdrive-active-tourer",
      name: "2 Serisi › 230e xDrive Active Tourer"
    },
    { slug: "3-serisi", name: "3 Serisi" },
    { slug: "3-serisi-315", name: "3 Serisi › 315" },
    { slug: "3-serisi-316", name: "3 Serisi › 316" },
    { slug: "3-serisi-316ci", name: "3 Serisi › 316Ci" },
    { slug: "3-serisi-316i", name: "3 Serisi › 316i" },
    { slug: "3-serisi-316ti", name: "3 Serisi › 316ti" },
    { slug: "3-serisi-318ci", name: "3 Serisi › 318Ci" },
    { slug: "3-serisi-318d", name: "3 Serisi › 318d" },
    { slug: "3-serisi-318i", name: "3 Serisi › 318i" },
    { slug: "3-serisi-318is", name: "3 Serisi › 318is" },
    { slug: "3-serisi-318tds", name: "3 Serisi › 318tds" },
    { slug: "3-serisi-318ti", name: "3 Serisi › 318ti" },
    { slug: "3-serisi-320cd", name: "3 Serisi › 320Cd" },
    { slug: "3-serisi-320ci", name: "3 Serisi › 320Ci" },
    { slug: "3-serisi-320d", name: "3 Serisi › 320d" },
    { slug: "3-serisi-320d-gt", name: "3 Serisi › 320d GT" },
    { slug: "3-serisi-320d-xdrive", name: "3 Serisi › 320d xDrive" },
    { slug: "3-serisi-320d-xdrive-gt", name: "3 Serisi › 320d xDrive GT" },
    { slug: "3-serisi-320i", name: "3 Serisi › 320i" },
    { slug: "3-serisi-320i-ed", name: "3 Serisi › 320i ED" },
    { slug: "3-serisi-320si", name: "3 Serisi › 320si" },
    { slug: "3-serisi-320td", name: "3 Serisi › 320td" },
    { slug: "3-serisi-323ci", name: "3 Serisi › 323Ci" },
    { slug: "3-serisi-323i", name: "3 Serisi › 323i" },
    { slug: "3-serisi-325ci", name: "3 Serisi › 325Ci" },
    { slug: "3-serisi-325d", name: "3 Serisi › 325d" },
    { slug: "3-serisi-325i", name: "3 Serisi › 325i" },
    { slug: "3-serisi-325i-xdrive", name: "3 Serisi › 325i xDrive" },
    { slug: "3-serisi-325tds", name: "3 Serisi › 325tds" },
    { slug: "3-serisi-325ti", name: "3 Serisi › 325ti" },
    { slug: "3-serisi-325xi", name: "3 Serisi › 325xi" },
    { slug: "3-serisi-328ci", name: "3 Serisi › 328Ci" },
    { slug: "3-serisi-328i", name: "3 Serisi › 328i" },
    { slug: "3-serisi-328i-xdrive", name: "3 Serisi › 328i xDrive" },
    { slug: "3-serisi-330cd", name: "3 Serisi › 330Cd" },
    { slug: "3-serisi-330ci", name: "3 Serisi › 330Ci" },
    { slug: "3-serisi-330d", name: "3 Serisi › 330d" },
    { slug: "3-serisi-330i", name: "3 Serisi › 330i" },
    { slug: "3-serisi-330i-xdrive", name: "3 Serisi › 330i xDrive" },
    { slug: "3-serisi-330xd", name: "3 Serisi › 330xd" },
    { slug: "3-serisi-330xi", name: "3 Serisi › 330xi" },
    { slug: "3-serisi-335d", name: "3 Serisi › 335d" },
    { slug: "3-serisi-335i", name: "3 Serisi › 335i" },
    { slug: "3-serisi-340d-xdrive", name: "3 Serisi › 340d xDrive" },
    { slug: "3-serisi-340i-xdrive", name: "3 Serisi › 340i xDrive" },
    { slug: "4-serisi", name: "4 Serisi" },
    { slug: "4-serisi-418d", name: "4 Serisi › 418d" },
    { slug: "4-serisi-418d-gran-coupe", name: "4 Serisi › 418d Gran Coupe" },
    { slug: "4-serisi-418i", name: "4 Serisi › 418i" },
    { slug: "4-serisi-418i-gran-coupe", name: "4 Serisi › 418i Gran Coupe" },
    { slug: "4-serisi-420d", name: "4 Serisi › 420d" },
    { slug: "4-serisi-420d-gran-coupe", name: "4 Serisi › 420d Gran Coupe" },
    { slug: "4-serisi-420d-xdrive", name: "4 Serisi › 420d xDrive" },
    {
      slug: "4-serisi-420d-xdrive-gran-coupe",
      name: "4 Serisi › 420d xDrive Gran Coupe"
    },
    { slug: "4-serisi-420i", name: "4 Serisi › 420i" },
    { slug: "4-serisi-420i-gran-coupe", name: "4 Serisi › 420i Gran Coupe" },
    { slug: "4-serisi-428i", name: "4 Serisi › 428i" },
    { slug: "4-serisi-428i-gran-coupe", name: "4 Serisi › 428i Gran Coupe" },
    { slug: "4-serisi-428i-xdrive", name: "4 Serisi › 428i xDrive" },
    {
      slug: "4-serisi-428i-xdrive-gran-coupe",
      name: "4 Serisi › 428i xDrive Gran Coupe"
    },
    { slug: "4-serisi-430i", name: "4 Serisi › 430i" },
    {
      slug: "4-serisi-430i-cabrio-edition-m-sport",
      name: "4 Serisi › 430i Cabrio Edition M Sport"
    },
    {
      slug: "4-serisi-430i-coupe-edition-m-sport",
      name: "4 Serisi › 430i Coupe Edition M Sport"
    },
    { slug: "4-serisi-430i-xdrive", name: "4 Serisi › 430i xDrive" },
    {
      slug: "4-serisi-430i-xdrive-gran-coupe",
      name: "4 Serisi › 430i xDrive Gran Coupe"
    },
    { slug: "4-serisi-435i", name: "4 Serisi › 435i" },
    { slug: "4-serisi-440i-xdrive", name: "4 Serisi › 440i xDrive" },
    { slug: "5-serisi", name: "5 Serisi" },
    { slug: "5-serisi-518i", name: "5 Serisi › 518i" },
    { slug: "5-serisi-520", name: "5 Serisi › 520" },
    { slug: "5-serisi-520d", name: "5 Serisi › 520d" },
    { slug: "5-serisi-520d-gran-turismo", name: "5 Serisi › 520d Gran Turismo" },
    { slug: "5-serisi-520d-xdrive", name: "5 Serisi › 520d xDrive" },
    { slug: "5-serisi-520i", name: "5 Serisi › 520i" },
    { slug: "5-serisi-520li", name: "5 Serisi › 520Li" },
    { slug: "5-serisi-523i", name: "5 Serisi › 523i" },
    { slug: "5-serisi-524d", name: "5 Serisi › 524d" },
    { slug: "5-serisi-524td", name: "5 Serisi › 524td" },
    { slug: "5-serisi-525d", name: "5 Serisi › 525d" },
    { slug: "5-serisi-525d-xdrive", name: "5 Serisi › 525d xDrive" },
    { slug: "5-serisi-525i", name: "5 Serisi › 525i" },
    { slug: "5-serisi-525ix", name: "5 Serisi › 525ix" },
    { slug: "5-serisi-525td", name: "5 Serisi › 525td" },
    { slug: "5-serisi-525tds", name: "5 Serisi › 525tds" },
    { slug: "5-serisi-525-xdrive", name: "5 Serisi › 525 xDrive" },
    { slug: "5-serisi-528i", name: "5 Serisi › 528i" },
    { slug: "5-serisi-528i-xdrive", name: "5 Serisi › 528i xDrive" },
    { slug: "5-serisi-530d", name: "5 Serisi › 530d" },
    { slug: "5-serisi-530d-xdrive", name: "5 Serisi › 530d xDrive" },
    { slug: "5-serisi-530i", name: "5 Serisi › 530i" },
    { slug: "5-serisi-530i-xdrive", name: "5 Serisi › 530i xDrive" },
    { slug: "5-serisi-530xd-gran-turismo", name: "5 Serisi › 530xd Gran Turismo" },
    { slug: "5-serisi-530-xdrive", name: "5 Serisi › 530 xDrive" },
    { slug: "5-serisi-530xi", name: "5 Serisi › 530xi" },
    { slug: "5-serisi-535d", name: "5 Serisi › 535d" },
    { slug: "5-serisi-535d-xdrive", name: "5 Serisi › 535d xDrive" },
    { slug: "5-serisi-535i", name: "5 Serisi › 535i" },
    { slug: "5-serisi-535i-xdrive", name: "5 Serisi › 535i xDrive" },
    { slug: "5-serisi-540i", name: "5 Serisi › 540i" },
    { slug: "5-serisi-540i-xdrive", name: "5 Serisi › 540i xDrive" },
    { slug: "5-serisi-545i", name: "5 Serisi › 545i" },
    { slug: "5-serisi-550d-xdrive", name: "5 Serisi › 550d xDrive" },
    { slug: "5-serisi-550-xdrive", name: "5 Serisi › 550 xDrive" },
    { slug: "6-serisi", name: "6 Serisi" },
    { slug: "6-serisi-620d-xdrive", name: "6 Serisi › 620d xDrive" },
    { slug: "6-serisi-630ci", name: "6 Serisi › 630Ci" },
    { slug: "6-serisi-630i", name: "6 Serisi › 630i" },
    { slug: "6-serisi-630i-gran-turismo", name: "6 Serisi › 630i Gran Turismo" },
    { slug: "6-serisi-635d", name: "6 Serisi › 635d" },
    { slug: "6-serisi-640d", name: "6 Serisi › 640d" },
    { slug: "6-serisi-640d-xdrive", name: "6 Serisi › 640d xDrive" },
    { slug: "6-serisi-640i", name: "6 Serisi › 640i" },
    { slug: "6-serisi-645ci", name: "6 Serisi › 645Ci" },
    { slug: "6-serisi-650ci", name: "6 Serisi › 650Ci" },
    { slug: "6-serisi-650i-xdrive", name: "6 Serisi › 650i xDrive" },
    { slug: "7-serisi", name: "7 Serisi" },
    { slug: "7-serisi-725d", name: "7 Serisi › 725d" },
    { slug: "7-serisi-725d-long", name: "7 Serisi › 725d Long" },
    { slug: "7-serisi-725tds", name: "7 Serisi › 725tds" },
    { slug: "7-serisi-728i", name: "7 Serisi › 728i" },
    { slug: "7-serisi-728i-long", name: "7 Serisi › 728i Long" },
    { slug: "7-serisi-730d", name: "7 Serisi › 730d" },
    { slug: "7-serisi-730d-long", name: "7 Serisi › 730d Long" },
    { slug: "7-serisi-730d-xdrive", name: "7 Serisi › 730d xDrive" },
    { slug: "7-serisi-730d-xdrive-long", name: "7 Serisi › 730d xDrive Long" },
    { slug: "7-serisi-730i", name: "7 Serisi › 730i" },
    { slug: "7-serisi-730i-long", name: "7 Serisi › 730i Long" },
    { slug: "7-serisi-735i", name: "7 Serisi › 735i" },
    { slug: "7-serisi-735i-long", name: "7 Serisi › 735i Long" },
    { slug: "7-serisi-740d", name: "7 Serisi › 740d" },
    { slug: "7-serisi-740d-xdrive", name: "7 Serisi › 740d xDrive" },
    { slug: "7-serisi-740d-xdrive-long", name: "7 Serisi › 740d xDrive Long" },
    { slug: "7-serisi-740e-xdrive-long", name: "7 Serisi › 740e xDrive Long" },
    { slug: "7-serisi-740i", name: "7 Serisi › 740i" },
    { slug: "7-serisi-740i-long", name: "7 Serisi › 740i Long" },
    { slug: "7-serisi-745d", name: "7 Serisi › 745d" },
    { slug: "7-serisi-745i", name: "7 Serisi › 745i" },
    { slug: "7-serisi-745i-long", name: "7 Serisi › 745i Long" },
    { slug: "7-serisi-750d-xdrive-long", name: "7 Serisi › 750d xDrive Long" },
    { slug: "7-serisi-750i", name: "7 Serisi › 750i" },
    { slug: "7-serisi-750-ial", name: "7 Serisi › 750 ial" },
    { slug: "7-serisi-750i-long", name: "7 Serisi › 750i Long" },
    { slug: "7-serisi-750i-xdrive", name: "7 Serisi › 750i xDrive" },
    { slug: "7-serisi-750i-xdrive-long", name: "7 Serisi › 750i xDrive Long" },
    { slug: "7-serisi-760i", name: "7 Serisi › 760i" },
    { slug: "7-serisi-760i-long", name: "7 Serisi › 760i Long" },
    { slug: "8-serisi", name: "8 Serisi" },
    { slug: "8-serisi-840ci", name: "8 Serisi › 840Ci" },
    {
      slug: "8-serisi-840d-xdrive-gran-coupe",
      name: "8 Serisi › 840d xDrive Gran Coupe"
    },
    { slug: "8-serisi-840i-xdrive", name: "8 Serisi › 840i xDrive" },
    {
      slug: "8-serisi-840i-xdrive-gran-coupe",
      name: "8 Serisi › 840i xDrive Gran Coupe"
    },
    { slug: "8-serisi-850ci", name: "8 Serisi › 850Ci" },
    { slug: "8-serisi-850csi", name: "8 Serisi › 850CSi" },
    { slug: "i-serisi", name: "i Serisi" },
    { slug: "i-serisi-i3", name: "i Serisi › i3" },
    { slug: "i-serisi-i4", name: "i Serisi › i4" },
    { slug: "i-serisi-i5", name: "i Serisi › i5" },
    { slug: "i-serisi-i7", name: "i Serisi › i7" },
    { slug: "i-serisi-i8", name: "i Serisi › i8" },
    { slug: "z-serisi", name: "Z Serisi" },
    { slug: "z-serisi-z1", name: "Z Serisi › Z1" },
    { slug: "z-serisi-z3", name: "Z Serisi › Z3" },
    { slug: "z-serisi-z4", name: "Z Serisi › Z4" },
    { slug: "m-serisi", name: "M Serisi" },
    { slug: "m-serisi-m1", name: "M Serisi › M1" },
    { slug: "m-serisi-m2", name: "M Serisi › M2" },
    { slug: "m-serisi-m235i-xdrive", name: "M Serisi › M235i xDrive" },
    { slug: "m-serisi-m240i-xdrive", name: "M Serisi › M240i xDrive" },
    { slug: "m-serisi-m2-competition", name: "M Serisi › M2 Competition" },
    { slug: "m-serisi-m3", name: "M Serisi › M3" },
    { slug: "m-serisi-m3-cabrio", name: "M Serisi › M3 Cabrio" },
    { slug: "m-serisi-m3-competition", name: "M Serisi › M3 Competition" },
    { slug: "m-serisi-m3-coupe", name: "M Serisi › M3 Coupe" },
    { slug: "m-serisi-m3-touring", name: "M Serisi › M3 Touring" },
    { slug: "m-serisi-m4", name: "M Serisi › M4" },
    { slug: "m-serisi-m440i-xdrive", name: "M Serisi › M440i xDrive" },
    { slug: "m-serisi-m4-competition", name: "M Serisi › M4 Competition" },
    { slug: "m-serisi-m5", name: "M Serisi › M5" },
    { slug: "m-serisi-m5-competition", name: "M Serisi › M5 Competition" },
    { slug: "m-serisi-m5-touring", name: "M Serisi › M5 Touring" },
    { slug: "m-serisi-m5-xdrive", name: "M Serisi › M5 xDrive" },
    { slug: "m-serisi-m6", name: "M Serisi › M6" },
    { slug: "m-serisi-m6-cabrio", name: "M Serisi › M6 Cabrio" },
    { slug: "m-serisi-m6-gran-coupe", name: "M Serisi › M6 Gran Coupe" },
    { slug: "m-serisi-m760e-xdrive", name: "M Serisi › M760e xDrive" },
    { slug: "m-serisi-m850i-xdrive", name: "M Serisi › M850i xDrive" },
    {
      slug: "m-serisi-m8-coupe-xdrive-competition",
      name: "M Serisi › M8 Coupe xDrive Competition"
    },
    {
      slug: "m-serisi-m8-gran-coupe-xdrive-competition",
      name: "M Serisi › M8 Gran Coupe xDrive Competition"
    },
    { slug: "m-serisi-z3-m-cabrio", name: "M Serisi › Z3 M Cabrio" }
  ],
  chery: [
    { slug: "alia", name: "Alia" },
    { slug: "chance", name: "Chance" },
    { slug: "kimo", name: "Kimo" },
    { slug: "niche", name: "Niche" }
  ],
  citroen: [
    { slug: "ami", name: "AMI" },
    { slug: "c-elysee", name: "C-Elysée" },
    { slug: "c1", name: "C1" },
    { slug: "c2", name: "C2" },
    { slug: "c3", name: "C3" },
    { slug: "e-c3", name: "e-C3" },
    { slug: "c3-picasso", name: "C3 Picasso" },
    { slug: "c4", name: "C4" },
    { slug: "c4-grand-picasso", name: "C4 Grand Picasso" },
    { slug: "c4-picasso", name: "C4 Picasso" },
    { slug: "c4-x", name: "C4 X" },
    { slug: "e-c4", name: "e-C4" },
    { slug: "e-c4-x", name: "e-C4 X" },
    { slug: "c5", name: "C5" },
    { slug: "c6", name: "C6" },
    { slug: "c8", name: "C8" },
    { slug: "saxo", name: "Saxo" },
    { slug: "xsara", name: "Xsara" },
    { slug: "bx", name: "BX" },
    { slug: "xantia", name: "Xantia" },
    { slug: "xm", name: "XM" },
    { slug: "zx", name: "ZX" }
  ],
  fiat: [
    { slug: "124-spider", name: "124 Spider" },
    { slug: "albea", name: "Albea" },
    { slug: "brava", name: "Brava" },
    { slug: "bravo", name: "Bravo" },
    { slug: "126-bis", name: "126 Bis" },
    { slug: "coupe", name: "Coupe" },
    { slug: "croma", name: "Croma" },
    { slug: "500-ailesi", name: "500 Ailesi" },
    { slug: "egea", name: "Egea" },
    { slug: "idea", name: "Idea" },
    { slug: "linea", name: "Linea" },
    { slug: "marea", name: "Marea" },
    { slug: "mirafiori", name: "Mirafiori" },
    { slug: "palio", name: "Palio" },
    { slug: "panda", name: "Panda" },
    { slug: "punto", name: "Punto" },
    { slug: "siena", name: "Siena" },
    { slug: "stilo", name: "Stilo" },
    { slug: "tempra", name: "Tempra" },
    { slug: "tipo", name: "Tipo" },
    { slug: "topolino", name: "Topolino" },
    { slug: "ulysse", name: "Ulysse" },
    { slug: "uno", name: "UNO" }
  ],
  ford: [
    { slug: "b-max", name: "B-Max" },
    { slug: "c-max", name: "C-Max" },
    { slug: "escort", name: "Escort" },
    { slug: "fiesta", name: "Fiesta" },
    { slug: "focus", name: "Focus" },
    { slug: "fusion", name: "Fusion" },
    { slug: "galaxy", name: "Galaxy" },
    { slug: "grand-c-max", name: "Grand C-Max" },
    { slug: "ka", name: "Ka" },
    { slug: "mondeo", name: "Mondeo" },
    { slug: "mustang", name: "Mustang" },
    { slug: "s-max", name: "S-Max" },
    { slug: "taurus", name: "Taurus" },
    { slug: "cougar", name: "Cougar" },
    { slug: "festiva", name: "Festiva" },
    { slug: "granada", name: "Granada" },
    { slug: "orion", name: "Orion" },
    { slug: "probe", name: "Probe" },
    { slug: "scorpio", name: "Scorpio" },
    { slug: "sierra", name: "Sierra" },
    { slug: "taunus", name: "Taunus" },
    { slug: "thunderbird", name: "Thunderbird" }
  ],
  hyundai: [
    { slug: "accent", name: "Accent" },
    { slug: "accent-blue", name: "Accent Blue" },
    { slug: "accent-era", name: "Accent Era" },
    { slug: "atos", name: "Atos" },
    { slug: "centennial", name: "Centennial" },
    { slug: "coupe", name: "Coupe" },
    { slug: "elantra", name: "Elantra" },
    { slug: "excel", name: "Excel" },
    { slug: "genesis", name: "Genesis" },
    { slug: "getz", name: "Getz" },
    { slug: "grandeur", name: "Grandeur" },
    { slug: "i10", name: "i10" },
    { slug: "i20", name: "i20" },
    { slug: "i20-active", name: "i20 Active" },
    { slug: "i20-n", name: "i20 N" },
    { slug: "i30", name: "i30" },
    { slug: "i40", name: "i40" },
    { slug: "ioniq", name: "Ioniq" },
    { slug: "ioniq-6", name: "Ioniq 6" },
    { slug: "ix20", name: "iX20" },
    { slug: "matrix", name: "Matrix" },
    { slug: "s-coupe", name: "S-Coupe" },
    { slug: "sonata", name: "Sonata" },
    { slug: "trajet", name: "Trajet" }
  ],
  opel: [
    { slug: "adam", name: "Adam" },
    { slug: "agila", name: "Agila" },
    { slug: "ascona", name: "Ascona" },
    { slug: "astra", name: "Astra" },
    { slug: "astra-e", name: "Astra-e" },
    { slug: "calibra", name: "Calibra" },
    { slug: "cascada", name: "Cascada" },
    { slug: "corsa", name: "Corsa" },
    { slug: "corsa-e", name: "Corsa-e" },
    { slug: "gt-roadster", name: "GT (Roadster)" },
    { slug: "insignia", name: "Insignia" },
    { slug: "kadett", name: "Kadett" },
    { slug: "manta", name: "Manta" },
    { slug: "meriva", name: "Meriva" },
    { slug: "omega", name: "Omega" },
    { slug: "rekord", name: "Rekord" },
    { slug: "signum", name: "Signum" },
    { slug: "tigra", name: "Tigra" },
    { slug: "vectra", name: "Vectra" },
    { slug: "zafira", name: "Zafira" }
  ],
  peugeot: [
    { slug: "106", name: "106" },
    { slug: "107", name: "107" },
    { slug: "205", name: "205" },
    { slug: "206", name: "206" },
    { slug: "206-plus", name: "206 +" },
    { slug: "207", name: "207" },
    { slug: "208", name: "208" },
    { slug: "e-208", name: "e-208" },
    { slug: "301", name: "301" },
    { slug: "305", name: "305" },
    { slug: "306", name: "306" },
    { slug: "307", name: "307" },
    { slug: "308", name: "308" },
    { slug: "e-308", name: "e-308" },
    { slug: "405", name: "405" },
    { slug: "406", name: "406" },
    { slug: "407", name: "407" },
    { slug: "508", name: "508" },
    { slug: "605", name: "605" },
    { slug: "607", name: "607" },
    { slug: "807", name: "807" },
    { slug: "pars", name: "Pars" },
    { slug: "rcz", name: "RCZ" },
    { slug: "1007", name: "1007" }
  ],
  renault: [
    { slug: "clio", name: "Clio" },
    { slug: "espace", name: "Espace" },
    { slug: "fluence", name: "Fluence" },
    { slug: "fluence-ze", name: "Fluence Z.E." },
    { slug: "grand-scenic", name: "Grand Scenic" },
    { slug: "grand-modus", name: "Grand Modüs" },
    { slug: "laguna", name: "Laguna" },
    { slug: "latitude", name: "Latitude" },
    { slug: "megane", name: "Megane" },
    { slug: "megane-e-tech", name: "Megane E-Tech" },
    { slug: "modus", name: "Modus" },
    { slug: "safrane", name: "Safrane" },
    { slug: "scenic", name: "Scenic" },
    { slug: "symbol", name: "Symbol" },
    { slug: "taliant", name: "Taliant" },
    { slug: "talisman", name: "Talisman" },
    { slug: "twingo", name: "Twingo" },
    { slug: "twizy", name: "Twizy" },
    { slug: "vel-satis", name: "Vel Satis" },
    { slug: "zoe", name: "ZOE" },
    { slug: "r5-e-tech", name: "R5 E-Tech" },
    { slug: "r-5", name: "R 5" },
    { slug: "r-9", name: "R 9" },
    { slug: "r-11", name: "R 11" },
    { slug: "r-12", name: "R 12" },
    { slug: "r-19", name: "R 19" },
    { slug: "r-21", name: "R 21" },
    { slug: "r-25", name: "R 25" }
  ],
  skoda: [
    { slug: "citigo", name: "Citigo" },
    { slug: "fabia", name: "Fabia" },
    { slug: "favorit", name: "Favorit" },
    { slug: "felicia", name: "Felicia" },
    { slug: "forman", name: "Forman" },
    { slug: "octavia", name: "Octavia" },
    { slug: "rapid", name: "Rapid" },
    { slug: "roomster", name: "Roomster" },
    { slug: "scala", name: "Scala" },
    { slug: "superb", name: "Superb" }
  ],
  togg: [
    { slug: "t10f", name: "T10F" },
    { slug: "v1", name: "V1" },
    { slug: "v2", name: "V2" }
  ],
  toyota: [
    { slug: "auris", name: "Auris" },
    { slug: "avensis", name: "Avensis" },
    { slug: "avalon", name: "Avalon" },
    { slug: "camry", name: "Camry" },
    { slug: "carina", name: "Carina" },
    { slug: "celica", name: "Celica" },
    { slug: "corolla", name: "Corolla" },
    { slug: "corona", name: "Corona" },
    { slug: "cressida", name: "Cressida" },
    { slug: "gt86", name: "GT86" },
    { slug: "mr2", name: "MR2" },
    { slug: "prius", name: "Prius" },
    { slug: "starlet", name: "Starlet" },
    { slug: "supra", name: "Supra" },
    { slug: "tercel", name: "Tercel" },
    { slug: "urban-cruiser", name: "Urban Cruiser" },
    { slug: "verso", name: "Verso" },
    { slug: "yaris", name: "Yaris" }
  ],
  tofas: [
    { slug: "dogan", name: "Doğan" },
    { slug: "kartal", name: "Kartal" },
    { slug: "murat", name: "Murat" },
    { slug: "sahin", name: "Şahin" },
    { slug: "serce", name: "Serçe" }
  ],
  volkswagen: [
    { slug: "arteon", name: "Arteon" },
    { slug: "beetle", name: "Beetle" },
    { slug: "bora", name: "Bora" },
    { slug: "eos", name: "EOS" },
    { slug: "fox", name: "FOX" },
    { slug: "golf", name: "Golf" },
    { slug: "id-3", name: "ID.3" },
    { slug: "id-7", name: "ID.7" },
    { slug: "jetta", name: "Jetta" },
    { slug: "lupo", name: "Lupo" },
    { slug: "passat", name: "Passat" },
    { slug: "passat-alltrack", name: "Passat Alltrack" },
    { slug: "passat-variant", name: "Passat Variant" },
    { slug: "phaeton", name: "Phaeton" },
    { slug: "polo", name: "Polo" },
    { slug: "scirocco", name: "Scirocco" },
    { slug: "sharan", name: "Sharan" },
    { slug: "touran", name: "Touran" },
    { slug: "up-club", name: "Up Club" },
    { slug: "vw-cc", name: "VW CC" },
    { slug: "vento", name: "Vento" }
  ]
};

/** İlan filtre seçimi: `tasitlar.otomobil-{marka}` ara adımı */
export function otomobilListingsGateCategoryKey(brandSlug: string): string {
  return `tasitlar.otomobil-${brandSlug}`;
}

const BMW_SERIES_SLUG_RE = /^(\d+|[imz])-serisi$/;

function bmwCatalogModels(): readonly OtomobilMarkaModelDef[] {
  return OTOMOBIL_MARKA_MODELS.bmw ?? [];
}

function getSortedBmwSeriesForListingsFilter(): readonly OtomobilMarkaModelDef[] {
  const series = bmwCatalogModels().filter((m) => BMW_SERIES_SLUG_RE.test(m.slug));
  const numeric = series.filter((m) => /^\d+-serisi$/.test(m.slug));
  const letter = series.filter((m) => /^[imz]-serisi$/.test(m.slug));
  numeric.sort((a, b) => parseInt(a.slug, 10) - parseInt(b.slug, 10));
  letter.sort((a, b) => a.slug.localeCompare(b.slug));
  return [...numeric, ...letter];
}

function getBmwVariantOptionsForSeries(
  seriesSlug: string
): ReadonlyArray<{ slugFull: string; label: string }> {
  const out: Array<{ slugFull: string; label: string }> = [];
  for (const m of bmwCatalogModels()) {
    if (m.slug === seriesSlug || !m.slug.startsWith(`${seriesSlug}-`)) continue;
    const sep = "›";
    const i = m.name.indexOf(sep);
    const label =
      i === -1
        ? m.slug.slice(seriesSlug.length + 1)
        : m.name.slice(i + sep.length).trim();
    out.push({ slugFull: m.slug, label });
  }
  out.sort((a, b) => a.label.localeCompare(b.label, "tr"));
  return out;
}

function parseBmwModelRestForListings(modelRest: string): {
  seriesSlug: string;
  variantSlugFull: string;
} {
  if (!modelRest.length) return { seriesSlug: "", variantSlugFull: "" };
  const seriesRanked = [...getSortedBmwSeriesForListingsFilter()].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const s of seriesRanked) {
    if (modelRest === s.slug) return { seriesSlug: s.slug, variantSlugFull: "" };
    if (modelRest.startsWith(`${s.slug}-`)) {
      return { seriesSlug: s.slug, variantSlugFull: modelRest };
    }
  }
  return { seriesSlug: "", variantSlugFull: modelRest };
}

export function buildOtomobilListingsCategoryKey(
  brandSlug: string,
  modelTail: string
): string {
  const gate = otomobilListingsGateCategoryKey(brandSlug);
  const t = modelTail.trim();
  if (!t.length) return gate;
  return `${gate}-${t}`;
}

export type ParsedOtomobilListingsDrilldown = {
  gateKey: string;
  brandSlug: string;
  brandName: string;
  hierarchical: boolean;
  /** Kapıdan sonraki kısım: `bmw` ise `3-serisi`, `fiat` ise `albea` vb. */
  modelRest: string;
};

/**
 * Anahtar bir modelli otomobil markasına (veya onun yaprağına) ise marka seçiciye indirger.
 */
export function parseOtomobilListingsDrilldown(
  categoryKey: string
): ParsedOtomobilListingsDrilldown | null {
  const k = categoryKey.trim();
  if (!k.startsWith("tasitlar.")) return null;
  const fullSub = k.slice("tasitlar.".length);
  const prefix = "otomobil-";
  if (!fullSub.startsWith(prefix)) return null;
  const afterOto = fullSub.slice(prefix.length);
  const brands = [...OTOMOBIL_MARKALARI].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const b of brands) {
    if (!afterOto.startsWith(b.slug)) continue;
    const tail = afterOto.slice(b.slug.length);
    if (tail !== "" && !tail.startsWith("-")) continue;
    const modelRest = tail.startsWith("-") ? tail.slice(1) : "";
    const models = getOtomobilModelsForBrand(b.slug);
    if (!models?.length) return null;

    const hierarchical = models.some((m) => m.name.includes("›"));
    return {
      gateKey: otomobilListingsGateCategoryKey(b.slug),
      brandSlug: b.slug,
      brandName: b.name,
      hierarchical,
      modelRest
    };
  }
  return null;
}

/** Tek satırdaki düz model listesi (Örn. Fiat › Albea) – ada göre sıralı */
export function getSortedFlatOtomobilModelsForListingsFilter(
  brandSlug: string
): ReadonlyArray<{ slug: string; label: string }> {
  const models = getOtomobilModelsForBrand(brandSlug);
  if (!models?.length) return [];
  const out = models.map((m) => ({
    slug: m.slug,
    label: m.name
  }));
  out.sort((a, b) => a.label.localeCompare(b.label, "tr"));
  return out;
}

export function listingsOtomobilBmwSeriesRows(): readonly OtomobilMarkaModelDef[] {
  return getSortedBmwSeriesForListingsFilter();
}

export function listingsOtomobilBmwVariantsForSeries(
  seriesSlug: string
): ReadonlyArray<{ slugFull: string; label: string }> {
  return getBmwVariantOptionsForSeries(seriesSlug);
}

export function listingsOtomobilParseBmwModelRest(modelRest: string): {
  seriesSlug: string;
  variantSlugFull: string;
} {
  return parseBmwModelRestForListings(modelRest);
}

/** İlan filtresi: Konut kapısı ve ara/yaprak anahtarları */
export function buildGayrimenkulKonutListingsCategoryKey(
  txn: "" | (typeof KONUT_LISTING_KINDS)[number]["slug"],
  prop: "" | (typeof KONUT_PROPERTY_TYPES)[number]["slug"]
): string {
  if (!txn) return "gayrimenkul.konut";
  const mid = `konut-${txn}`;
  if (!prop) return compositeCategoryKey("gayrimenkul", mid);
  return compositeCategoryKey(
    "gayrimenkul",
    konutLeafCategorySubSlug(txn, prop)
  );
}

export function parseGayrimenkulKonutListingsParts(categoryKey: string): {
  txn: "" | (typeof KONUT_LISTING_KINDS)[number]["slug"];
  prop: "" | (typeof KONUT_PROPERTY_TYPES)[number]["slug"];
} | null {
  const k = categoryKey.trim();
  if (!k.startsWith("gayrimenkul.")) return null;
  const sub = k.slice("gayrimenkul.".length);
  if (sub === "konut") return { txn: "", prop: "" };
  if (!sub.startsWith("konut-")) return null;
  const leaf = tryParseKonutLeafSubSlug(sub);
  if (leaf) {
    return {
      txn: leaf.txn,
      prop: leaf.prop
    };
  }
  for (const t of KONUT_LISTING_KINDS) {
    if (sub === `konut-${t.slug}`) return { txn: t.slug, prop: "" };
  }
  return null;
}

export type GayrimenkulEmlakKindDrilldown = {
  gateKey: string;
  baseSlug: string;
  baseLabel: string;
  txn: "" | (typeof KONUT_LISTING_KINDS)[number]["slug"];
};

/** İş yeri, arsa vb.: kapı `gayrimenkul.{base}` veya yaprak `…-{satilik|kiralik}` */
export function parseGayrimenkulEmlakKindListingsDrilldown(
  categoryKey: string
): GayrimenkulEmlakKindDrilldown | null {
  const k = categoryKey.trim();
  if (!k.startsWith("gayrimenkul.")) return null;
  const rest = k.slice("gayrimenkul.".length);
  const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul");
  if (!gm) return null;
  const mids = gm.subs.filter((s) => s.drilldown === "emlak-listing-kind");
  const bases = mids.map((m) => m.slug).sort((a, b) => b.length - a.length);
  for (const base of bases) {
    const def = mids.find((m) => m.slug === base);
    if (!def) continue;
    if (rest === base) {
      return {
        gateKey: compositeCategoryKey("gayrimenkul", base),
        baseSlug: base,
        baseLabel: def.name,
        txn: ""
      };
    }
    for (const t of KONUT_LISTING_KINDS) {
      if (rest === `${base}-${t.slug}`) {
        return {
          gateKey: compositeCategoryKey("gayrimenkul", base),
          baseSlug: base,
          baseLabel: def.name,
          txn: t.slug
        };
      }
    }
  }
  return null;
}

export function buildGayrimenkulEmlakKindListingsCategoryKey(
  baseSlug: string,
  txn: "" | (typeof KONUT_LISTING_KINDS)[number]["slug"]
): string {
  if (!txn) return compositeCategoryKey("gayrimenkul", baseSlug);
  return compositeCategoryKey("gayrimenkul", `${baseSlug}-${txn}`);
}

/** İlanlar filtresi: Emlak grubunda uzun “Konut › Satılık › …” yerine tek satır (Konut, İş yeri, …) */
export function gayrimenkulListingsFilterRows(): ReadonlyArray<{
  reactKey: string;
  compositeKey: string;
  label: string;
}> {
  const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul")!;
  const rows: Array<{ reactKey: string; compositeKey: string; label: string }> =
    [];
  for (const sub of gm.subs) {
    if (sub.drilldown === "konut") {
      rows.push({
        reactKey: "gayrimenkul-konut-gate",
        compositeKey: "gayrimenkul.konut",
        label: sub.name
      });
    } else if (sub.drilldown === "emlak-listing-kind") {
      rows.push({
        reactKey: `${sub.slug}-gate`,
        compositeKey: compositeCategoryKey("gayrimenkul", sub.slug),
        label: sub.name
      });
    } else {
      rows.push({
        reactKey: sub.slug,
        compositeKey: compositeCategoryKey("gayrimenkul", sub.slug),
        label: sub.name
      });
    }
  }
  return rows;
}

/** Kategori `<select>`: marka / konut / emlak kapıları alt seçimlerle yönetilir */
export function canonicalListingsCategorySelectValue(categoryKey: string): string {
  const d = parseOtomobilListingsDrilldown(categoryKey);
  if (d) return d.gateKey;
  if (parseGayrimenkulKonutListingsParts(categoryKey)) return "gayrimenkul.konut";
  const emlak = parseGayrimenkulEmlakKindListingsDrilldown(categoryKey);
  if (emlak) return emlak.gateKey;
  return categoryKey.trim();
}

export function getOtomobilModelsForBrand(
  brandSlug: string
): readonly OtomobilMarkaModelDef[] | undefined {
  return OTOMOBIL_MARKA_MODELS[brandSlug as keyof typeof OTOMOBIL_MARKA_MODELS];
}

/** İlan formu: marka seçilmeden `tasitlar.otomobil` ara anahtarı */
export const TASITLAR_OTOMOBIL_INTERMEDIATE_KEY = "tasitlar.otomobil";

/** Yaprak: `otomobil-{marka}-{model}` */
export function tryParseOtomobilModelLeafSubSlug(subSlug: string): {
  brandSlug: string;
  brandName: string;
  modelSlug: string;
  modelName: string;
} | null {
  const prefix = "otomobil-";
  if (!subSlug.startsWith(prefix)) return null;
  const rest = subSlug.slice(prefix.length);
  const brands = [...OTOMOBIL_MARKALARI].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const b of brands) {
    const models = OTOMOBIL_MARKA_MODELS[b.slug];
    if (!models?.length) continue;
    const p = `${b.slug}-`;
    if (!rest.startsWith(p)) continue;
    const modelSlug = rest.slice(p.length);
    const model = models.find((m) => m.slug === modelSlug);
    if (model) {
      return {
        brandSlug: b.slug,
        brandName: b.name,
        modelSlug: model.slug,
        modelName: model.name
      };
    }
  }
  return null;
}

/**
 * Katalogda tanımlı olmayan model yaprakları (`otomobil-ford-yeni-model`).
 * Admin veya veritabanında eklenen slug’lar için `parseCategoryKey` / `sqlCategorySlugToKey` uyumu.
 */
export function tryParseOtomobilDynamicModelLeafSubSlug(subSlug: string): {
  brandSlug: string;
  brandName: string;
  modelSlug: string;
} | null {
  if (tryParseOtomobilModelLeafSubSlug(subSlug)) return null;
  const prefix = "otomobil-";
  if (!subSlug.startsWith(prefix)) return null;
  const rest = subSlug.slice(prefix.length);
  const brands = [...OTOMOBIL_MARKALARI].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const b of brands) {
    const p = `${b.slug}-`;
    if (!rest.startsWith(p)) continue;
    const modelSlug = rest.slice(p.length);
    if (!modelSlug.length) continue;
    return { brandSlug: b.slug, brandName: b.name, modelSlug };
  }
  return null;
}

function formatOtomobilDynamicModelLabel(modelSlug: string): string {
  return modelSlug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Modelli olmayan marka yaprağı: `otomobil-ford` */
export function tryParseOtomobilBrandOnlyLeafSubSlug(subSlug: string): {
  brandSlug: string;
  brandName: string;
} | null {
  const prefix = "otomobil-";
  if (!subSlug.startsWith(prefix)) return null;
  const rest = subSlug.slice(prefix.length);
  if (rest.includes("-")) return null;
  const m = OTOMOBIL_MARKALARI.find((x) => x.slug === rest);
  if (!m) return null;
  if (OTOMOBIL_MARKA_MODELS[m.slug]?.length) return null;
  return { brandSlug: m.slug, brandName: m.name };
}

/** Model seçilmeden marka adımı: `otomobil-chery` (modelli markalar) */
export function tryParseOtomobilBrandIntermediateSubSlug(subSlug: string): {
  brandSlug: string;
  brandName: string;
} | null {
  const prefix = "otomobil-";
  if (!subSlug.startsWith(prefix)) return null;
  const rest = subSlug.slice(prefix.length);
  if (rest.includes("-")) return null;
  const m = OTOMOBIL_MARKALARI.find((x) => x.slug === rest);
  if (!m) return null;
  if (!OTOMOBIL_MARKA_MODELS[m.slug]?.length) return null;
  return { brandSlug: m.slug, brandName: m.name };
}

/**
 * Model + modelsiz marka yaprakları (ilan kaydı için yeterli); ara anahtarlar değil.
 */
export function isTasitlarOtomobilFinalListingKey(key: string): boolean {
  const t = key.trim();
  if (!t.startsWith("tasitlar.")) return false;
  const rest = t.slice("tasitlar.".length);
  return (
    tryParseOtomobilModelLeafSubSlug(rest) != null ||
    tryParseOtomobilBrandOnlyLeafSubSlug(rest) != null ||
    tryParseOtomobilDynamicModelLeafSubSlug(rest) != null
  );
}

/** Model sütunu: hangi marka için seçim bekleniyor */
export function getTasitlarOtomobilBrandSlugAwaitingModel(key: string): string | null {
  const t = key.trim();
  if (!t.startsWith("tasitlar.")) return null;
  const rest = t.slice("tasitlar.".length);
  const inter = tryParseOtomobilBrandIntermediateSubSlug(rest);
  return inter ? inter.brandSlug : null;
}

/** Geriye uyumluluk: marka/model/ara adım tanı */
export function tryParseOtomobilMarkaLeafSubSlug(subSlug: string): {
  brandSlug: string;
  brandName: string;
} | null {
  const model = tryParseOtomobilModelLeafSubSlug(subSlug);
  if (model) return { brandSlug: model.brandSlug, brandName: model.brandName };
  const brandOnly = tryParseOtomobilBrandOnlyLeafSubSlug(subSlug);
  if (brandOnly) return brandOnly;
  const inter = tryParseOtomobilBrandIntermediateSubSlug(subSlug);
  if (inter) return inter;
  return null;
}

export function isIntermediateTasitlarOtomobilListingKey(key: string): boolean {
  const t = key.trim();
  if (t === TASITLAR_OTOMOBIL_INTERMEDIATE_KEY) return true;
  if (!t.startsWith("tasitlar.")) return false;
  const rest = t.slice("tasitlar.".length);
  return tryParseOtomobilBrandIntermediateSubSlug(rest) != null;
}

/** Yeni ilan: kategori seçimi eksiksiz yaprak mı (ara adım yok)? */
export function isReadyListingCategoryKey(key: string): boolean {
  if (!key.trim()) return false;
  if (isIntermediateGayrimenkulListingKey(key)) return false;
  if (isIntermediateTasitlarOtomobilListingKey(key)) return false;
  return true;
}

export type CategoryGroupDef = {
  slug: string;
  emoji: string;
  name: string;
  subs: SubcategoryDef[];
};

/** Konut ilanı: işlem tipi (Emlak › Konut › …) */
export const KONUT_LISTING_KINDS = [
  { slug: "satilik", name: "Satılık" },
  { slug: "kiralik", name: "Kiralık" }
] as const;

/** Konut yapı / tip (sahibinden benzeri liste) */
export const KONUT_PROPERTY_TYPES = [
  { slug: "daire", name: "Daire" },
  { slug: "rezidans", name: "Rezidans" },
  { slug: "mustakil-ev", name: "Müstakil Ev" },
  { slug: "villa", name: "Villa" },
  { slug: "ciftlik-evi", name: "Çiftlik Evi" },
  { slug: "kosk-konak", name: "Köşk & Konak" },
  { slug: "yali", name: "Yalı" },
  { slug: "yazlik", name: "Yazlık" }
] as const;

const KONUT_DRILL_SUB_PREFIX = "konut-";

/** Eski düz Emlak anahtarları (gayrimenkul.daire vb.) — DB’de kayıtlı ilanlar için */
const GAYRIMENKUL_LEGACY_LEAF_SUBS: SubcategoryDef[] = [
  { slug: "daire", name: "Daire" },
  { slug: "villa", name: "Villa" },
  { slug: "ev", name: "Müstakil ev" }
];

/** `konut-satilik-daire` / `konut-satilik-mustakil-ev` segmenti; txn sabit iki değer, prop'ta tire olabilir */
export function tryParseKonutLeafSubSlug(subSlug: string): {
  txn: (typeof KONUT_LISTING_KINDS)[number]["slug"];
  prop: (typeof KONUT_PROPERTY_TYPES)[number]["slug"];
} | null {
  if (!subSlug.startsWith(KONUT_DRILL_SUB_PREFIX)) return null;
  const rest = subSlug.slice(KONUT_DRILL_SUB_PREFIX.length);
  for (const k of KONUT_LISTING_KINDS) {
    const p = `${k.slug}-`;
    if (!rest.startsWith(p)) continue;
    const prop = rest.slice(p.length);
    if (
      KONUT_PROPERTY_TYPES.some((x) => x.slug === prop as (typeof KONUT_PROPERTY_TYPES)[number]["slug"])
    ) {
      return {
        txn: k.slug,
        prop: prop as (typeof KONUT_PROPERTY_TYPES)[number]["slug"]
      };
    }
  }
  return null;
}

export function konutLeafCategorySubSlug(
  txn: (typeof KONUT_LISTING_KINDS)[number]["slug"],
  prop: (typeof KONUT_PROPERTY_TYPES)[number]["slug"]
): string {
  return `${KONUT_DRILL_SUB_PREFIX}${txn}-${prop}`;
}

export function labelKonutLeafCategory(txn: string, prop: string): string {
  const k = KONUT_LISTING_KINDS.find((x) => x.slug === txn);
  const p = KONUT_PROPERTY_TYPES.find((x) => x.slug === prop);
  const txl = k?.name ?? txn;
  const pl = p?.name ?? prop;
  return `Konut › ${txl} › ${pl}`;
}

/**
 * Satariz / büyük ilan siteleriyle uyumlu sıra ve isimlendirme.
 * Bileşik anahtar (grup.alt) değişince DB’de categories.slug satırı gerekir.
 */
export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    slug: "tasitlar",
    emoji: "🚗",
    name: "Vasıta",
    subs: [
      { slug: "otomobil", name: "Otomobil", drilldown: "otomobil-marka" },
      { slug: "motosiklet", name: "Motosiklet" },
      { slug: "ticari-araclar", name: "Ticari araç" },
      { slug: "bisiklet", name: "Bisiklet" },
      { slug: "deniz-tasitlari", name: "Deniz aracı (tekne, yat)" }
    ]
  },
  {
    slug: "gayrimenkul",
    emoji: "🏠",
    name: "Emlak",
    subs: [
      { slug: "konut", name: "Konut", drilldown: "konut" },
      { slug: "isyeri-ofis", name: "İş yeri", drilldown: "emlak-listing-kind" },
      { slug: "arsa", name: "Arsa", drilldown: "emlak-listing-kind" },
      {
        slug: "toprak",
        name: "Toprak & tarla",
        drilldown: "emlak-listing-kind"
      },
      {
        slug: "depo-garaj",
        name: "Depo & garaj",
        drilldown: "emlak-listing-kind"
      }
    ]
  },
  {
    slug: "elektronik",
    emoji: "📱",
    name: "Elektronik",
    subs: [
      { slug: "telefon", name: "Cep telefonu" },
      { slug: "bilgisayar-tablet", name: "Bilgisayar & tablet" },
      { slug: "televizyon", name: "TV & görüntü" },
      { slug: "beyaz-esya", name: "Beyaz eşya" },
      { slug: "ses-hoparlor", name: "Ses & görüntü" }
    ]
  },
  {
    slug: "ev-yasam",
    emoji: "🧸",
    name: "Ev eşyası & yaşam",
    subs: [
      { slug: "mobilya", name: "Mobilya" },
      { slug: "ev-dekorasyonu", name: "Ev dekorasyon" },
      { slug: "mutfak-esyalari", name: "Mutfak" },
      { slug: "bahce-balkon", name: "Bahçe & balkon" }
    ]
  },
  {
    slug: "moda-kisisel",
    emoji: "👕",
    name: "Giyim & kişisel",
    subs: [
      { slug: "giyim", name: "Giyim" },
      { slug: "ayakkabi", name: "Ayakkabı" },
      { slug: "canta-aksesuar", name: "Çanta & aksesuar" },
      { slug: "saat-taki", name: "Saat & takı" }
    ]
  },
  {
    slug: "hobi-eglence",
    emoji: "🎮",
    name: "Hobi & eğlence",
    subs: [
      { slug: "oyun-konsolu-oyunlar", name: "Oyun & konsol" },
      { slug: "spor-malzemeleri", name: "Spor" },
      { slug: "muzik-aletleri", name: "Müzik" },
      { slug: "koleksiyon-urunleri", name: "Koleksiyon" }
    ]
  },
  {
    slug: "hayvanlar",
    emoji: "🐾",
    name: "Hayvanlar",
    subs: [
      { slug: "evcil-hayvanlar", name: "Evcil hayvan" },
      { slug: "hayvan-aksesuarlari", name: "Aksesuar" },
      { slug: "mama-bakim-urunleri", name: "Mama & bakım" }
    ]
  },
  {
    slug: "is-sanayi",
    emoji: "🛠️",
    name: "İş makineleri & sanayi",
    subs: [
      { slug: "tarim-makineleri", name: "Tarım makinesi" },
      { slug: "insaat-ekipmanlari", name: "İnşaat" },
      { slug: "el-aletleri", name: "El aleti" },
      { slug: "ofis-malzemeleri", name: "Ofis" }
    ]
  }
];

/**
 * `isyeri-ofis-satilik`, `depo-garaj-kiralik` vb. (Konut dallarıyla çakışmaz).
 */
export function tryParseGayrimenkulSatKirLeafSubSlug(subSlug: string): {
  baseSlug: string;
  baseLabel: string;
  txn: (typeof KONUT_LISTING_KINDS)[number]["slug"];
} | null {
  if (tryParseKonutLeafSubSlug(subSlug)) return null;
  if (subSlug.startsWith(KONUT_DRILL_SUB_PREFIX)) return null;

  const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul");
  const mids =
    gm?.subs.filter((s) => s.drilldown === "emlak-listing-kind") ?? [];
  const bases = mids.map((m) => m.slug).sort((a, b) => b.length - a.length);

  for (const k of KONUT_LISTING_KINDS) {
    const suf = `-${k.slug}`;
    if (!subSlug.endsWith(suf)) continue;
    const base = subSlug.slice(0, -suf.length);
    if (!bases.includes(base)) continue;
    const def = mids.find((m) => m.slug === base);
    if (!def) continue;
    return { baseSlug: base, baseLabel: def.name, txn: k.slug };
  }
  return null;
}

export function labelGayrimenkulSatKirLeaf(baseLabel: string, txn: string): string {
  const k = KONUT_LISTING_KINDS.find((x) => x.slug === txn);
  return `${baseLabel} › ${k?.name ?? txn}`;
}

/** Yeni ilan: ara adım (Konut ara hattı için veritabanı slug’ına gitmemeli) */
export const GAYRIMENKUL_KONUT_INTERMEDIATE_KEY = "gayrimenkul.konut";

/** `gayrimenkul.konut` veya düz `gayrimenkul.isyeri-ofis` gibi ara anahtar — yeni kayıtta yasak */
export function isIntermediateGayrimenkulListingKey(key: string): boolean {
  if (key === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY) return true;
  const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul");
  if (!gm?.subs.length || !key.startsWith(`${gm.slug}.`)) return false;
  const subSlug = key.slice(gm.slug.length + 1);
  if (
    tryParseKonutLeafSubSlug(subSlug) ||
    tryParseGayrimenkulSatKirLeafSubSlug(subSlug)
  ) {
    return false;
  }
  const mid = gm.subs.find((s) => s.slug === subSlug && s.drilldown);
  return Boolean(mid);
}

export type ParsedCategorySlug = {
  group: CategoryGroupDef;
  sub: SubcategoryDef;
};

/** Uygulama içi bileşik anahtar: "elektronik.telefon" */
export function compositeCategoryKey(groupSlug: string, subSlug: string): string {
  return `${groupSlug}.${subSlug}`;
}

/** Kenar çubukları / liste filtresi: her satır seçilebilir yaprak kategori */
export function leafRowsForCategoryGroup(group: CategoryGroupDef): ReadonlyArray<{
  reactKey: string;
  compositeKey: string;
  label: string;
}> {
  const rows: Array<{ reactKey: string; compositeKey: string; label: string }> = [];
  for (const sub of group.subs) {
    if (sub.drilldown === "konut") {
      for (const txn of KONUT_LISTING_KINDS) {
        for (const prop of KONUT_PROPERTY_TYPES) {
          const subSlug = konutLeafCategorySubSlug(txn.slug, prop.slug);
          const compositeKey = compositeCategoryKey(group.slug, subSlug);
          rows.push({
            reactKey: compositeKey,
            compositeKey,
            label: `${sub.name} › ${txn.name} › ${prop.name}`
          });
        }
      }
      continue;
    }
    if (sub.drilldown === "emlak-listing-kind") {
      for (const txn of KONUT_LISTING_KINDS) {
        const subSlug = `${sub.slug}-${txn.slug}`;
        const compositeKey = compositeCategoryKey(group.slug, subSlug);
        rows.push({
          reactKey: compositeKey,
          compositeKey,
          label: `${sub.name} › ${txn.name}`
        });
      }
      continue;
    }
    if (sub.drilldown === "otomobil-marka") {
      for (const m of OTOMOBIL_MARKALARI) {
        const models = getOtomobilModelsForBrand(m.slug);
        if (models?.length) {
          for (const mod of models) {
            const subSlug = `otomobil-${m.slug}-${mod.slug}`;
            const compositeKey = compositeCategoryKey(group.slug, subSlug);
            rows.push({
              reactKey: compositeKey,
              compositeKey,
              label: `${sub.name} › ${m.name} › ${mod.name}`
            });
          }
        } else {
          const subSlug = `otomobil-${m.slug}`;
          const compositeKey = compositeCategoryKey(group.slug, subSlug);
          rows.push({
            reactKey: compositeKey,
            compositeKey,
            label: `${sub.name} › ${m.name}`
          });
        }
      }
      continue;
    }
    const compositeKey = compositeCategoryKey(group.slug, sub.slug);
    rows.push({
      reactKey: sub.slug,
      compositeKey,
      label: sub.name
    });
  }
  return rows;
}

/** İlanlar filtresi select: Vasıta › önce Otomobil markaları, sonra diğer alt türler */
export function tasitlarFilterOptgroups(): {
  otomobil: ReadonlyArray<{ reactKey: string; compositeKey: string; label: string }>;
  diger: ReadonlyArray<{ reactKey: string; compositeKey: string; label: string }>;
} {
  const group = CATEGORY_GROUPS.find((g) => g.slug === "tasitlar")!;
  const otomobil: Array<{ reactKey: string; compositeKey: string; label: string }> =
    [];
  for (const m of OTOMOBIL_MARKALARI) {
    const models = getOtomobilModelsForBrand(m.slug);
    if (models?.length) {
      otomobil.push({
        reactKey: `otomobil-${m.slug}`,
        compositeKey: otomobilListingsGateCategoryKey(m.slug),
        label: m.name
      });
    } else {
      const subSlug = `otomobil-${m.slug}`;
      otomobil.push({
        reactKey: subSlug,
        compositeKey: compositeCategoryKey("tasitlar", subSlug),
        label: m.name
      });
    }
  }
  const diger = group.subs
    .filter((s) => s.slug !== "otomobil")
    .map((sub) => ({
      reactKey: sub.slug,
      compositeKey: compositeCategoryKey("tasitlar", sub.slug),
      label: sub.name
    }));
  return { otomobil, diger };
}

/**
 * İlanlar sayfası kategori filtresi: seçim yaprağın kendisiyle eşleşir veya
 * Vasıta’da daha genel bir önek ise (ör. tüm BMW, tüm 3 Serisi) alt yaprağı da dahil eder.
 */
export function listingsCategoryFilterMatches(
  listingCategoryKey: string,
  filterCategoryKey: string
): boolean {
  const L = listingCategoryKey.trim();
  const F = filterCategoryKey.trim();
  if (!F) return true;
  if (L === F) return true;
  if (
    F.startsWith("tasitlar.") ||
    F.startsWith("gayrimenkul.")
  ) {
    return L.startsWith(`${F}-`);
  }
  return false;
}

/** Grup slug'ında tire olabilir; ayırıcı olarak grup.slug + "." ile en uzun eşleşmeyi kullan. */
export function parseCategoryKey(key: string): ParsedCategorySlug | null {
  const ordered = [...CATEGORY_GROUPS].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const group of ordered) {
    const prefix = `${group.slug}.`;
    if (!key.startsWith(prefix)) continue;
    const subSlug = key.slice(prefix.length);

    if (group.slug === "tasitlar") {
      const modelLeaf = tryParseOtomobilModelLeafSubSlug(subSlug);
      if (modelLeaf) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: `Otomobil › ${modelLeaf.brandName} › ${modelLeaf.modelName}`
          }
        };
      }
      const brandOnly = tryParseOtomobilBrandOnlyLeafSubSlug(subSlug);
      if (brandOnly) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: `Otomobil › ${brandOnly.brandName}`
          }
        };
      }
      const brandMid = tryParseOtomobilBrandIntermediateSubSlug(subSlug);
      if (brandMid) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: `Otomobil › ${brandMid.brandName}`
          }
        };
      }
      const dynModel = tryParseOtomobilDynamicModelLeafSubSlug(subSlug);
      if (dynModel) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: `Otomobil › ${dynModel.brandName} › ${formatOtomobilDynamicModelLabel(
              dynModel.modelSlug
            )}`
          }
        };
      }
    }

    if (group.slug === "gayrimenkul") {
      const konutLeaf = tryParseKonutLeafSubSlug(subSlug);
      if (konutLeaf) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: labelKonutLeafCategory(konutLeaf.txn, konutLeaf.prop)
          }
        };
      }
      const satKirLeaf = tryParseGayrimenkulSatKirLeafSubSlug(subSlug);
      if (satKirLeaf) {
        return {
          group,
          sub: {
            slug: subSlug,
            name: labelGayrimenkulSatKirLeaf(satKirLeaf.baseLabel, satKirLeaf.txn)
          }
        };
      }
      if (subSlug === "konut") {
        return { group, sub: { slug: "konut", name: "Konut" } };
      }
      const legacy = GAYRIMENKUL_LEGACY_LEAF_SUBS.find((s) => s.slug === subSlug);
      if (legacy) return { group, sub: legacy };
    }

    const sub = group.subs.find((s) => s.slug === subSlug);
    if (sub) return { group, sub };
  }
  return null;
}

/**
 * Serbest kelime aramasında ilanın seçili kategori etiketiyle de eşler
 * (örn. başlıkta "villa" yoksa bile q "villa" → Villa alt kategorisi).
 */
export function categoryKeyMatchesListingSearch(
  categoryKey: string,
  qNormalized: string
): boolean {
  const q = qNormalized.trim().toLowerCase();
  if (!q) return false;
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) {
    return categoryKey.toLowerCase().includes(q);
  }
  const { group, sub } = parsed;
  if (group.name.toLowerCase().includes(q)) return true;
  if (sub.name.toLowerCase().includes(q)) return true;
  if (sub.slug.includes(q)) return true;
  const subAsWords = sub.slug.replace(/-/g, " ");
  if (subAsWords.includes(q)) return true;
  return false;
}

/** Kart / detayda gösterilecek satır örn: "📱 Elektronik › Telefon"; konut yaprağı tam zinciri sub.name ile verir */
export function formatCategoryDisplay(key: string): string {
  const parsed = parseCategoryKey(key);
  if (!parsed) return key;
  const { group, sub } = parsed;
  return `${group.emoji} ${group.name} › ${sub.name}`;
}

/** Sadece konum: "İl · ilçe" (ilçe yoksa il). */
export function formatListingPlaceLine(
  city: string,
  district?: string | null
): string {
  const c = city.trim() || "Konum belirtilmedi";
  const d = district?.trim();
  return d ? `${c} · ${d}` : c;
}

/** Kartta kısa: şehir (ve isteğe bağlı ilçe) + kategori özeti */
export function formatListingCategoryLineCity(
  city: string,
  categoryKey: string,
  district?: string | null
): string {
  const place = formatListingPlaceLine(city, district);
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) return `${place} · ${categoryKey}`;
  return `${place} · ${parsed.group.name} › ${parsed.sub.name}`;
}

export function sqlCategorySlugFromKey(categoryKey: string): string {
  const parsed = parseCategoryKey(categoryKey);
  if (!parsed) return categoryKey.replace(/\./g, "_");
  return `${parsed.group.slug}_${parsed.sub.slug}`;
}

export function sqlCategorySlugToKey(sqlSlug: string): string | null {
  const ordered = [...CATEGORY_GROUPS].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  for (const group of ordered) {
    const prefix = `${group.slug}_`;
    if (!sqlSlug.startsWith(prefix)) continue;
    const subSlug = sqlSlug.slice(prefix.length);

    if (group.slug === "tasitlar") {
      if (
        tryParseOtomobilModelLeafSubSlug(subSlug) ||
        tryParseOtomobilBrandOnlyLeafSubSlug(subSlug) ||
        tryParseOtomobilBrandIntermediateSubSlug(subSlug) ||
        tryParseOtomobilDynamicModelLeafSubSlug(subSlug)
      ) {
        return compositeCategoryKey(group.slug, subSlug);
      }
    }

    if (group.slug === "gayrimenkul") {
      if (tryParseKonutLeafSubSlug(subSlug)) {
        return compositeCategoryKey(group.slug, subSlug);
      }
      if (tryParseGayrimenkulSatKirLeafSubSlug(subSlug)) {
        return compositeCategoryKey(group.slug, subSlug);
      }
      if (subSlug === "konut") {
        return compositeCategoryKey(group.slug, "konut");
      }
      const legacy = GAYRIMENKUL_LEGACY_LEAF_SUBS.find((s) => s.slug === subSlug);
      if (legacy) return compositeCategoryKey(group.slug, legacy.slug);
    }

    const sub = group.subs.find((s) => s.slug === subSlug);
    if (sub) return compositeCategoryKey(group.slug, sub.slug);
  }
  return null;
}

/** Türkçe TL biçimi (tüm ilan ekranları) */
export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)} TL`;
}

/**
 * Form alanı: sayıyı binlik nokta (ve gerekirse ondalık virgül) ile gösterir.
 * Örn. 1500 → "1.500", 750000 → "750.000", 99,5 → "99,5"
 */
export function formatPriceInputDisplay(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Fiyat alanı metnini sayıya çevirir. Binlik ayırıcı nokta, ondalık virgül.
 * "1.500" / "750.000" / "1.500,50" / "1500" desteklenir.
 */
export function parsePriceInput(raw: string): number {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return Number.NaN;
  if (s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d+\.\d{1,2}$/.test(s)) {
    return parseFloat(s);
  }
  return parseFloat(s.replace(/\./g, ""));
}

/** İmleçten önce kaç rakam var (live format ile eşlemek için) */
export function countPriceDigitsPrefix(
  raw: string,
  caretExclusive: number
): number {
  const end = Math.max(0, Math.min(Math.floor(caretExclusive), raw.length));
  let n = 0;
  for (let i = 0; i < end; i++) {
    if (/\d/.test(raw[i] ?? "")) n++;
  }
  return n;
}

/** `formatPriceInputDisplay` sonucunda ilk N rakamdan sonraki imleç sırası */
export function caretIndexAfterPriceDigits(
  display: string,
  digitsBefore: number
): number {
  let pos = 0;
  let d = 0;
  while (pos < display.length && d < digitsBefore) {
    if (/\d/.test(display[pos] ?? "")) d++;
    pos++;
  }
  return pos;
}
