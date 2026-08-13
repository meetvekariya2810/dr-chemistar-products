import { CropSolution, DiseasePestItem } from '../types';

export const CROP_SOLUTIONS: CropSolution[] = [
  {
    id: 'cotton',
    name: 'Cotton',
    nameHi: 'कपास (कॉटन)',
    nameGu: 'કપાસ (Cotton)',
    category: 'Cash Crops',
    image: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=800&q=80',
    majorPests: ['Pink Bollworm', 'Whitefly', 'Thrips', 'Aphids', 'Jassids', 'Mealybug'],
    majorDiseases: ['Root Rot', 'Leaf Blight', 'Anthracnose', 'Wilt'],
    recommendedProductIds: ['malika', 'all-takatak', 'ematin-5', 'prof-super-44', 'fire', 'call-break'],
    spraySchedule: [
      { stage: 'Seedling Stage (0-20 Days)', days: '15-20 Days', focus: 'Sucking Pests & Early Root Growth', products: ['STAR TARA', 'THAIOSTAR', 'STARMIDA'] },
      { stage: 'Vegetative Stage (25-45 Days)', days: '30-40 Days', focus: 'Thrips, Jassids & Leaf Spot', products: ['MALIKA', 'ALL TAKATAK', 'CYTO-6'] },
      { stage: 'Square & Flowering Stage (50-75 Days)', days: '55-65 Days', focus: 'Bollworm Complex & Flower Drop Prevention', products: ['EMATIN-5', 'PROF SUPER 44', 'CALL BREAK'] },
      { stage: 'Boll Development Stage (80-110 Days)', days: '85-95 Days', focus: 'Pink Bollworm & Boll Weight', products: ['FASTER ++', 'NUTRI POWER 00:52:34', 'STICK WELL'] }
    ]
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    nameHi: 'मूंगफली (Groundnut)',
    nameGu: 'મગફળી (Groundnut)',
    category: 'Oilseeds',
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
    majorPests: ['White Grub', 'Spodoptera', 'Aphids', 'Thrips'],
    majorDiseases: ['Tikka Disease (Leaf Spot)', 'Stem Rot / Collar Rot', 'Rust'],
    recommendedProductIds: ['babuli', 'fire', 'kombi-shaft', 'vitayu', 'suffal-gold'],
    spraySchedule: [
      { stage: 'Sowing & Germination (0-15 Days)', days: 'At Sowing', focus: 'White Grub & Seed Rot', products: ['BABULI', 'FIRE', 'MOXA-35'] },
      { stage: 'Pegging & Flowering (30-45 Days)', days: '35 Days', focus: 'Tikka Disease & Root Expansion', products: ['KOMBI SHAFT', 'SUFFAL GOLD', 'HUMIC 98%'] },
      { stage: 'Pod Development (60-80 Days)', days: '65 Days', focus: 'Pod Weight & Leaf Rust', products: ['HEXON PLUS', 'DR. CARBO'] }
    ]
  },
  {
    id: 'cumin',
    name: 'Cumin',
    nameHi: 'जीरा (Cumin)',
    nameGu: 'જીરું (Cumin)',
    category: 'Cash Crops',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80',
    majorPests: ['Aphids', 'Thrips'],
    majorDiseases: ['Powdery Mildew', 'Wilt (Chhachhiya / Blight)', 'Alternaria Blight'],
    recommendedProductIds: ['toofani', 'tebsal', 'power-55', 'newton', 'acprime'],
    spraySchedule: [
      { stage: 'Vegetative Canopy (20-35 Days)', days: '25 Days', focus: 'Aphid prevention & Blight shield', products: ['ACPRIME', 'MANCO M-45', 'CYTO-6'] },
      { stage: 'Flowering & Umbel (40-60 Days)', days: '45 Days', focus: 'Powdery Mildew & Thrips Attack', products: ['TEBSAL', 'TOOFANI', 'POWER-55'] },
      { stage: 'Grain Formation (65-80 Days)', days: '70 Days', focus: 'Grain Shine & Blight Defense', products: ['NEWTON', 'NUTRI POWER 00:00:50'] }
    ]
  },
  {
    id: 'rice',
    name: 'Rice / Paddy',
    nameHi: 'धान / चावल (Paddy)',
    nameGu: 'ડાંગર / ચોખા (Paddy)',
    category: 'Cereals',
    image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80',
    majorPests: ['Brown Plant Hopper (BPH)', 'Stem Borer', 'Leaf Folder', 'Gall Midge'],
    majorDiseases: ['Leaf & Neck Blast', 'Sheath Blight', 'False Smut'],
    recommendedProductIds: ['tiktok', 'ujjvala', 'trycon', 'faster-plus-plus', 'foliyar', 'zivaa-plus'],
    spraySchedule: [
      { stage: 'Tillering Stage (20-35 Days)', days: '25 Days', focus: 'Stem Borer & Root Zinc', products: ['FASTER ++', 'ZIVAA +'] },
      { stage: 'Panicle Initiation (45-60 Days)', days: '50 Days', focus: 'Sheath Blight & Leaf Folder', products: ['FOLIYAR', 'FIRING'] },
      { stage: 'Flowering & Grain Filling (65-85 Days)', days: '70 Days', focus: 'BPH Hopper & Neck Blast Control', products: ['TIKTOK', 'TRYCON', 'NUTRI POWER 00:52:34'] }
    ]
  },
  {
    id: 'wheat',
    name: 'Wheat',
    nameHi: 'गेहूं (Wheat)',
    nameGu: 'ઘઉં (Wheat)',
    category: 'Cereals',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    majorPests: ['Termites', 'Aphids'],
    majorDiseases: ['Yellow Rust', 'Brown Rust', 'Karnal Bunt', 'Powdery Mildew'],
    recommendedProductIds: ['fungi-star', 'care-phos', 'lura', 'nutri-power-191919'],
    spraySchedule: [
      { stage: 'Crown Root & Tillering (20-30 Days)', days: '20 Days', focus: 'Termite Protection & Broadleaf Weeds', products: ['CARE PHOS', 'LURA', 'NUTRI POWER 19:19:19'] },
      { stage: 'Jointing & Flag Leaf (45-60 Days)', days: '50 Days', focus: 'Yellow Rust & Powdery Mildew', products: ['FUNGI STAR', 'SARTHI'] },
      { stage: 'Milking & Grain Filling (70-85 Days)', days: '75 Days', focus: 'Grain Weight & Luster', products: ['NUTRI POWER 00:00:50', 'ROBOT'] }
    ]
  },
  {
    id: 'chilli',
    name: 'Chilli & Capsicum',
    nameHi: 'मिर्च (Chilli)',
    nameGu: 'મરચાં (Chilli)',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1588252303782-77d4b68e9be3?auto=format&fit=crop&w=800&q=80',
    majorPests: ['Thrips', 'Yellow Mites', 'Fruit Borer', 'Whitefly'],
    majorDiseases: ['Chilli Leaf Curl Virus', 'Dieback / Anthracnose', 'Powdery Mildew'],
    recommendedProductIds: ['polin-star', 'toofani', 'abota', 'azotech', 'nutri-power-cbz'],
    spraySchedule: [
      { stage: 'Vegetative Growth (15-30 Days)', days: '20 Days', focus: 'Mites & Thrips Control', products: ['POLIN STAR', 'ABOTA'] },
      { stage: 'Flowering & Fruiting (35-65 Days)', days: '40 Days', focus: 'Dieback & Leaf Curl Prevention', products: ['TOOFANI', 'AZOTECH', 'NUTRI POWER CBZ'] }
    ]
  }
];

export const DISEASE_PEST_LIBRARY: DiseasePestItem[] = [
  // --- PESTS ---
  {
    id: 'whitefly',
    type: 'pest',
    name: 'Whitefly (Bemisia tabaci)',
    nameHi: 'सफेद मक्खी (Whitefly)',
    nameGu: 'સફેદ માખી (Whitefly)',
    crops: ['Cotton', 'Chilli', 'Tomato', 'Okra', 'Brinjal'],
    symptoms: 'Small white insects sucking sap under leaves, secretion of sticky honeydew causing black sooty mold, leaf curling and yellowing.',
    cause: 'Hot dry weather favoring rapid lifecycle reproduction (5-7 generations/season). Vectors of Leaf Curl Virus.',
    prevention: 'Install yellow sticky traps (15-20 per acre), maintain field sanitation, avoid excessive chemical Nitrogen.',
    recommendedProductIds: ['all-takatak', 'malika', 'acprime', 'ujjvala', 'star-tara']
  },
  {
    id: 'thrips',
    type: 'pest',
    name: 'Thrips (Thrips palmi & Scirtothrips dorsalis)',
    nameHi: 'थ्रिप्स / चुरदा (Thrips)',
    nameGu: 'થ્રિપ્સ / થ્રીપ્સ (Thrips)',
    crops: ['Chilli', 'Cotton', 'Onion', 'Grapes', 'Pomegranate', 'Cumin'],
    symptoms: 'Silvering or bronzing of lower leaf surfaces, upward leaf curling like a boat, brown scarring on fruits.',
    cause: 'Dry dry spells and warm temperatures. Rapid nymphal feeding damaging leaf epidermal cells.',
    prevention: 'Blue sticky traps, overhead sprinkler irrigation, soil moisture management.',
    recommendedProductIds: ['toofani', 'firing', 'polin-star', 'abota', 'ematin-5']
  },
  {
    id: 'pink-bollworm',
    type: 'pest',
    name: 'Pink Bollworm (Pectinophora gossypiella)',
    nameHi: 'गुलाबी सुंडी / पिंक बोलवॉर्म',
    nameGu: 'ગુલાબી ઈયળ (Pink Bollworm)',
    crops: ['Cotton'],
    symptoms: 'Rosetted flowers that fail to open properly, bored holes into bolls with frass, damaged lint and pinkish caterpillars inside bolls.',
    cause: 'Monoculture cotton cropping, carryover in ginning mills, resistance to conventional pyrethroids.',
    prevention: 'Use Pheromone traps (5 traps/acre for monitoring, 20/acre for mass trapping), destroy crop residue post-harvest.',
    recommendedProductIds: ['lorvin', 'ematin-5', 'fostin', 'prof-super-44', 'faster-plus-plus']
  },
  {
    id: 'stem-borer',
    type: 'pest',
    name: 'Stem Borer (Scirpophaga incertulas)',
    nameHi: 'तना छेदक (Stem Borer)',
    nameGu: 'સાંઠા વીંધક ઈયળ (Stem Borer)',
    crops: ['Rice / Paddy', 'Sugarcane', 'Maize'],
    symptoms: '"Dead heart" in young plants (central shoot dries up), "White heads" at panicle stage (empty chaffy white panicles).',
    cause: 'High relative humidity, dense planting, excessive nitrogen application.',
    prevention: 'Clip leaf tips before transplanting, release Trichogramma egg parasitoids, maintain balanced NPK.',
    recommendedProductIds: ['faster-plus-plus', 'starlin', 'chlorin', 'care-phos', 'star-tara']
  },

  // --- DISEASES ---
  {
    id: 'leaf-spot',
    type: 'disease',
    name: 'Leaf Spot / Tikka Disease',
    nameHi: 'पत्ती धब्बा / टिक्का रोग',
    nameGu: 'પાંદડાના ટપકા નો રોગ / ટપકા (Tikka)',
    crops: ['Groundnut', 'Cotton', 'Cumin', 'Tomato'],
    symptoms: 'Circular dark brown to black spots surrounded by a yellow halo on mature leaves, leading to premature defoliation.',
    cause: 'Cercospora fungal spores spread by wind and rain splashes during warm humid weather.',
    prevention: 'Use resistant seed varieties, seed treatment before sowing, crop rotation with non-host crops.',
    recommendedProductIds: ['kombi-shaft', 'hexon-plus', 'vitayu', 'manco-m-45']
  },
  {
    id: 'blight',
    type: 'disease',
    name: 'Blight (Early & Late Blight)',
    nameHi: 'झुलसा रोग (अगेती व पछेती झुलसा)',
    nameGu: 'સુકારો / બ્લાઇટ (Blight)',
    crops: ['Potato', 'Tomato', 'Paddy', 'Cumin'],
    symptoms: 'Concentric dark target-like rings on foliage (Early Blight) or water-soaked dark gray lesions with white mildew growth underneath (Late Blight).',
    cause: 'Phytophthora infestans & Alternaria fungal spores under cool wet cloudy conditions with high humidity.',
    prevention: 'Avoid overhead sprinkler watering, space plants for air circulation, spray protective fungicide before heavy rainfall.',
    recommendedProductIds: ['maxil', 'newton', 'azotech', 'foliyar', 'manco-m-45']
  },
  {
    id: 'wilt',
    type: 'disease',
    name: 'Fusarium Wilt',
    nameHi: 'उकठा / उकटा रोग (Wilt)',
    nameGu: 'સુકારો / ઉકઠો (Wilt)',
    crops: ['Cumin', 'Cotton', 'Pigeonpea / Pulses', 'Banana'],
    symptoms: 'Drooping and yellowing of foliage starting from bottom leaves, internal vascular discoloration (brown vascular ring) when stem is cut.',
    cause: 'Soil-borne Fusarium oxysporum fungus clogging plant xylem water vessels.',
    prevention: 'Soil solarization in summer, apply Trichoderma viride bio-agent, drench soil with systemic fungicide.',
    recommendedProductIds: ['jumar', 'kombi-shaft', 'dr-carbo', 'new-life-plus']
  },
  {
    id: 'powdery-mildew',
    type: 'disease',
    name: 'Powdery Mildew',
    nameHi: 'चूर्णी फफूंद / छाछिया रोग',
    nameGu: 'છારા / પાવડરી મિલ્ડ્યુ (Powdery Mildew)',
    crops: ['Cumin', 'Mango', 'Grapes', 'Cucurbits', 'Peas'],
    symptoms: 'White powdery flour-like fungal growth covering upper leaf surfaces, tender shoots, and young flower clusters.',
    cause: 'Erysiphe fungus favored by dry warm days and cool humid nights.',
    prevention: 'Prune dense canopies for sunlight penetration, spray elemental sulphur proactively at flower bud initiation.',
    recommendedProductIds: ['tebsal', 'power-55', 'cosa-furt', 'guddi', 'hexon-plus']
  }
];
