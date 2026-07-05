import type { FieldGuide } from './types'

// Per-item field guide: harvest season, whether it is farmed and/or foraged,
// whether the edible part is safe raw, notable side effects, and — where it
// grows wild — foraging notes (habitat + identification).
//
// Seasons are Northern-Hemisphere unless the plant's range is southern.
// Entries are authored only where the information is reliable; the raw/side-
// effect fields carry real safety weight (several of these are toxic raw), so
// undocumented items are shown as "not documented" rather than guessed.
//
// SAFETY: foraging notes are a starting point, never a positive ID. Several
// entries flag poisonous lookalikes. Never eat a wild plant you cannot
// identify with certainty.
export const fieldGuide: Record<string, FieldGuide> = {
  // ---- Curated staples ----
  tomato: {
    harvestSeason: 'Summer to early autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Fruit is safe; leaves and stems are mildly toxic.',
  },
  potato: {
    harvestSeason: 'Late summer to autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Never eat green or sprouted tubers — solanine is toxic. Cook before eating.',
  },
  maize: {
    harvestSeason: 'Late summer to autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Sweet corn is fine raw; field/flint maize is cooked or milled.',
  },
  'chili-pepper': {
    harvestSeason: 'Summer to autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Capsaicin causes burning; wash hands and avoid eyes.',
  },
  avocado: {
    harvestSeason: 'Varies by region, often winter to spring',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Flesh is safe; pit and leaves are toxic to many pets.',
  },
  'common-bean': {
    harvestSeason: 'Late summer to autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Dried beans are toxic raw (phytohaemagglutinin) — boil thoroughly before eating.',
  },
  cacao: {
    harvestSeason: 'Two harvests a year in the tropics',
    source: 'farmed',
    raw: 'caution',
    sideEffects: 'Pulp is edible raw; seeds are fermented and roasted. Contains theobromine.',
  },
  pineapple: {
    harvestSeason: 'Year-round in the tropics',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Bromelain can irritate the mouth if eaten in quantity.',
  },
  peanut: {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Common severe allergen; discard mouldy nuts (aflatoxin risk).',
  },
  cassava: {
    harvestSeason: 'Year-round, 8–12 months after planting',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Toxic raw — cyanogenic glycosides. Must be peeled, soaked and cooked.',
  },
  sunflower: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Roadsides, prairies and disturbed ground across North America, where the wild ancestor still grows.',
      identification:
        'Tall coarse-stemmed plant with rough hairy leaves and a single flower head that tracks the sun; mature heads droop and pack with striped seeds.',
    },
  },
  blueberry: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Acid heaths, boreal forest and mountain slopes across North America and northern Eurasia.',
      identification:
        'Low woody shrub with small oval leaves; berries are round, blue with a pale waxy bloom and a five-point crown at the tip, borne in small clusters.',
    },
  },
  cranberry: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Very tart; usually cooked or sweetened.',
    wild: {
      where: 'Acid peat bogs and wet heath in the cool northern hemisphere.',
      identification:
        'Creeping wiry evergreen stems over sphagnum moss; firm red berries sit on thread-like stalks and float when the bog is flooded.',
    },
  },
  pumpkin: {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'caution',
    sideEffects: 'Flesh usually cooked; seeds are fine raw.',
  },
  wheat: {
    harvestSeason: 'Mid to late summer',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Milled and cooked; contains gluten.',
  },
  barley: {
    harvestSeason: 'Summer',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Cooked or malted; contains gluten.',
  },
  lentil: {
    harvestSeason: 'Late summer',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Contains lectins — must be cooked.',
  },
  chickpea: {
    harvestSeason: 'Summer to autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Cook before eating; raw chickpeas are hard to digest and mildly toxic.',
  },
  pea: {
    harvestSeason: 'Spring to early summer',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Fresh green peas are fine raw.',
  },
  fig: {
    harvestSeason: 'Late summer to autumn (often two crops)',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Milky sap from unripe fruit and leaves can irritate skin.',
    wild: {
      where: 'Feral on walls, rocky slopes and riverbanks throughout the Mediterranean and Near East.',
      identification:
        'Deeply lobed hand-shaped leaves on a spreading shrub or tree; soft teardrop fruit ripening green to purple-brown, oozing sweet sap when ripe.',
    },
  },
  olive: {
    harvestSeason: 'Autumn to early winter',
    source: 'both',
    raw: 'no',
    sideEffects: 'Raw olives are inedibly bitter — must be cured before eating.',
    wild: {
      where: 'Wild olive (oleaster) grows in Mediterranean scrub and rocky hillsides.',
      identification:
        'Gnarled evergreen with narrow grey-green leaves silver underneath; wild fruit is small and hard, ripening black.',
    },
  },
  'date-palm': {
    harvestSeason: 'Late summer to autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  pomegranate: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable; root/stem bark preparations are toxic.',
  },
  almond: {
    harvestSeason: 'Late summer',
    source: 'both',
    raw: 'caution',
    sideEffects:
      'Sweet almonds are safe raw; wild and bitter almonds contain cyanide and must never be eaten raw.',
    wild: {
      where: 'Wild almond species grow in the dry hills of Central and Western Asia.',
      identification:
        'Small tree with pink-white blossom; fuzzy grey-green hull splits to reveal a pitted shell — but assume wild-type kernels are the toxic bitter form.',
    },
  },
  carrot: {
    harvestSeason: 'Summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Wild carrot closely resembles deadly poison hemlock — identify with extreme care.',
    wild: {
      where: 'Wild carrot (Queen Anne’s lace) grows on rough grassland and roadsides across Eurasia and naturalised in North America.',
      identification:
        'Lacy flat white flower cluster often with one dark central floret, feathery leaves, and a carrot-scented white taproot; hairy stems (hemlock is smooth and purple-blotched).',
    },
  },
  spinach: {
    harvestSeason: 'Spring and autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'High in oxalates; moderate if prone to kidney stones.',
  },
  apple: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Seeds contain a trace of cyanogenic compound — don’t eat in quantity.',
    wild: {
      where: 'Wild crabapples grow in hedgerows and woodland edges across Eurasia and North America.',
      identification:
        'Small often thorny tree with white-pink blossom; fruit is small, hard and tart, in yellow, red or green.',
    },
  },
  walnut: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable; husks stain skin deeply.',
    wild: {
      where: 'Wild walnut grows in Central Asian mountain forests; related species are foraged in Europe and North America.',
      identification:
        'Large tree with pinnate leaves; round green husk encloses the familiar wrinkled hard shell, which stains hands brown-black.',
    },
  },
  apricot: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Kernels contain amygdalin — do not eat the seeds in quantity.',
  },
  onion: {
    harvestSeason: 'Summer to autumn',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Toxic to dogs and cats.',
  },
  garlic: {
    harvestSeason: 'Early to mid summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Can irritate the stomach raw and thins the blood in excess.',
    wild: {
      where: 'Wild garlic (ramsons) carpets damp deciduous woodland across Europe in spring.',
      identification:
        'Broad soft lance-shaped leaves and star-like white flowers with a strong garlic smell when crushed — the smell is the key check against toxic lookalikes like lily-of-the-valley.',
    },
  },
  rice: {
    harvestSeason: 'Autumn (varies with climate)',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Cooked before eating.',
  },
  soybean: {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Toxic raw (trypsin inhibitors) — must be cooked.',
  },
  peach: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Kernel contains amygdalin — do not eat the seed.',
  },
  tea: {
    harvestSeason: 'Spring to summer flushes',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Leaves are processed and brewed; contains caffeine.',
  },
  orange: {
    harvestSeason: 'Winter',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  cucumber: {
    harvestSeason: 'Summer',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  eggplant: {
    harvestSeason: 'Summer to autumn',
    source: 'farmed',
    raw: 'caution',
    sideEffects: 'Contains solanine; best cooked, eaten raw only in small amounts.',
  },
  'black-pepper': {
    harvestSeason: 'Berries picked as they redden',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Dried and ground as a spice.',
  },
  mango: {
    harvestSeason: 'Summer in the tropics',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Skin and sap contain urushiol and can trigger a poison-ivy-like rash.',
  },
  banana: {
    harvestSeason: 'Year-round',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  sugarcane: {
    harvestSeason: 'Dry season, 12–18 months after planting',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Stalk is chewed for juice; the fibre is spat out.',
  },
  taro: {
    harvestSeason: 'Year-round when mature',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Toxic raw — calcium oxalate crystals. Must be thoroughly cooked.',
  },
  coconut: {
    harvestSeason: 'Year-round',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  ginger: {
    harvestSeason: 'Autumn, 8–10 months after planting',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Can thin the blood and upset the stomach in large amounts.',
  },
  turmeric: {
    harvestSeason: 'When the leaves die back, 8–10 months after planting',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Stains strongly; blood-thinning in large amounts.',
  },
  coffee: {
    harvestSeason: 'Cherries ripen through the dry season',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Beans are roasted; contains caffeine.',
  },
  okra: {
    harvestSeason: 'Summer',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'Young pods only; mucilaginous.',
  },
  sorghum: {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Cooked or milled.',
  },
  watermelon: {
    harvestSeason: 'Summer',
    source: 'farmed',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  yam: {
    harvestSeason: 'Autumn, 8–11 months after planting',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Many wild yams are toxic raw — must be cooked.',
  },
  cowpea: {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Dried seeds must be cooked.',
  },
  grape: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Wild grape can be confused with toxic moonseed — check for tendrils and grape seeds.',
    wild: {
      where: 'Wild grapevines climb woodland edges, riverbanks and fences across the temperate world.',
      identification:
        'Woody climber with forked tendrils and lobed leaves; small grapes in loose bunches, each with pips (toxic moonseed has a single crescent seed and no tendrils).',
    },
  },
  cabbage: {
    harvestSeason: 'Autumn to winter (varies)',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Goitrogenic in very large raw amounts.',
    wild: {
      where: 'Wild cabbage grows on coastal chalk cliffs of western Europe.',
      identification:
        'Sprawling grey-green plant with thick lobed leaves and a woody base, topped by tall spikes of yellow four-petalled flowers.',
    },
  },
  leek: {
    harvestSeason: 'Autumn to winter',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
  },

  // ---- Foraged fruits & berries ----
  pear: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  quince: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'no',
    sideEffects: 'Too hard and astringent to eat raw — cook before eating.',
  },
  medlar: {
    harvestSeason: 'Late autumn, eaten after bletting',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Only edible once softened (bletted) brown; hard fruit is astringent.',
    wild: {
      where: 'Naturalised in hedgerows and old woodland in southern and central Europe.',
      identification:
        'Small crooked tree with big white flowers; russet-brown apple-like fruit with a wide open “eye” of dried sepals at the base.',
    },
  },
  'sweet-cherry': {
    harvestSeason: 'Early summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Do not eat the kernels (amygdalin).',
    wild: {
      where: 'Wild cherry (gean) grows in woods and hedgerows across Europe and western Asia.',
      identification:
        'Tall tree with shiny peeling reddish bark banded with lenticels; white blossom clusters, then small red-black cherries on long stalks.',
    },
  },
  'blackthorn-sloe': {
    harvestSeason: 'Autumn, after the first frosts',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Mouth-puckeringly astringent raw — used in preserves and sloe gin, not eaten fresh.',
    wild: {
      where: 'Dense blackthorn hedges and scrub across Europe and western Asia.',
      identification:
        'Very thorny dark-barked shrub; white blossom on bare twigs in early spring, then small round blue-black sloes with a waxy bloom.',
    },
  },
  strawberry: {
    harvestSeason: 'Early to mid summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Wild/woodland strawberry grows on banks, woodland edges and clearings across the northern hemisphere.',
      identification:
        'Low plant with toothed leaves in threes and runners; tiny, intensely aromatic red berries with seeds on the surface.',
    },
  },
  raspberry: {
    harvestSeason: 'Summer (autumn for some types)',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Wild raspberry grows in woodland clearings, upland scrub and old burns across the cool northern hemisphere.',
      identification:
        'Upright bristly canes with white-backed leaves; the red berry pulls cleanly off its core, leaving a hollow thimble.',
    },
  },
  blackberry: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Bramble thickets in hedgerows, waste ground and woodland edges across the temperate world.',
      identification:
        'Arching thorny canes with palmate leaves; glossy black aggregate berries that stay attached to their core when picked, ripening August to October.',
    },
  },
  gooseberry: {
    harvestSeason: 'Early to mid summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Often tart; cooked when underripe.',
    wild: {
      where: 'Wild gooseberry grows in damp woods and hedgerows across Europe.',
      identification:
        'Low spiny shrub with small lobed leaves; translucent green-to-red berries marked with pale veins and fine hairs.',
    },
  },
  elderberry: {
    harvestSeason: 'Flowers early summer, berries late summer to autumn',
    source: 'both',
    raw: 'no',
    sideEffects: 'Raw berries, leaves, bark and stems are toxic — berries must be cooked, and flowers used raw only.',
    wild: {
      where: 'Elder grows fast on waste ground, hedgerows and woodland edges across Europe and North America.',
      identification:
        'Shrub/small tree with pinnate leaves; flat creamy flower umbels in early summer, then drooping bunches of tiny purple-black berries on red-tinged stalks.',
    },
  },
  'rowan-berry': {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Bitter and mildly upsetting raw (parasorbic acid) — cooked into jelly, which neutralises it.',
    wild: {
      where: 'Rowan (mountain ash) grows in uplands, open woods and moors across Europe and northern Asia.',
      identification:
        'Slim tree with feathery pinnate leaves; dense flat clusters of round orange-red berries in autumn.',
    },
  },
  'sea-buckthorn': {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Intensely sour and acidic — usually juiced.',
    wild: {
      where: 'Coastal dunes, cliffs and riverbanks across Europe and Asia.',
      identification:
        'Thorny shrub with narrow silvery leaves; dense clusters of bright orange berries pressed tight against the branches.',
    },
  },
  lingonberry: {
    harvestSeason: 'Late summer to autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Very tart raw; usually cooked.',
    wild: {
      where: 'Boreal forest floor and tundra across Scandinavia, northern Asia and North America.',
      identification:
        'Low creeping evergreen shrub with small glossy leaves; clusters of small firm dark-red berries.',
    },
  },
  bilberry: {
    harvestSeason: 'Mid to late summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Stains mouth and hands deep purple.',
    wild: {
      where: 'Acid heaths, moorland and upland woods across Europe.',
      identification:
        'Low green-stemmed shrub with small oval leaves; small dark blue-black berries borne singly (not in clusters), with dark flesh.',
    },
  },
  cloudberry: {
    harvestSeason: 'Mid to late summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Arctic and subarctic bogs and tundra of Scandinavia, Russia and Canada.',
      identification:
        'Low herb with wrinkled lobed leaves and a single white flower; one amber-orange raspberry-like berry per stem.',
    },
  },
  'saskatoon-berry': {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Prairies, thickets and open woodland across western North America.',
      identification:
        'Shrub with rounded toothed leaves; purple pome berries resembling blueberries, with a five-point crown at the tip.',
    },
  },
  mulberry: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Unripe fruit and sap can upset the stomach; ripe fruit is fine.',
    wild: {
      where: 'Mulberry trees grow wild and feral in warm-temperate Asia, the Middle East and naturalised elsewhere.',
      identification:
        'Broad-leaved tree; elongated blackberry-like fruit ripening white, red or deep purple-black and staining hands.',
    },
  },
  'cornelian-cherry': {
    harvestSeason: 'Late summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Sour until fully soft-ripe.',
    wild: {
      where: 'Woodland edges and scrub of southern and eastern Europe and western Asia.',
      identification:
        'Shrub/small tree flowering yellow on bare twigs very early in spring; oblong glossy red fruit like a small olive-shaped cherry.',
    },
  },
  hawthorn: {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'caution',
    sideEffects: 'Flesh is edible; the seeds contain cyanogenic compounds and must not be eaten.',
    wild: {
      where: 'Hedgerows, scrub and woodland edges across Europe, North Africa and North America.',
      identification:
        'Thorny shrub with lobed leaves and white (sometimes pink) blossom; clusters of red haws, each with a large stony seed inside thin flesh.',
    },
  },
  'rose-hip': {
    harvestSeason: 'Autumn, sweeter after frost',
    source: 'wild',
    raw: 'caution',
    sideEffects: 'The irritant seed hairs inside must be removed; use the flesh only.',
    wild: {
      where: 'Wild roses in hedgerows, dunes and scrub across the northern hemisphere.',
      identification:
        'Prickly shrub; oval-to-round red-orange hips left behind after the petals drop, filled with hairy seeds.',
    },
  },
  barberry: {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Very tart; roots and bark are not eaten.',
    wild: {
      where: 'Scrub and hedgerows across Europe and western Asia.',
      identification:
        'Spiny shrub with small oval leaves and three-pronged thorns; drooping clusters of oblong bright-red berries.',
    },
  },
  crabapple: {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'caution',
    sideEffects: 'Very sour; edible in small amounts, and don’t eat the seeds.',
    wild: {
      where: 'Hedgerows and woodland across Europe and North America.',
      identification:
        'Small, often thorny tree with pink-white blossom; hard tart fruit under 4 cm across in yellow, red or green.',
    },
  },
  pawpaw: {
    harvestSeason: 'Early autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Eat ripe flesh only; skin and seeds can cause nausea.',
    wild: {
      where: 'Shady bottomland woods and riverbanks of the eastern United States.',
      identification:
        'Understorey tree with large drooping tropical-looking leaves; green mango-shaped fruit with custard-soft flesh and big brown seeds.',
    },
  },
  'american-persimmon': {
    harvestSeason: 'Autumn, after frost',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Unripe fruit is intensely astringent — eat only when fully soft.',
    wild: {
      where: 'Woodland edges and old fields of the central and eastern United States.',
      identification:
        'Tree with blocky dark bark; small round orange fruit that only sweetens when it turns soft and wrinkled.',
    },
  },
  muscadine: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Thick skin usually spat out.',
    wild: {
      where: 'Warm woodlands of the southeastern United States.',
      identification:
        'Vigorous vine with round toothed leaves; thick-skinned bronze or dark-purple grapes borne in small loose clusters, not tight bunches.',
    },
  },
  'beach-plum': {
    harvestSeason: 'Late summer to early autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Tart; often preserved.',
    wild: {
      where: 'Atlantic coastal dunes and sandy scrub of the northeastern United States.',
      identification:
        'Low sprawling shrub with white blossom; small round purple (sometimes red) plums with a waxy bloom.',
    },
  },
  salmonberry: {
    harvestSeason: 'Early summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Damp coastal forest and streamsides of the Pacific Northwest.',
      identification:
        'Thicket-forming cane with three-part leaves and pink flowers; soft raspberry-like berry ripening yellow, orange to red.',
    },
  },
  thimbleberry: {
    harvestSeason: 'Summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'None notable; berries are soft and crumble easily.',
    wild: {
      where: 'Open forest and roadsides of western and northern North America.',
      identification:
        'Thornless shrub with large soft maple-shaped leaves and white flowers; shallow, dome-shaped bright-red berry.',
    },
  },
  huckleberry: {
    harvestSeason: 'Summer to autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Mountain forests and clearings of western and eastern North America.',
      identification:
        'Low-to-medium shrub with small oval leaves; round dark blue-purple or red berries borne singly, like small blueberries with larger seeds.',
    },
  },
  chokecherry: {
    harvestSeason: 'Late summer',
    source: 'wild',
    raw: 'caution',
    sideEffects: 'Flesh is edible cooked; leaves, stems and crushed pits are cyanogenic — never eat the seeds.',
    wild: {
      where: 'Thickets, fencerows and woodland edges across North America.',
      identification:
        'Shrub or small tree with finely toothed oval leaves; long drooping clusters of small dark red-to-black astringent cherries.',
    },
  },
  'prickly-pear': {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Covered in tiny barbed glochids — singe or peel carefully before eating.',
    wild: {
      where: 'Deserts, dry grassland and Mediterranean scrub across the Americas and naturalised around the world.',
      identification:
        'Flat oval cactus pads; egg-shaped fruit (tuna) on the pad rims, ripening red-purple, studded with fine irritating spines.',
    },
  },
  'juniper-berry': {
    harvestSeason: 'Autumn (berries take 2–3 years to ripen)',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Used sparingly as a spice, not eaten in quantity; some juniper species are toxic — identify carefully.',
    wild: {
      where: 'Heaths, chalk downs, mountains and northern forests across the northern hemisphere.',
      identification:
        'Prickly evergreen shrub with needle-like leaves in threes; hard green berry-like cones ripening blue-black with a waxy bloom.',
    },
  },
  jujube: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
  },
  persimmon: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Astringent types must be fully ripe and soft before eating.',
  },
  'sour-cherry': {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Tart, usually cooked; don’t eat the kernels.',
  },
  plum: {
    harvestSeason: 'Late summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Don’t eat the kernels.',
    wild: {
      where: 'Wild and feral plums grow in hedgerows and scrub across Europe and Asia.',
      identification:
        'Small tree with white blossom; oval fruit with a groove down one side and a flattened stone, in yellow, red or purple.',
    },
  },
  damson: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Tart and astringent raw — best cooked.',
    wild: {
      where: 'Old hedgerows and abandoned orchards across Britain and Europe.',
      identification:
        'Thorny-ish small tree; small oval blue-black plums with a heavy waxy bloom and tart green flesh.',
    },
  },

  // ---- Foraged nuts & seeds ----
  hazelnut: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Tree-nut allergen.',
    wild: {
      where: 'Hazel grows in hedgerows, woods and coppice across Europe and western Asia.',
      identification:
        'Multi-stemmed shrub with round double-toothed leaves and yellow catkins in late winter; nuts sit in a ragged leafy green husk, ripening brown.',
    },
  },
  chestnut: {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'caution',
    sideEffects:
      'Sweet chestnut is best roasted (raw is tannic). Do not confuse with toxic horse chestnut (conker).',
    wild: {
      where: 'Sweet chestnut grows in woods and old plantations across southern Europe and Asia Minor.',
      identification:
        'Large tree with long saw-toothed leaves; spiny green burr splits to release two or three glossy brown nuts — unlike the single round conker of the toxic horse chestnut.',
    },
  },
  'pine-nut': {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Some species can cause a temporary metallic taste (“pine mouth”).',
    wild: {
      where: 'Stone pines and other nut pines on Mediterranean, North American and Asian hillsides.',
      identification:
        'Pines with heavy woody cones; the seeds sit under the cone scales and are shelled out after the cones open in the heat.',
    },
  },
  acorn: {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Bitter tannins are mildly toxic — acorns must be leached in water before eating.',
    wild: {
      where: 'Oak trees in woods, parkland and hedgerows worldwide.',
      identification:
        'Smooth oval nut seated in a scaly cup; white-oak types are less bitter, but all need leaching to remove tannins.',
    },
  },
  'beech-nut': {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'caution',
    sideEffects: 'Fine in small amounts; contains fagin and is better roasted — don’t overeat raw.',
    wild: {
      where: 'Beech woods across Europe and North America (mast years are irregular).',
      identification:
        'Small three-sided nuts in pairs inside a soft-spined husk that splits into four, dropped under smooth grey-barked beech trees.',
    },
  },
  'black-walnut': {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Husk juice stains skin black and is a strong irritant.',
    wild: {
      where: 'Rich woods and field edges of the eastern and central United States.',
      identification:
        'Tall tree with long pinnate leaves; round green husk (staining black) around a very hard deeply-grooved shell.',
    },
  },
  'hickory-nut': {
    harvestSeason: 'Autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Shagbark and shellbark are sweet; some hickories are bitter.',
    wild: {
      where: 'Eastern North American hardwood forests.',
      identification:
        'Tall tree (shagbark peels in long strips); nut in a four-part husk that splits away, with a ridged pale shell.',
    },
  },
  'water-chestnut': {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Peel and preferably cook — wild raw corms can carry liver fluke in endemic regions.',
  },
  'ginkgo-nut': {
    harvestSeason: 'Autumn',
    source: 'both',
    raw: 'no',
    sideEffects: 'Must be cooked and eaten only in small amounts; excess is toxic. The fleshy coat is a skin irritant.',
    wild: {
      where: 'Planted worldwide; the fallen seeds are gathered under female ginkgo trees in autumn.',
      identification:
        'Fan-shaped notched leaves; foul-smelling orange fleshy seed coat around a smooth pale nut — handle with gloves.',
    },
  },

  // ---- Foraged greens & vegetables ----
  'dandelion-greens': {
    harvestSeason: 'Spring (young leaves), roots in autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Bitter; a mild diuretic.',
    wild: {
      where: 'Lawns, meadows, verges and waste ground almost everywhere.',
      identification:
        'Ground-hugging rosette of jagged “lion-tooth” leaves; a single yellow flower on a hollow leafless stalk with milky sap.',
    },
  },
  nettle: {
    harvestSeason: 'Spring (young tops)',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Stinging hairs must be destroyed by cooking or blanching before eating.',
    wild: {
      where: 'Damp, rich, disturbed ground across the temperate world.',
      identification:
        'Upright square stems with opposite heart-shaped, coarsely toothed leaves covered in stinging hairs; pick young tops with gloves.',
    },
  },
  purslane: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Contains oxalates; moderate if prone to kidney stones.',
    wild: {
      where: 'Warm disturbed ground, gardens and pavement cracks worldwide.',
      identification:
        'Low sprawling mat of smooth reddish stems with fat, glossy paddle-shaped succulent leaves.',
    },
  },
  sorrel: {
    harvestSeason: 'Spring to summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Sharp and lemony from oxalic acid; eat in moderation.',
    wild: {
      where: 'Meadows, grassland and woodland edges across Eurasia and North America.',
      identification:
        'Arrow- or shield-shaped leaves with backward-pointing lobes and a distinct sour-lemon taste; reddish flower spikes.',
    },
  },
  watercress: {
    harvestSeason: 'Spring and autumn',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Wild plants in water grazed by livestock can carry liver fluke — cook if the source is unknown.',
    wild: {
      where: 'Clean, cool, slow-flowing streams and springs across Eurasia and North America.',
      identification:
        'Floating or creeping mats of hollow stems with rounded pinnate leaves and a peppery taste; small white flowers.',
    },
  },
  'lambs-quarters': {
    harvestSeason: 'Summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Contains oxalates; young leaves best, and moderate raw.',
    wild: {
      where: 'Disturbed soil, gardens and field edges across the temperate world.',
      identification:
        'Upright plant with diamond-shaped, toothed leaves dusted with a mealy white coating, especially on new growth (“wild spinach”/fat hen).',
    },
  },
  fiddlehead: {
    harvestSeason: 'Spring',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Must be cooked thoroughly — raw ostrich-fern fiddleheads cause food poisoning.',
    wild: {
      where: 'Riverbanks and damp woods of northern North America, Europe and Asia.',
      identification:
        'Tightly coiled young ostrich-fern fronds, bright green with a papery brown scale and a distinctive U-shaped groove down the smooth stem.',
    },
  },
  samphire: {
    harvestSeason: 'Summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Naturally very salty.',
    wild: {
      where: 'Tidal mudflats and salt marshes around Europe and North America.',
      identification:
        'Bright-green, leafless, jointed and branching succulent stems (marsh samphire/glasswort) growing in dense stands on the mud.',
    },
  },
  'ramp-wild-leek': {
    harvestSeason: 'Spring',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Strongly flavoured; slow to regrow, so harvest sparingly.',
    wild: {
      where: 'Rich deciduous woodland of eastern North America.',
      identification:
        'A pair of smooth, broad, flat leaves rising from a red-tinged stalk and a white bulb, with an unmistakable onion-garlic smell.',
    },
  },
  horseradish: {
    harvestSeason: 'Autumn (roots)',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Intensely pungent; strong fumes irritate eyes and airways.',
    wild: {
      where: 'Naturalised on roadsides, waste ground and field edges across Europe and North America.',
      identification:
        'Big, coarse, dock-like wavy leaves in a clump; a thick pale taproot that smells sharply hot when cut.',
    },
  },
  'jerusalem-artichoke': {
    harvestSeason: 'Autumn to winter (tubers)',
    source: 'both',
    raw: 'yes',
    sideEffects: 'High in inulin — notorious for causing gas.',
    wild: {
      where: 'Naturalised on damp roadsides, riverbanks and field edges in North America and Europe.',
      identification:
        'Tall sunflower relative with rough leaves and small yellow flowers; knobbly pale-brown tubers cluster under the plant.',
    },
  },
  rhubarb: {
    harvestSeason: 'Spring to early summer (stalks)',
    source: 'farmed',
    raw: 'caution',
    sideEffects: 'Eat the stalks only — the leaves are toxic (oxalic acid). Stalks are very tart.',
  },
  'bamboo-shoot': {
    harvestSeason: 'Spring',
    source: 'both',
    raw: 'no',
    sideEffects: 'Toxic raw (cyanogenic) — must be sliced and boiled before eating.',
  },
  'heart-of-palm': {
    harvestSeason: 'Year-round',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable; harvesting kills single-stemmed palms.',
  },
  nopal: {
    harvestSeason: 'Spring to summer (young pads)',
    source: 'both',
    raw: 'yes',
    sideEffects: 'De-spine carefully; mucilaginous.',
    wild: {
      where: 'Deserts and dry scrub across Mexico and the southwestern United States.',
      identification:
        'Flat oval prickly-pear cactus pads; harvest the tender bright-green young pads and scrape off spines and glochids.',
    },
  },

  // ---- Foraged herbs & spices ----
  thyme: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Wild thyme carpets dry, sunny, rocky ground and short turf across Europe.',
      identification:
        'Low creeping mats of wiry stems with tiny aromatic leaves and pink-purple flowers; strongly thyme-scented when crushed.',
    },
  },
  oregano: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Wild marjoram grows on dry grassland, banks and scrub across Europe and western Asia.',
      identification:
        'Bushy plant with oval aromatic leaves and dense heads of pink-purple flowers; peppery-oregano scent when crushed.',
    },
  },
  rosemary: {
    harvestSeason: 'Year-round',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Wild on dry Mediterranean coastal scrub and hillsides.',
      identification:
        'Woody evergreen shrub with narrow needle-like leaves, dark green above and pale below, resinous and pine-like, with pale blue flowers.',
    },
  },
  sage: {
    harvestSeason: 'Late spring to summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Contains thujone; avoid large medicinal doses in pregnancy.',
    wild: {
      where: 'Wild on dry rocky Mediterranean hillsides.',
      identification:
        'Low shrub with soft grey-green, finely wrinkled, felted aromatic leaves and spikes of purple flowers.',
    },
  },
  peppermint: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Wild mints grow along damp ditches, streamsides and marshy ground across the temperate world.',
      identification:
        'Square stems with opposite toothed leaves and a strong mint smell; spreads by runners into patches.',
    },
  },
  'lemon-balm': {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'yes',
    sideEffects: 'None notable.',
    wild: {
      where: 'Naturalised on banks, hedgerows and waste ground across Europe.',
      identification:
        'Square-stemmed clump with crinkled, toothed heart-shaped leaves that smell strongly of lemon when crushed.',
    },
  },
  sumac: {
    harvestSeason: 'Late summer to autumn',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Use edible red-berried sumac only — never white-berried poison sumac.',
    wild: {
      where: 'Staghorn and smooth sumac grow on roadsides, old fields and woodland edges of eastern North America; related sumacs in the Mediterranean.',
      identification:
        'Shrub/small tree with pinnate leaves and upright, cone-shaped clusters of fuzzy deep-red berries (poison sumac instead has loose, drooping white berries).',
    },
  },

  // ---- Foraged grains ----
  'wild-rice': {
    harvestSeason: 'Late summer to autumn',
    source: 'wild',
    raw: 'no',
    sideEffects: 'Parched and cooked before eating.',
    wild: {
      where: 'Shallow lakes, slow rivers and marsh margins of the northern United States and Canada.',
      identification:
        'Tall aquatic grass standing above the water; long slender dark grains on open seed heads, traditionally knocked into a canoe.',
    },
  },
  oat: {
    harvestSeason: 'Summer',
    source: 'both',
    raw: 'no',
    sideEffects: 'Rolled and cooked; wild oat grows as a common grass weed.',
  },
  mesquite: {
    harvestSeason: 'Summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Pods ground to sweet flour; not eaten whole.',
  },
  'mesquite-pod': {
    harvestSeason: 'Summer',
    source: 'wild',
    raw: 'yes',
    sideEffects: 'Ground to a sweet flour rather than eaten whole.',
    wild: {
      where: 'Deserts and dry grassland of the southwestern United States and Mexico.',
      identification:
        'Thorny tree with feathery leaves; long straw-coloured seed pods that snap sweet and mealy when dry.',
    },
  },

  // ---- Legumes that must be cooked (common safety cautions) ----
  'lima-bean': {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Cyanogenic raw — must be boiled thoroughly.',
  },
  'fava-bean': {
    harvestSeason: 'Late spring to summer',
    source: 'both',
    raw: 'caution',
    sideEffects: 'Young beans can be eaten raw, but they trigger favism in people with G6PD deficiency.',
  },
  'grass-pea': {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Eaten in excess over time causes lathyrism (a neurological disorder) — only an occasional food.',
  },
  'lupin-bean': {
    harvestSeason: 'Autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Bitter alkaloids are toxic — must be soaked and rinsed for days before eating.',
  },
  'runner-bean': {
    harvestSeason: 'Summer to autumn',
    source: 'farmed',
    raw: 'no',
    sideEffects: 'Contains lectins — cook before eating.',
  },
  carob: {
    harvestSeason: 'Late summer to autumn',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Ripe pods are sweet and edible; usually dried and ground.',
  },
  tamarind: {
    harvestSeason: 'Late winter to spring',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Sour sticky pulp; mildly laxative in quantity.',
  },
  moringa: {
    harvestSeason: 'Year-round in the tropics',
    source: 'both',
    raw: 'yes',
    sideEffects: 'Leaves and young pods edible; root and root bark are toxic.',
  },
}

// Recipes (brief, English) and well-known varieties, kept separate from the
// safety-sensitive field-guide data. Authored where reliable; merged into the
// guide by getFieldGuide below.
const itemDetails: Record<string, { recipes?: string[]; varieties?: string[] }> = {
  tomato: {
    recipes: ['Fresh caprese with basil and mozzarella', 'Slow-roasted tomato pasta sauce', 'Gazpacho (chilled tomato soup)'],
    varieties: ['Beefsteak', 'San Marzano', 'Cherry', 'Roma', 'Heirloom Brandywine'],
  },
  potato: {
    recipes: ['Roast potatoes crisped in hot fat', 'Mashed potato with butter', 'Potato and leek soup'],
    varieties: ['Russet', 'Yukon Gold', 'Maris Piper', 'Charlotte', 'King Edward'],
  },
  maize: {
    recipes: ['Corn on the cob with butter', 'Cornbread', 'Fresh corn salsa'],
    varieties: ['Sweet corn', 'Dent (field) corn', 'Flint corn', 'Popcorn'],
  },
  'chili-pepper': {
    recipes: ['Fresh hot salsa', 'Chilli-garlic oil', 'Fermented hot sauce'],
    varieties: ['Cayenne', 'Serrano', 'Thai bird’s eye', 'Habanero'],
  },
  avocado: {
    recipes: ['Guacamole', 'Smashed avocado on toast', 'Avocado and citrus salad'],
    varieties: ['Hass', 'Fuerte', 'Reed', 'Bacon'],
  },
  'common-bean': {
    recipes: ['Chilli con carne', 'Refried beans', 'Three-bean salad'],
    varieties: ['Kidney', 'Pinto', 'Black turtle', 'Cannellini', 'Navy'],
  },
  cacao: {
    recipes: ['Dark chocolate', 'Hot cocoa', 'Mole sauce'],
    varieties: ['Criollo', 'Forastero', 'Trinitario'],
  },
  pineapple: {
    recipes: ['Grilled pineapple', 'Pineapple fried rice', 'Fresh pineapple salsa'],
    varieties: ['Smooth Cayenne', 'Queen', 'MD-2 (Gold)'],
  },
  peanut: {
    recipes: ['Peanut butter', 'Satay sauce', 'Boiled peanuts'],
    varieties: ['Runner', 'Virginia', 'Spanish', 'Valencia'],
  },
  cassava: {
    recipes: ['Boiled and mashed (fufu)', 'Cassava fries', 'Tapioca pudding (from the starch)'],
    varieties: ['Sweet cassava', 'Bitter cassava (higher cyanide, needs more processing)'],
  },
  sunflower: {
    recipes: ['Toasted sunflower seeds', 'Sunflower seed butter', 'Cold-pressed sunflower oil'],
    varieties: ['Oilseed (black)', 'Confection (striped)'],
  },
  blueberry: {
    recipes: ['Blueberry muffins', 'Blueberry pancakes', 'Blueberry compote'],
    varieties: ['Highbush', 'Lowbush (wild)', 'Rabbiteye'],
  },
  cranberry: {
    recipes: ['Cranberry sauce', 'Cranberry juice', 'Dried cranberries in baking'],
    varieties: ['Stevens', 'Ben Lear', 'Howes'],
  },
  pumpkin: {
    recipes: ['Pumpkin soup', 'Pumpkin pie', 'Roasted pumpkin wedges'],
    varieties: ['Sugar pie', 'Field pumpkin', 'Kabocha', 'Jack-o’-lantern'],
  },
  wheat: {
    recipes: ['Bread', 'Pasta', 'Bulgur pilaf'],
    varieties: ['Bread (common) wheat', 'Durum', 'Spelt', 'Einkorn'],
  },
  barley: {
    recipes: ['Barley and vegetable soup', 'Risotto-style pearl barley', 'Malted for brewing'],
    varieties: ['Two-row', 'Six-row', 'Hulless'],
  },
  lentil: {
    recipes: ['Dal (spiced lentil stew)', 'Lentil soup', 'Warm lentil salad'],
    varieties: ['Green (Puy)', 'Brown', 'Red split', 'Beluga black'],
  },
  chickpea: {
    recipes: ['Hummus', 'Falafel', 'Chana masala'],
    varieties: ['Kabuli (large pale)', 'Desi (small dark)'],
  },
  pea: {
    recipes: ['Buttered garden peas', 'Pea and mint soup', 'Fresh peas in risotto'],
    varieties: ['Garden (shelling)', 'Snow', 'Sugar snap'],
  },
  fig: {
    recipes: ['Fresh figs with honey and cheese', 'Fig jam', 'Roasted figs'],
    varieties: ['Black Mission', 'Brown Turkey', 'Kadota', 'Adriatic'],
  },
  olive: {
    recipes: ['Cured table olives', 'Extra-virgin olive oil', 'Tapenade'],
    varieties: ['Kalamata', 'Manzanilla', 'Picholine', 'Arbequina'],
  },
  'date-palm': {
    recipes: ['Stuffed dates', 'Date and nut energy balls', 'Date syrup'],
    varieties: ['Medjool', 'Deglet Noor', 'Barhi'],
  },
  pomegranate: {
    recipes: ['Fresh arils on salads', 'Pomegranate molasses', 'Pomegranate juice'],
    varieties: ['Wonderful', 'Angel Red', 'Parfianka'],
  },
  almond: {
    recipes: ['Toasted almonds', 'Marzipan', 'Almond milk'],
    varieties: ['Nonpareil', 'Marcona', 'Valencia'],
  },
  carrot: {
    recipes: ['Roasted honey carrots', 'Carrot cake', 'Carrot and coriander soup'],
    varieties: ['Nantes', 'Imperator', 'Chantenay', 'Purple/heirloom'],
  },
  spinach: {
    recipes: ['Sautéed garlic spinach', 'Spinach and feta filo (spanakopita)', 'Fresh spinach salad'],
    varieties: ['Savoy', 'Flat-leaf', 'Baby spinach'],
  },
  apple: {
    recipes: ['Apple pie', 'Applesauce', 'Baked apples'],
    varieties: ['Gala', 'Granny Smith', 'Fuji', 'Bramley (cooking)', 'Golden Delicious'],
  },
  walnut: {
    recipes: ['Walnut and coffee cake', 'Candied walnuts', 'Pesto with walnuts'],
    varieties: ['English (Persian)', 'Black walnut'],
  },
  apricot: {
    recipes: ['Apricot jam', 'Poached apricots', 'Dried apricots'],
    varieties: ['Blenheim', 'Moorpark', 'Tilton'],
  },
  onion: {
    recipes: ['Caramelised onions', 'French onion soup', 'Onion bhaji'],
    varieties: ['Yellow', 'Red', 'White', 'Sweet (Vidalia)'],
  },
  garlic: {
    recipes: ['Roasted whole garlic', 'Garlic butter', 'Aioli'],
    varieties: ['Softneck', 'Hardneck', 'Elephant garlic (a leek relative)'],
  },
  rice: {
    recipes: ['Steamed rice', 'Risotto', 'Fried rice'],
    varieties: ['Basmati', 'Jasmine', 'Arborio', 'Long-grain', 'Short-grain'],
  },
  soybean: {
    recipes: ['Tofu', 'Edamame (boiled young pods)', 'Miso and soy sauce (fermented)'],
    varieties: ['Yellow', 'Black', 'Edamame types'],
  },
  peach: {
    recipes: ['Grilled peaches', 'Peach cobbler', 'Peach preserves'],
    varieties: ['Freestone', 'Clingstone', 'White peach', 'Donut/flat'],
  },
  tea: {
    recipes: ['Brewed black tea', 'Green tea', 'Chai (spiced milk tea)'],
    varieties: ['Assam', 'Darjeeling', 'Sencha', 'Oolong'],
  },
  orange: {
    recipes: ['Fresh orange juice', 'Marmalade', 'Orange and fennel salad'],
    varieties: ['Navel', 'Valencia', 'Blood orange', 'Cara Cara'],
  },
  cucumber: {
    recipes: ['Cucumber salad', 'Tzatziki', 'Quick pickles'],
    varieties: ['Slicing', 'Pickling (Kirby)', 'English (seedless)', 'Persian'],
  },
  eggplant: {
    recipes: ['Baba ganoush', 'Ratatouille', 'Melanzane parmigiana'],
    varieties: ['Globe', 'Italian', 'Japanese (long)', 'Thai (round)'],
  },
  'black-pepper': {
    recipes: ['Cracked pepper on almost anything', 'Cacio e pepe', 'Pepper-crusted steak'],
    varieties: ['Black', 'White', 'Green', 'Tellicherry'],
  },
  mango: {
    recipes: ['Fresh mango slices', 'Mango lassi', 'Green mango chutney'],
    varieties: ['Alphonso', 'Ataulfo (honey)', 'Tommy Atkins', 'Kent'],
  },
  banana: {
    recipes: ['Banana bread', 'Banana smoothie', 'Fried plantain (cooking type)'],
    varieties: ['Cavendish', 'Lady Finger', 'Red banana', 'Plantain'],
  },
  sugarcane: {
    recipes: ['Fresh cane juice', 'Raw cane sugar (jaggery/panela)', 'Cane syrup'],
    varieties: ['Chewing cane', 'Crystal (sugar) cane'],
  },
  taro: {
    recipes: ['Poi (Hawaiian mashed taro)', 'Taro chips', 'Taro in coconut curry'],
    varieties: ['Dasheen', 'Eddoe'],
  },
  coconut: {
    recipes: ['Coconut milk curries', 'Toasted coconut flakes', 'Fresh coconut water'],
    varieties: ['Tall', 'Dwarf', 'King coconut'],
  },
  ginger: {
    recipes: ['Ginger tea', 'Stir-fried ginger and garlic', 'Candied ginger'],
    varieties: ['Common (yellow)', 'Young/stem ginger'],
  },
  turmeric: {
    recipes: ['Golden (turmeric) milk', 'Curry base', 'Turmeric rice'],
    varieties: ['Madras', 'Alleppey'],
  },
  coffee: {
    recipes: ['Espresso', 'Filter/pour-over coffee', 'Cold brew'],
    varieties: ['Arabica', 'Robusta'],
  },
  okra: {
    recipes: ['Gumbo', 'Bhindi masala', 'Roasted okra'],
    varieties: ['Clemson Spineless', 'Red Burgundy'],
  },
  sorghum: {
    recipes: ['Sorghum porridge', 'Flatbread (jowar roti)', 'Popped sorghum'],
    varieties: ['Grain sorghum', 'Sweet sorghum (for syrup)'],
  },
  watermelon: {
    recipes: ['Chilled watermelon slices', 'Watermelon and feta salad', 'Watermelon agua fresca'],
    varieties: ['Crimson Sweet', 'Sugar Baby', 'Seedless', 'Yellow-flesh'],
  },
  yam: {
    recipes: ['Pounded yam', 'Yam porridge', 'Fried yam'],
    varieties: ['White yam', 'Yellow yam', 'Water yam'],
  },
  cowpea: {
    recipes: ['Black-eyed pea stew', 'Akara (bean fritters)', 'Hoppin’ John'],
    varieties: ['Black-eyed pea', 'Crowder pea', 'Yardlong bean (a subspecies)'],
  },
  grape: {
    recipes: ['Fresh table grapes', 'Wine', 'Raisins (dried)'],
    varieties: ['Thompson Seedless', 'Concord', 'Cabernet Sauvignon', 'Muscat'],
  },
  cabbage: {
    recipes: ['Coleslaw', 'Sauerkraut', 'Stuffed cabbage rolls'],
    varieties: ['Green', 'Red', 'Savoy', 'Napa (Chinese)'],
  },
  leek: {
    recipes: ['Leek and potato soup', 'Braised leeks', 'Leek quiche'],
    varieties: ['Musselburgh', 'American Flag'],
  },
  // A few prominent extras
  blackberry: {
    recipes: ['Blackberry crumble', 'Bramble jelly', 'Blackberry and apple pie'],
    varieties: ['Wild bramble', 'Thornless cultivated', 'Marionberry'],
  },
  raspberry: {
    recipes: ['Raspberry jam', 'Raspberry coulis', 'Fresh raspberries with cream'],
    varieties: ['Summer-fruiting', 'Autumn-fruiting', 'Golden raspberry'],
  },
  strawberry: {
    recipes: ['Strawberries and cream', 'Strawberry jam', 'Strawberry shortcake'],
    varieties: ['Garden strawberry', 'Wild/alpine (fraises des bois)'],
  },
  elderberry: {
    recipes: ['Elderberry syrup (cooked)', 'Elderflower cordial (from the flowers)', 'Elderberry wine'],
    varieties: ['European elder', 'American elder'],
  },
  chestnut: {
    recipes: ['Roasted chestnuts', 'Chestnut stuffing', 'Candied chestnuts (marrons glacés)'],
    varieties: ['European sweet chestnut', 'Japanese chestnut', 'Chinese chestnut'],
  },
  hazelnut: {
    recipes: ['Chocolate-hazelnut spread', 'Roasted hazelnuts', 'Praline'],
    varieties: ['Cobnut', 'Filbert'],
  },
  nettle: {
    recipes: ['Nettle soup', 'Nettle tea', 'Nettle pesto (blanched first)'],
    varieties: ['Common stinging nettle'],
  },
  'prickly-pear': {
    recipes: ['Prickly-pear syrup', 'Cactus fruit agua fresca', 'Nopales (grilled young pads)'],
    varieties: ['Red/purple tuna', 'Green/yellow tuna'],
  },
}

// Local / native names, usually in the language of the region of origin
// (with a transliteration where the script differs).
const localNames: Record<string, string> = {
  tomato: 'Tomate · Xitomatl (Nahuatl)',
  potato: 'Papa (Quechua)',
  maize: 'Maíz · Centli (Nahuatl)',
  'chili-pepper': 'Chīlli (Nahuatl)',
  avocado: 'Aguacate · Āhuacatl (Nahuatl)',
  'common-bean': 'Frijol · Etl (Nahuatl)',
  cacao: 'Cacao · Cacáhuatl (Nahuatl)',
  pineapple: 'Ananás (Tupi–Guaraní)',
  peanut: 'Maní (Taíno)',
  cassava: 'Mandioca · Yuca (Tupi)',
  sunflower: 'Girasol',
  blueberry: 'Blueberry',
  cranberry: 'Sassamanash (Narragansett)',
  pumpkin: 'Calabaza',
  wheat: 'قمح Qamḥ (Arabic)',
  barley: 'شعير Shaʿīr (Arabic)',
  lentil: 'عدس ʿAdas (Arabic)',
  chickpea: 'حمّص Ḥummuṣ (Arabic)',
  pea: 'Pea',
  fig: 'تين Tīn (Arabic)',
  olive: 'زيتون Zaytūn (Arabic)',
  'date-palm': 'تمر Tamr (Arabic)',
  pomegranate: 'رمّان Rummān (Arabic)',
  almond: 'لوز Lawz (Arabic)',
  carrot: 'Carrot',
  spinach: 'اسفناج Isfanāj (Persian)',
  apple: 'Apple',
  walnut: 'گردو Gerdū (Persian)',
  apricot: 'زردآلو Zardālū (Persian)',
  onion: 'Onion',
  garlic: 'Garlic',
  rice: '稻 Dào (Chinese) · चावल Chāval (Hindi)',
  soybean: '大豆 Dàdòu (Chinese)',
  peach: '桃 Táo (Chinese)',
  tea: '茶 Chá (Chinese)',
  orange: '橙 Chéng (Chinese)',
  cucumber: 'ककड़ी Kakṛī (Hindi)',
  eggplant: 'बैंगन Baingan (Hindi) · Brinjal',
  'black-pepper': 'मिलगु Milagu (Tamil) · Kali Mirch (Hindi)',
  mango: 'आम Ām (Hindi)',
  banana: 'केला Kela (Hindi)',
  sugarcane: 'गन्ना Gannā (Hindi)',
  taro: 'Kalo (Hawaiian) · अरबी Arbi (Hindi)',
  coconut: 'नारियल Nāriyal (Hindi) · Niu',
  ginger: 'अदरक Adrak (Hindi)',
  turmeric: 'हल्दी Haldī (Hindi)',
  coffee: 'ቡና Buna (Amharic) · قهوة Qahwa',
  okra: 'भिंडी Bhindī (Hindi)',
  sorghum: 'ज्वार Jowār (Hindi)',
  watermelon: 'بطّيخ Baṭṭīkh (Arabic)',
  yam: 'Iṣu (Yoruba)',
  cowpea: 'Ẹ̀wà (Yoruba) · Wake (Hausa)',
  grape: 'عنب ʿInab (Arabic)',
  cabbage: 'Cabbage',
  leek: 'Leek',
}

// Merge the safety-sensitive field guide with recipes/varieties/local name for
// a full per-item record. Returns undefined when nothing is documented.
export function getFieldGuide(id: string) {
  const base = fieldGuide[id]
  const extra = itemDetails[id]
  const localName = localNames[id]
  if (!base && !extra && !localName) return undefined
  return { ...(base ?? ({} as Partial<FieldGuide>)), ...extra, localName }
}
