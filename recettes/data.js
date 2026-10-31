// Généré par build-data.mjs à partir de resources/*.csv — ne pas éditer à la main.
const DONNEES = {
 "ingredients": [
  {
   "id": "farine",
   "nom": "Farine de blé",
   "unite": "g",
   "note": "125g == 1 pot de yaourt · 1cs == 10g",
   "cat": "farine",
   "en": "wheat flour"
  },
  {
   "id": "sarrasin",
   "nom": "Farine de sarrasin",
   "unite": "g",
   "note": "",
   "cat": "farine",
   "en": "buckwheat flour"
  },
  {
   "id": "mais",
   "nom": "Farine de maïs",
   "unite": "g",
   "note": "masa harina (maïs nixtamalisé), pas de Maïzena ni de polenta",
   "cat": "farine",
   "en": "corn flour (masa harina)"
  },
  {
   "id": "avoine",
   "nom": "Avoine",
   "unite": "g",
   "note": "",
   "cat": "farine",
   "en": "oats"
  },
  {
   "id": "yaourt",
   "nom": "Yaourt",
   "unite": "pot",
   "note": "",
   "cat": "liquide",
   "en": "yogurt"
  },
  {
   "id": "oeufs",
   "nom": "Œufs",
   "unite": "",
   "note": "",
   "cat": "base",
   "en": "eggs"
  },
  {
   "id": "eau",
   "nom": "Eau",
   "unite": "ml",
   "note": "",
   "cat": "liquide",
   "en": "water"
  },
  {
   "id": "lait",
   "nom": "Lait",
   "unite": "ml",
   "note": "100ml == 103g · 100g == 97ml",
   "cat": "liquide",
   "en": "milk"
  },
  {
   "id": "beurre",
   "nom": "Beurre",
   "unite": "g",
   "note": "",
   "cat": "gras",
   "en": "butter"
  },
  {
   "id": "huile",
   "nom": "Huile",
   "unite": "ml",
   "note": "1 pot de yaourt = 105ml · 1cs == 15ml",
   "cat": "gras",
   "en": "oil"
  },
  {
   "id": "levure_chimique",
   "nom": "Levure chimique",
   "unite": "sachet",
   "note": "1 sachet == 11g",
   "cat": "levant",
   "en": "baking powder"
  },
  {
   "id": "levure_de_boulanger",
   "nom": "Levure de boulanger",
   "unite": "sachet",
   "note": "1 sachet == 7g",
   "cat": "levant",
   "en": "yeast"
  },
  {
   "id": "sel",
   "nom": "Sel",
   "unite": "g",
   "note": "1 pincée == 0.3g · 1cc == 5g",
   "cat": "assaisonnement",
   "en": "salt"
  },
  {
   "id": "sucre",
   "nom": "Sucre",
   "unite": "g",
   "note": "100g == 1 pot de yaourt · 1cs == 15g",
   "cat": "sucre",
   "en": "sugar"
  },
  {
   "id": "sucre_vanille",
   "nom": "Sucre vanillé",
   "unite": "sachet",
   "note": "",
   "cat": "sucre",
   "en": "vanilla sugar"
  },
  {
   "id": "chocolat",
   "nom": "Chocolat",
   "unite": "g",
   "note": "",
   "cat": "sucre",
   "en": "chocolate"
  },
  {
   "id": "chorizo",
   "nom": "Chorizo",
   "unite": "g",
   "note": "",
   "cat": "garniture",
   "en": "chorizo"
  },
  {
   "id": "gruyere",
   "nom": "Gruyère",
   "unite": "g",
   "note": "",
   "cat": "garniture",
   "en": "Gruyère cheese"
  },
  {
   "id": "fruits",
   "nom": "Fruits",
   "unite": "g",
   "note": "cerises, pruneaux…",
   "cat": "garniture",
   "en": "fruit"
  },
  {
   "id": "moutarde",
   "nom": "Moutarde",
   "unite": "cs",
   "note": "",
   "cat": "assaisonnement",
   "en": "mustard"
  },
  {
   "id": "vinaigre_ou_citron",
   "nom": "Vinaigre ou citron",
   "unite": "cs",
   "note": "",
   "cat": "assaisonnement",
   "en": "vinegar or lemon"
  },
  {
   "id": "ail",
   "nom": "Ail",
   "unite": "gousse",
   "note": "",
   "cat": "assaisonnement",
   "en": "garlic"
  },
  {
   "id": "muscade",
   "nom": "Muscade",
   "unite": "pincée",
   "note": "",
   "cat": "assaisonnement",
   "en": "nutmeg"
  }
 ],
 "recettes": [
  {
   "id": "crepes",
   "nom": "Crêpes",
   "ing": {
    "farine": 250,
    "oeufs": 3,
    "lait": 500,
    "beurre": 50,
    "sel": 1,
    "sucre": 30,
    "sucre_vanille": 1
   },
   "meta": {
    "cuisson": 1
   },
   "en": "Crêpes"
  },
  {
   "id": "pancakes",
   "nom": "Pancakes",
   "ing": {
    "farine": 250,
    "oeufs": 2,
    "lait": 300,
    "beurre": 50,
    "levure_chimique": 1,
    "sel": 1,
    "sucre": 30,
    "sucre_vanille": 1
   },
   "meta": {
    "cuisson": 1
   },
   "en": "Pancakes"
  },
  {
   "id": "pancakes-avoine",
   "nom": "Pancakes (Avoine)",
   "ing": {
    "farine": 60,
    "avoine": 30,
    "oeufs": 2,
    "lait": 150,
    "levure_chimique": 0.5,
    "sel": 1
   },
   "meta": {
    "cuisson": 1
   },
   "en": "Oat pancakes"
  },
  {
   "id": "gaufres",
   "nom": "Gaufres",
   "ing": {
    "farine": 250,
    "oeufs": 2,
    "lait": 500,
    "beurre": 80,
    "levure_chimique": 1,
    "sel": 1,
    "sucre": 50,
    "sucre_vanille": 1
   },
   "meta": {
    "cuisson": 5
   },
   "en": "Waffles"
  },
  {
   "id": "donut",
   "nom": "Donut",
   "ing": {
    "farine": 250,
    "oeufs": 1,
    "lait": 180,
    "beurre": 60,
    "levure_chimique": 1,
    "sel": 1.5,
    "sucre": 35,
    "sucre_vanille": 1
   },
   "meta": {
    "four": 180,
    "cuisson": 10
   },
   "en": "Doughnut"
  },
  {
   "id": "churros",
   "nom": "Churros",
   "ing": {
    "farine": 250,
    "eau": 250,
    "beurre": 50,
    "sel": 2,
    "sucre": 15
   },
   "meta": {
    "cuisson": 2
   },
   "en": "Churros"
  },
  {
   "id": "bottereaux",
   "nom": "Bottereaux",
   "ing": {
    "farine": 500,
    "oeufs": 3,
    "lait": 100,
    "beurre": 100,
    "levure_chimique": 1,
    "sel": 1,
    "sucre": 100
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 2
   },
   "en": "Bottereaux (Nantes fritters)"
  },
  {
   "id": "gateau-yaourt",
   "nom": "Gâteau Yaourt",
   "ing": {
    "farine": 375,
    "yaourt": 1,
    "oeufs": 3,
    "huile": 52.5,
    "levure_chimique": 1,
    "sel": 1,
    "sucre": 200,
    "sucre_vanille": 1
   },
   "meta": {
    "four": 180,
    "cuisson": 35
   },
   "en": "Yogurt cake"
  },
  {
   "id": "fondant-au-chocolat",
   "nom": "Fondant au chocolat",
   "ing": {
    "farine": 50,
    "oeufs": 3,
    "beurre": 100,
    "sucre": 100,
    "chocolat": 200
   },
   "meta": {
    "four": 180,
    "cuisson": 20
   },
   "en": "Chocolate fondant cake"
  },
  {
   "id": "cake-sale-chorizo",
   "nom": "Cake salé (chorizo)",
   "ing": {
    "farine": 200,
    "oeufs": 3,
    "lait": 125,
    "huile": 100,
    "levure_chimique": 1,
    "sel": 2,
    "chorizo": 250,
    "gruyere": 100
   },
   "meta": {
    "four": 180,
    "cuisson": 45
   },
   "en": "Savory loaf cake (chorizo)"
  },
  {
   "id": "galettes-de-ble-noir",
   "nom": "Galettes de Blé noir",
   "ing": {
    "farine": 20,
    "sarrasin": 250,
    "oeufs": 1,
    "eau": 500,
    "huile": 15,
    "sel": 5
   },
   "meta": {
    "temp": "froide",
    "cuisson": 1
   },
   "en": "Buckwheat galettes"
  },
  {
   "id": "tortillas-de-mais",
   "nom": "Tortillas de maïs",
   "ing": {
    "mais": 250,
    "eau": 300,
    "sel": 3
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 0.5
   },
   "en": "Corn tortillas"
  },
  {
   "id": "empanadillas",
   "nom": "Empanadillas",
   "ing": {
    "farine": 250,
    "eau": 100,
    "huile": 60,
    "sel": 4
   },
   "meta": {
    "temp": "tiède",
    "four": 180,
    "cuisson": 20
   },
   "en": "Empanadillas (empanada dough)"
  },
  {
   "id": "sauce-bechamel",
   "nom": "Sauce Béchamel",
   "ing": {
    "farine": 50,
    "lait": 500,
    "beurre": 50,
    "sel": 3,
    "muscade": 1
   },
   "meta": {},
   "en": "Béchamel sauce"
  },
  {
   "id": "mayonnaise",
   "nom": "Mayonnaise",
   "ing": {
    "oeufs": 1,
    "huile": 150,
    "sel": 2,
    "moutarde": 1,
    "vinaigre_ou_citron": 1
   },
   "meta": {},
   "en": "Mayonnaise"
  },
  {
   "id": "pate-brisee",
   "nom": "Pâte brisée",
   "ing": {
    "farine": 250,
    "eau": 50,
    "beurre": 125,
    "sel": 5
   },
   "meta": {
    "four": 180,
    "cuisson": 15
   },
   "en": "Shortcrust pastry"
  },
  {
   "id": "pate-feuilletee",
   "nom": "Pâte feuilletée",
   "ing": {
    "farine": 250,
    "eau": 125,
    "beurre": 225,
    "sel": 5
   },
   "meta": {
    "four": 200,
    "cuisson": 25
   },
   "en": "Puff pastry"
  },
  {
   "id": "pate-a-pizza",
   "nom": "Pâte à pizza",
   "ing": {
    "farine": 250,
    "eau": 155,
    "huile": 15,
    "levure_de_boulanger": 1,
    "sel": 5,
    "sucre": 15
   },
   "meta": {
    "temp": "tiède",
    "four": 250,
    "cuisson": 10
   },
   "en": "Pizza dough"
  },
  {
   "id": "pate-a-choux",
   "nom": "Pâte à choux",
   "ing": {
    "farine": 150,
    "oeufs": 4,
    "eau": 250,
    "beurre": 100,
    "sel": 2,
    "sucre": 5
   },
   "meta": {
    "four": 200,
    "cuisson": 30
   },
   "en": "Choux pastry"
  },
  {
   "id": "gougeres",
   "nom": "Gougères",
   "ing": {
    "farine": 150,
    "oeufs": 4,
    "eau": 125,
    "lait": 125,
    "beurre": 100,
    "sel": 3,
    "gruyere": 150,
    "muscade": 1
   },
   "meta": {
    "four": 200,
    "cuisson": 25
   },
   "en": "Gougères (cheese puffs)"
  },
  {
   "id": "quatre-quarts",
   "nom": "Quatre-quarts",
   "ing": {
    "farine": 150,
    "oeufs": 3,
    "beurre": 150,
    "levure_chimique": 0.5,
    "sel": 1,
    "sucre": 150,
    "sucre_vanille": 1
   },
   "meta": {
    "four": 180,
    "cuisson": 40
   },
   "en": "Pound cake"
  },
  {
   "id": "madeleines",
   "nom": "Madeleines",
   "ing": {
    "farine": 125,
    "oeufs": 3,
    "beurre": 125,
    "levure_chimique": 0.5,
    "sucre": 125
   },
   "meta": {
    "four": 200,
    "cuisson": 10
   },
   "en": "Madeleines"
  },
  {
   "id": "far-breton",
   "nom": "Far breton",
   "ing": {
    "farine": 200,
    "oeufs": 4,
    "lait": 750,
    "beurre": 30,
    "sel": 1,
    "sucre": 120,
    "fruits": 200
   },
   "meta": {
    "four": 180,
    "cuisson": 45
   },
   "en": "Far breton (Breton flan)"
  },
  {
   "id": "clafoutis",
   "nom": "Clafoutis",
   "ing": {
    "farine": 100,
    "oeufs": 3,
    "lait": 250,
    "beurre": 20,
    "sel": 1,
    "sucre": 100,
    "sucre_vanille": 1,
    "fruits": 500
   },
   "meta": {
    "four": 180,
    "cuisson": 35
   },
   "en": "Clafoutis"
  },
  {
   "id": "yorkshire-pudding",
   "nom": "Yorkshire pudding",
   "ing": {
    "farine": 140,
    "oeufs": 4,
    "lait": 200,
    "huile": 60,
    "sel": 2
   },
   "meta": {
    "four": 220,
    "cuisson": 25
   },
   "en": "Yorkshire pudding"
  },
  {
   "id": "blinis",
   "nom": "Blinis",
   "ing": {
    "farine": 150,
    "sarrasin": 50,
    "oeufs": 2,
    "lait": 250,
    "beurre": 30,
    "levure_de_boulanger": 1,
    "sel": 2
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 2
   },
   "en": "Blinis"
  },
  {
   "id": "brioche",
   "nom": "Brioche",
   "ing": {
    "farine": 500,
    "oeufs": 4,
    "lait": 100,
    "beurre": 250,
    "levure_de_boulanger": 1,
    "sel": 10,
    "sucre": 75
   },
   "meta": {
    "temp": "tiède",
    "four": 180,
    "cuisson": 35
   },
   "en": "Brioche"
  },
  {
   "id": "naan",
   "nom": "Naan",
   "ing": {
    "farine": 250,
    "yaourt": 1,
    "eau": 50,
    "huile": 15,
    "levure_de_boulanger": 1,
    "sel": 3,
    "sucre": 5
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 3
   },
   "en": "Naan"
  },
  {
   "id": "tortillas-de-ble",
   "nom": "Tortillas de blé",
   "ing": {
    "farine": 250,
    "eau": 125,
    "huile": 50,
    "levure_chimique": 0.5,
    "sel": 4
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 1
   },
   "en": "Flour tortillas"
  },
  {
   "id": "pate-sablee",
   "nom": "Pâte sablée",
   "ing": {
    "farine": 250,
    "oeufs": 1,
    "beurre": 125,
    "sel": 1,
    "sucre": 100
   },
   "meta": {
    "four": 180,
    "cuisson": 20
   },
   "en": "Sweet shortcrust (pâte sablée)"
  },
  {
   "id": "sauce-mornay",
   "nom": "Sauce Mornay",
   "ing": {
    "farine": 50,
    "lait": 500,
    "beurre": 50,
    "sel": 3,
    "gruyere": 100,
    "muscade": 1
   },
   "meta": {},
   "en": "Mornay (cheese) sauce"
  },
  {
   "id": "aioli",
   "nom": "Aïoli",
   "ing": {
    "oeufs": 1,
    "huile": 200,
    "sel": 2,
    "vinaigre_ou_citron": 1,
    "ail": 3
   },
   "meta": {},
   "en": "Aïoli"
  },
  {
   "id": "hollandaise",
   "nom": "Hollandaise",
   "ing": {
    "oeufs": 3,
    "beurre": 125,
    "sel": 1,
    "vinaigre_ou_citron": 1
   },
   "meta": {},
   "en": "Hollandaise sauce"
  }
 ]
};
