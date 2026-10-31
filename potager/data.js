// Données du potager — climat tempéré (France métropolitaine, hors montagne et pourtour méditerranéen).
// Mois : 1 = janvier … 12 = décembre.

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MOIS_COURT = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

// Ordre = ordre de la rotation sur 4 ans (chaque carré passe au groupe suivant chaque année).
const GROUPES = [
  {
    id: "legumineuses", nom: "Légumineuses", emoji: "🫘", couleur: "#7a9a3a",
    role: "Elles captent l'azote de l'air grâce à des bactéries sur leurs racines : elles nourrissent le sol pour la culture suivante.",
    suite: "Suivies des légumes-feuilles, qui adorent l'azote.",
    planches: ["pois", "haricot", "feve"],
  },
  {
    id: "feuilles", nom: "Feuilles et choux", emoji: "🥬", couleur: "#2f8f5b",
    role: "Gourmands en azote : ils profitent de l'héritage des légumineuses. Les choux aiment un sol riche et bien paillé.",
    suite: "Suivis des légumes-fruits.",
    planches: ["chou", "laitue", "poireau"],
  },
  {
    id: "fruits", nom: "Légumes-fruits", emoji: "🍅", couleur: "#d1493b",
    role: "Très gourmands (fumure, compost mûr) et amateurs de soleil. Ils épuisent le sol : ils passent en 3ᵉ position.",
    suite: "Suivis des racines, moins exigeantes.",
    planches: ["tomate", "courgette", "poivron"],
  },
  {
    id: "racines", nom: "Racines et bulbes", emoji: "🥕", couleur: "#d98a2b",
    role: "Peu gourmandes, elles supportent un sol déjà utilisé. Pas de fumure fraîche : elles feraient fourcher les carottes.",
    suite: "Suivies d'engrais verts puis des légumineuses : le cycle recommence.",
    planches: ["carotte", "betterave", "ail"],
  },
];

// s = semis, p = plantation / repiquage, r = récolte
const LEGUMES = [
  {
    id: "pois", nom: "Pois", emoji: "🟢", groupe: "legumineuses", famille: "Fabacées",
    s: [2, 3, 4, 10, 11], p: [], r: [5, 6, 7],
    soleil: "Soleil", espace: "5 cm sur la ligne, lignes à 30 cm", duree: "3 à 4 mois",
    conseil: "En automne, choisir une variété rustique d'hiver (ex. 'Douce Provence'). Poser un grillage ou des branches pour le tuteurage. Après la récolte, couper à ras et laisser les racines en terre : l'azote reste dans le sol.",
    amis: "Carotte, radis, laitue", ennemis: "Ail, oignon, poireau",
  },
  {
    id: "haricot", nom: "Haricot", emoji: "🫛", groupe: "legumineuses", famille: "Fabacées",
    s: [5, 6, 7], p: [], r: [7, 8, 9, 10],
    soleil: "Soleil", espace: "40 cm entre poquets de 5 graines", duree: "2 à 3 mois",
    conseil: "Semer seulement quand le sol dépasse 12 °C (pas avant mai). Les variétés naines ne demandent pas de tuteur ; les grimpantes produisent plus longtemps. Cueillir souvent pour prolonger la récolte.",
    amis: "Carotte, laitue, sarriette", ennemis: "Ail, oignon, poireau",
  },
  {
    id: "feve", nom: "Fève", emoji: "🌱", groupe: "legumineuses", famille: "Fabacées",
    s: [10, 11, 2, 3], p: [], r: [5, 6],
    soleil: "Soleil", espace: "20 cm sur la ligne, lignes à 40 cm", duree: "6 à 7 mois (semis d'automne)",
    conseil: "Le semis d'automne (octobre–novembre) donne des plantes robustes et une récolte dès mai. Pincer le sommet à la floraison pour limiter les pucerons noirs. Excellent engrais vert si on la coupe avant les gousses.",
    amis: "Pomme de terre, carotte, céleri", ennemis: "Ail, oignon",
  },
  {
    id: "chou", nom: "Chou (kale, pommé…)", emoji: "🥬", groupe: "feuilles", famille: "Brassicacées",
    s: [4, 5, 6], p: [6, 7, 8], r: [10, 11, 12, 1, 2, 3],
    soleil: "Soleil / mi-ombre", espace: "50 cm dans tous les sens", duree: "5 à 8 mois",
    conseil: "Le kale (chou frisé) est le plus facile : on cueille les feuilles du bas tout l'hiver, il résiste à −15 °C. Butter les pieds et poser un filet anti-piéride (papillon blanc) dès l'été.",
    amis: "Céleri, betterave, capucine", ennemis: "Fraisier, tomate",
  },
  {
    id: "laitue", nom: "Laitue et salades", emoji: "🥗", groupe: "feuilles", famille: "Astéracées",
    s: [3, 4, 5, 6, 7, 8, 9], p: [4, 5, 6, 7, 8, 9, 10], r: [5, 6, 7, 8, 9, 10, 11],
    soleil: "Mi-ombre en été", espace: "25–30 cm", duree: "6 à 10 semaines",
    conseil: "Semer en petite quantité toutes les 2–3 semaines pour étaler la récolte. En été, préférer les variétés résistantes à la chaleur et arroser le soir. En automne, les batavias et feuilles de chêne tiennent le mieux.",
    amis: "Carotte, radis, fraisier", ennemis: "Persil, céleri",
  },
  {
    id: "epinard", nom: "Épinard", emoji: "🍃", groupe: "feuilles", famille: "Amaranthacées",
    s: [3, 4, 8, 9, 10], p: [], r: [5, 6, 10, 11, 12, 1, 2],
    soleil: "Mi-ombre", espace: "10 cm, lignes à 25 cm", duree: "6 à 8 semaines",
    conseil: "Légume de saison fraîche : monte en graines dès que les jours rallongent. Le semis d'août–septembre donne des feuilles tendres tout l'hiver sous un voile.",
    amis: "Fraisier, chou", ennemis: "—",
  },
  {
    id: "mache", nom: "Mâche", emoji: "🌿", groupe: "feuilles", famille: "Valérianacées",
    s: [8, 9, 10], p: [], r: [10, 11, 12, 1, 2, 3],
    soleil: "Soleil / mi-ombre", espace: "Semis dense, lignes à 15 cm", duree: "2 à 3 mois",
    conseil: "Ultra rustique, parfaite pour un premier hiver : semer à la volée, tasser au dos du râteau, arroser. Peut tenir en terre sous la neige. Se resème seule si on laisse monter quelques pieds.",
    amis: "Poireau, fraisier", ennemis: "—",
  },
  {
    id: "poireau", nom: "Poireau", emoji: "🧅", groupe: "feuilles", famille: "Amaryllidacées",
    s: [2, 3, 4, 5], p: [5, 6, 7], r: [9, 10, 11, 12, 1, 2, 3],
    soleil: "Soleil", espace: "15 cm, lignes à 30 cm", duree: "5 à 7 mois",
    conseil: "Repiquer dans un trou profond de 15 cm fait au plantoir, sans reboucher : le fût blanchit en grossissant. Très rustique, il reste en terre tout l'hiver et se récolte à la demande.",
    amis: "Carotte, céleri, fraisier", ennemis: "Pois, haricot",
  },
  {
    id: "tomate", nom: "Tomate", emoji: "🍅", groupe: "fruits", famille: "Solanacées",
    s: [3, 4], p: [5, 6], r: [7, 8, 9, 10],
    soleil: "Plein soleil", espace: "60 cm, lignes à 80 cm", duree: "5 à 6 mois",
    conseil: "Semer sous abri chaud en mars, repiquer après les Saints de glace (mi-mai). Tuteurer, supprimer les gourmands, pailler épais. Ne jamais mouiller le feuillage (mildiou). Éviter de replanter des solanacées au même endroit pendant 3–4 ans.",
    amis: "Basilic, œillet d'Inde, carotte", ennemis: "Chou, fenouil, pomme de terre",
  },
  {
    id: "courgette", nom: "Courgette et courges", emoji: "🎃", groupe: "fruits", famille: "Cucurbitacées",
    s: [4, 5], p: [5, 6], r: [7, 8, 9, 10],
    soleil: "Soleil", espace: "1 m (courgette) à 1,5 m (courges)", duree: "3 à 5 mois",
    conseil: "Plante très gourmande : planter sur un petit monticule de compost. Une courgette ne suffit pas à nourrir un foyer — 2 pieds produisent déjà beaucoup. Les courges (potimarron, butternut) se récoltent en octobre et se conservent tout l'hiver.",
    amis: "Maïs, haricot, capucine", ennemis: "Pomme de terre",
  },
  {
    id: "poivron", nom: "Poivron et aubergine", emoji: "🫑", groupe: "fruits", famille: "Solanacées",
    s: [2, 3], p: [5, 6], r: [7, 8, 9],
    soleil: "Plein soleil, abrité du vent", espace: "50 cm", duree: "5 à 6 mois",
    conseil: "Plus frileux que la tomate : semer au chaud dès février, planter fin mai. Un mini-tunnel ou un abri aide beaucoup dans les régions fraîches. Arroser régulièrement et au pied.",
    amis: "Basilic, carotte", ennemis: "Fenouil",
  },
  {
    id: "carotte", nom: "Carotte", emoji: "🥕", groupe: "racines", famille: "Apiacées",
    s: [3, 4, 5, 6, 7], p: [], r: [6, 7, 8, 9, 10, 11, 12],
    soleil: "Soleil", espace: "3 cm après éclaircissage, lignes à 20 cm", duree: "3 à 5 mois",
    conseil: "Sol fin, meuble, sans cailloux ni fumier frais. La germination est lente (2–3 semaines) : garder la terre humide, couvrir d'un voile. Éclaircir tôt ; l'odeur attire la mouche de la carotte, donc voile anti-insectes.",
    amis: "Poireau, oignon, radis", ennemis: "Aneth",
  },
  {
    id: "betterave", nom: "Betterave", emoji: "🟣", groupe: "racines", famille: "Amaranthacées",
    s: [4, 5, 6, 7], p: [], r: [7, 8, 9, 10, 11],
    soleil: "Soleil / mi-ombre", espace: "10 cm, lignes à 30 cm", duree: "3 à 4 mois",
    conseil: "Chaque « graine » est un glomérule contenant plusieurs semences : éclaircir après la levée. Récolter avant les premières gelées fortes ; les feuilles se cuisinent comme des blettes.",
    amis: "Chou, oignon, laitue", ennemis: "Haricot grimpant",
  },
  {
    id: "ail", nom: "Ail, échalote, oignon", emoji: "🧄", groupe: "racines", famille: "Amaryllidacées",
    s: [], p: [10, 11, 2, 3], r: [6, 7, 8],
    soleil: "Soleil", espace: "10–15 cm, lignes à 25 cm", duree: "7 à 9 mois (plantation d'automne)",
    conseil: "À planter maintenant ! Caïeux de 2–3 cm de profondeur, pointe vers le haut, à planter dans un sol non fumé et bien drainé. L'ail d'automne passe l'hiver au froid, ce qui le fait former sa tête. Récolte quand les feuilles jaunissent (juin–juillet), puis séchage 2–3 semaines.",
    amis: "Carotte, fraisier, tomate", ennemis: "Pois, haricot, fève",
  },
  {
    id: "radis", nom: "Radis", emoji: "🔴", groupe: "racines", famille: "Brassicacées",
    s: [3, 4, 5, 6, 7, 8, 9], p: [], r: [4, 5, 6, 7, 8, 9, 10],
    soleil: "Mi-ombre", espace: "3 cm, lignes à 15 cm", duree: "3 à 5 semaines",
    conseil: "Le plus rapide du potager : idéal pour apprendre ou pour occuper un coin libre. Semer entre les carottes (levée rapide, il marque la ligne). Arroser régulièrement sinon il devient piquant et creux.",
    amis: "Carotte, laitue, pois", ennemis: "—",
  },
  {
    id: "pdt", nom: "Pomme de terre", emoji: "🥔", groupe: "racines", famille: "Solanacées",
    s: [], p: [3, 4, 5], r: [6, 7, 8, 9],
    soleil: "Soleil", espace: "35 cm, lignes à 70 cm", duree: "3 à 5 mois",
    conseil: "Gourmande en place : sur 100 m² elle occupe beaucoup. Pré-germer les plants en février, butter deux fois. Utile pour nettoyer un sol de gazon en première année (la terre est ameublie).",
    amis: "Fève, chou, œillet d'Inde", ennemis: "Tomate, courge",
  },
  {
    id: "fraise", nom: "Fraisier", emoji: "🍓", groupe: "autre", famille: "Rosacées",
    s: [], p: [8, 9, 10, 3, 4], r: [5, 6, 7],
    soleil: "Soleil / mi-ombre", espace: "30 cm, lignes à 40 cm", duree: "Vivace, 3 à 4 ans",
    conseil: "Planter fin d'été ou début d'automne : bonne reprise, récolte dès l'année suivante. Cœur de la plante au niveau du sol, pas enterré. Pailler à la paille. Renouveler le plan tous les 3–4 ans, ailleurs.",
    amis: "Ail, poireau, épinard", ennemis: "Chou",
  },
  {
    id: "aromatiques", nom: "Aromatiques", emoji: "🌿", groupe: "autre", famille: "Variées",
    s: [3, 4, 5], p: [3, 4, 5, 9, 10], r: [5, 6, 7, 8, 9, 10],
    soleil: "Soleil (thym, romarin) / mi-ombre (persil, ciboulette)", espace: "20–60 cm selon l'espèce", duree: "Vivaces pour la plupart",
    conseil: "À mettre en bordure ou près de la maison. Thym, romarin, sauge, ciboulette sont vivaces et ne demandent presque rien. Le persil est bisannuel, le basilic est annuel (gélif).",
    amis: "Presque tout le potager", ennemis: "—",
  },
  {
    id: "engrais", nom: "Engrais vert", emoji: "🌾", groupe: "autre", famille: "Variées",
    s: [8, 9, 10, 11], p: [], r: [],
    soleil: "Peu importe", espace: "Semis à la volée, dense", duree: "3 à 6 mois",
    conseil: "Couverture du sol en hiver : évite l'érosion et les mauvaises herbes, nourrit la vie du sol. Mélanges : seigle + vesce (semis jusqu'à mi-novembre), phacélie (avant fin octobre), moutarde (avant fin septembre). Faucher avant floraison, laisser sécher, laisser en paillis ou incorporer légèrement au printemps.",
    amis: "—", ennemis: "—",
  },
];

// Ce qu'il faut faire chaque mois, avec le « pourquoi ».
const TACHES = [
  {
    saison: "Hiver", titre: "Repos et préparation",
    taches: [
      "Planifier la saison : dessiner le plan, commander les graines.",
      "Récolter mâche, kale, poireaux, panais, épinards d'hiver.",
      "Tailler arbres fruitiers et groseilliers par temps sec hors gel.",
      "Fin du mois : commencer les semis chauds sous abri (poivrons, aubergines).",
    ],
    pourquoi: "Le potager dort mais le sol ne doit pas rester nu : tout ce qui est paillé ou couvert garde sa structure. L'hiver est le moment idéal pour réfléchir à la rotation.",
  },
  {
    saison: "Hiver", titre: "Dernières préparations",
    taches: [
      "Semer sous abri : poivrons, aubergines, céleri, premiers poireaux.",
      "Pré-germer les pommes de terre à la lumière.",
      "Semer pois et fèves si le sol est ressuyé.",
      "Passer le compost : c'est le moment de le tamiser s'il est mûr.",
    ],
    pourquoi: "Les semis précoces sous abri gagnent 4 à 6 semaines : tomate et poivron ont besoin d'une longue saison pour mûrir avant l'automne.",
  },
  {
    saison: "Printemps", titre: "Le grand départ",
    taches: [
      "Semer carottes, radis, laitues, épinards, navets, pois en pleine terre.",
      "Semer sous abri tomates et courges (en godets).",
      "Planter les pommes de terre et les oignons en bulbilles.",
      "Étaler une couche de compost de 2–3 cm sur les planches libres.",
    ],
    pourquoi: "Le sol dépasse enfin 6–8 °C : les graines de saison fraîche germent. C'est aussi là qu'on réveille la vie du sol avec du compost plutôt qu'en retournant la terre.",
  },
  {
    saison: "Printemps", titre: "Tout démarre",
    taches: [
      "Semer carottes, betteraves, navets, radis, laitues.",
      "Repiquer les poireaux, planter les fraisiers, buttage des pommes de terre.",
      "Semer sous abri : courgettes, concombres, courges.",
      "Surveiller les limaces et les pucerons (coccinelles, pas de pesticides).",
    ],
    pourquoi: "Les gelées tardives sont encore possibles : on ne plante dehors que ce qui est rustique. Surveiller maintenant évite de grosses attaques en mai.",
  },
  {
    saison: "Printemps", titre: "Plantation des légumes-fruits",
    taches: [
      "Après le 15 mai (Saints de glace) : planter tomates, poivrons, courgettes, courges.",
      "Semer haricots dès que le sol atteint 12 °C.",
      "Pailler tout le sol nu : conserve l'eau, étouffe les herbes.",
      "Récolter radis, laitues, épinards, premières fèves.",
    ],
    pourquoi: "Les plants issus de graines tropicales ne supportent pas le froid : attendre est la meilleure assurance. Le paillage réduit l'arrosage de 30 à 50 %.",
  },
  {
    saison: "Été", titre: "Récoltes et relais",
    taches: [
      "Récolter pois, fèves, fraises, premiers haricots, ail et échalotes.",
      "Semer carottes, betteraves, haricots, choux d'hiver (en pépinière).",
      "Arroser le matin ou le soir, au pied, abondamment mais rarement.",
      "Tuteurer et effeuiller les tomates, pincer les gourmands.",
    ],
    pourquoi: "Dès que les jours raccourcissent, on prépare l'automne : c'est maintenant qu'on sème le chou et la carotte d'hiver. Arroser rarement mais profondément pousse les racines à descendre.",
  },
  {
    saison: "Été", titre: "Pleine production",
    taches: [
      "Cueillir courgettes tous les 2 jours pour qu'elles continuent à produire.",
      "Récolter l'ail et les oignons à maturité, les faire sécher à l'ombre.",
      "Semer navets, radis d'automne, fenouil, mâche (à partir de fin juillet).",
      "Laisser un coin de fleurs : phacélie, capucines, soucis, qui attirent les auxiliaires.",
    ],
    pourquoi: "Plus la production est forte, plus la récolte doit être régulière : un fruit oublié freine la plante. Les fleurs attirent syrphes et coccinelles qui mangent les pucerons.",
  },
  {
    saison: "Été", titre: "Récolter et préparer l'automne",
    taches: [
      "Récolter tomates, haricots, poivrons, courgettes, premières courges.",
      "Semer mâche, épinards, laitues d'hiver, radis noir, navets.",
      "Planter fraisiers (fin du mois), semer engrais verts sur les planches libérées.",
      "Faire des conserves : sauce tomate, haricots, ratatouille.",
    ],
    pourquoi: "Un sol libéré par l'ail ou les pois ne doit pas rester nu : un engrais vert nourrit le sol, bloque les mauvaises herbes et évite l'érosion des pluies d'automne.",
  },
  {
    saison: "Automne", titre: "La seconde saison",
    taches: [
      "Semer mâche, épinards, laitues d'hiver (avant la mi-septembre idéalement).",
      "Récolter courges, derniers haricots, tomates avant les premières gelées.",
      "Semer engrais verts (moutarde, phacélie) sur tous les sols libres.",
      "Planter fraisiers ; commencer à diviser et replanter les aromatiques.",
    ],
    pourquoi: "C'est le dernier moment pour semer des légumes d'hiver : en dessous de 10 °C, la croissance ralentit fortement. Ce qui est installé maintenant sera récolté en décembre–mars.",
  },
  {
    saison: "Automne", titre: "Plantation de l'ail et des fèves",
    taches: [
      "Planter ail, échalotes, oignons d'automne.",
      "Semer fèves et pois d'hiver.",
      "Couvrir de compost et de feuilles mortes les planches vides (5–10 cm).",
      "Récolter courges, poireaux, betteraves, carottes avant les fortes gelées.",
      "Semer engrais vert : seigle + vesce, phacélie, féverole.",
    ],
    pourquoi: "Le froid de l'hiver est nécessaire à l'ail pour former ses caïeux. Les feuilles mortes sont de l'or : elles nourrissent les vers de terre qui travaillent le sol à votre place.",
  },
  {
    saison: "Automne", titre: "Dernières plantations",
    taches: [
      "Dernières plantations d'ail et d'échalote (avant la mi-novembre).",
      "Fin des semis de fèves et d'engrais vert (seigle).",
      "Nettoyer, rentrer les tuteurs, les outils, vider les arrosoirs.",
      "Pailler épais les planches vides et protéger les cultures d'hiver sous un voile.",
    ],
    pourquoi: "Avec la fin des jours chauds, l'objectif change : protéger le sol et les cultures déjà en place. Un voile d'hivernage (P17) apporte 2–3 °C.",
  },
  {
    saison: "Hiver", titre: "Bilan et repos",
    taches: [
      "Noter ce qui a marché ou non : rendements, attaques, variétés préférées.",
      "Récolter mâche, kale, poireaux, panais, épinards.",
      "Entretenir et affûter les outils ; huiler les manches.",
      "Établir le plan de la saison suivante en respectant la rotation.",
    ],
    pourquoi: "Un carnet de culture vaut tous les conseils : en 2–3 ans, vous saurez ce que votre sol et votre microclimat aiment vraiment.",
  },
];

// Check-list « Démarrer en automne » (cochable, sauvegardée dans le navigateur).
const DEMARRAGE = [
  { id: "d1", cat: "Préparer le terrain", txt: "Matérialiser le carré de 10 × 10 m avec des piquets et de la ficelle." },
  { id: "d2", cat: "Préparer le terrain", txt: "Faire un test du sol : bocal d'eau + terre (sable / limon / argile) et regarder si la terre s'agglomère." },
  { id: "d3", cat: "Préparer le terrain", txt: "Tondre ou faucher ras, puis couvrir de carton brun (sans scotch ni encre) en le faisant se chevaucher." },
  { id: "d4", cat: "Préparer le terrain", txt: "Poser 10 cm de compost, fumier mûr ou feuilles mortes par-dessus : on ne bêche pas, la terre se travaille toute seule." },
  { id: "d5", cat: "Préparer le terrain", txt: "Tracer 12 planches de 1,20 m (bras à portée) sur 4,50 m, séparées de sentiers de 45 cm, pour ne jamais marcher sur la terre cultivée." },
  { id: "d6", cat: "Préparer le terrain", txt: "Installer le composteur au centre, à portée de main, mi-ombre." },
  { id: "d7", cat: "Planter maintenant", txt: "Planter ail, échalotes et oignons d'automne (dernier créneau : mi-novembre)." },
  { id: "d8", cat: "Planter maintenant", txt: "Semer fèves et pois d'hiver, avec un voile ou des branchages si gel annoncé." },
  { id: "d9", cat: "Planter maintenant", txt: "Semer mâche et épinards si ce n'est pas déjà fait (voile conseillé)." },
  { id: "d10", cat: "Planter maintenant", txt: "Semer un engrais vert (seigle + vesce) sur toutes les planches qui resteront vides cet hiver." },
  { id: "d11", cat: "Planter maintenant", txt: "Pailler tout sol encore nu avec feuilles mortes, paille ou BRF." },
  { id: "d12", cat: "Préparer l'année", txt: "Choisir ce que vous aimez manger : mieux vaut cultiver 8 légumes que vous mangez qu'en essayer 30 sans plan." },
  { id: "d13", cat: "Préparer l'année", txt: "Installer une récupération d'eau de pluie (cuve, goutte-à-goutte) : le plus gros poste de travail en été." },
  { id: "d14", cat: "Préparer l'année", txt: "Commander graines paysannes ou bio avant l'hiver ; préparer un carnet de culture." },
];

const QUIZ = [
  {
    q: "On est fin octobre. Que peut-on encore planter pour une récolte en juin ?",
    options: ["Des tomates", "De l'ail", "Des courgettes"],
    bonne: 1,
    expl: "L'ail d'automne a besoin du froid hivernal pour former sa tête. Tomates et courgettes ne supportent pas le froid et se plantent après les Saints de glace (mi-mai).",
  },
  {
    q: "Pourquoi faire suivre les légumineuses (pois, haricots) par des légumes-feuilles ?",
    options: ["Parce qu'elles laissent de l'azote dans le sol", "Parce que les feuilles aiment l'ombre", "Parce que ça se fait toujours ainsi"],
    bonne: 0,
    expl: "Des bactéries (rhizobiums) vivent sur les racines des légumineuses et captent l'azote de l'air. Ce stock profite à la culture suivante, très gourmande en azote.",
  },
  {
    q: "Quelle est l'utilité d'un engrais vert en hiver ?",
    options: ["Faire joli", "Protéger et nourrir le sol, bloquer les mauvaises herbes", "Attirer les limaces"],
    bonne: 1,
    expl: "Un sol nu s'érode, se tasse et se couvre de mauvaises herbes. Les engrais verts maintiennent la structure et enrichissent en matière organique au printemps.",
  },
  {
    q: "Pourquoi éviter de marcher sur les planches ?",
    options: ["Pour ne pas abîmer les légumes", "Pour ne pas tasser le sol et casser sa structure aérée", "Pour ne pas salir ses chaussures"],
    bonne: 1,
    expl: "Une terre tassée manque d'air et d'eau, les racines peinent à descendre. Des planches de 1,20 m se travaillent depuis les sentiers.",
  },
  {
    q: "Quand repiquer tomates et poivrons dehors (climat tempéré) ?",
    options: ["Dès mars", "Après le 15 mai", "En août"],
    bonne: 1,
    expl: "Les Saints de glace (11–13 mai) marquent la fin du risque de gel tardif. Une nuit à 0 °C suffit à détruire des plants de tomate.",
  },
  {
    q: "Pourquoi tourner les cultures d'une année sur l'autre ?",
    options: ["Pour limiter maladies et parasites et équilibrer les besoins du sol", "Pour avoir plus de couleurs", "Pour avoir moins à arroser"],
    bonne: 0,
    expl: "Chaque famille a ses propres maladies (mildiou pour les solanacées, hernie pour les choux) qui restent dans le sol. La rotation les prive de leur hôte et alterne gourmands et peu exigeants.",
  },
];
