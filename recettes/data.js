// Généré par build-data.mjs à partir de resources/*.csv — ne pas éditer à la main.
const DONNEES = {
 "ingredients": [
  {
   "id": "farine",
   "nom": "Farine de blé",
   "unite": "g",
   "note": "125g == 1 pot de yaourt · 1cs == 10g",
   "cat": "farine"
  },
  {
   "id": "sarrasin",
   "nom": "Farine de sarrasin",
   "unite": "g",
   "note": "",
   "cat": "farine"
  },
  {
   "id": "mais",
   "nom": "Farine de maïs",
   "unite": "g",
   "note": "",
   "cat": "farine"
  },
  {
   "id": "avoine",
   "nom": "Avoine",
   "unite": "g",
   "note": "",
   "cat": "farine"
  },
  {
   "id": "yaourt",
   "nom": "Yaourt",
   "unite": "pot",
   "note": "",
   "cat": "liquide"
  },
  {
   "id": "oeufs",
   "nom": "Œufs",
   "unite": "",
   "note": "",
   "cat": "base"
  },
  {
   "id": "eau",
   "nom": "Eau",
   "unite": "ml",
   "note": "",
   "cat": "liquide"
  },
  {
   "id": "lait",
   "nom": "Lait",
   "unite": "ml",
   "note": "100ml == 103g · 100g == 97ml",
   "cat": "liquide"
  },
  {
   "id": "beurre",
   "nom": "Beurre",
   "unite": "g",
   "note": "",
   "cat": "gras"
  },
  {
   "id": "huile",
   "nom": "Huile",
   "unite": "ml",
   "note": "1 pot de yaourt = 105ml · 1cs == 15ml",
   "cat": "gras"
  },
  {
   "id": "levure",
   "nom": "Levure",
   "unite": "sachet",
   "note": "1 sachet == 10g",
   "cat": "levant"
  },
  {
   "id": "sel",
   "nom": "Sel",
   "unite": "pincée",
   "note": "1 pincée == 0.3g",
   "cat": "assaisonnement"
  },
  {
   "id": "sucre",
   "nom": "Sucre",
   "unite": "g",
   "note": "100g == 1 pot de yaourt · 1cs == 15g",
   "cat": "sucre"
  },
  {
   "id": "sucre_vanille",
   "nom": "Sucre vanillé",
   "unite": "sachet",
   "note": "",
   "cat": "sucre"
  },
  {
   "id": "chocolat",
   "nom": "Chocolat",
   "unite": "g",
   "note": "",
   "cat": "sucre"
  },
  {
   "id": "chorizo",
   "nom": "Chorizo",
   "unite": "g",
   "note": "",
   "cat": "garniture"
  },
  {
   "id": "gruyere",
   "nom": "Gruyère",
   "unite": "g",
   "note": "",
   "cat": "garniture"
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
   }
  },
  {
   "id": "pancakes",
   "nom": "Pancakes",
   "ing": {
    "farine": 250,
    "oeufs": 2,
    "lait": 300,
    "beurre": 50,
    "levure": 1,
    "sel": 1,
    "sucre": 30,
    "sucre_vanille": 1
   },
   "meta": {
    "cuisson": 1
   }
  },
  {
   "id": "pancakes-avoine",
   "nom": "Pancakes (Avoine)",
   "ing": {
    "farine": 60,
    "avoine": 30,
    "oeufs": 2,
    "lait": 150,
    "levure": 0.5,
    "sel": 1
   },
   "meta": {
    "cuisson": 1
   }
  },
  {
   "id": "gaufres",
   "nom": "Gaufres",
   "ing": {
    "farine": 250,
    "oeufs": 2,
    "lait": 500,
    "beurre": 80,
    "levure": 1,
    "sel": 1,
    "sucre": 50,
    "sucre_vanille": 1
   },
   "meta": {
    "cuisson": 5
   }
  },
  {
   "id": "donut",
   "nom": "Donut",
   "ing": {
    "farine": 250,
    "oeufs": 1,
    "lait": 180,
    "beurre": 60,
    "levure": 1,
    "sel": 1,
    "sucre": 35,
    "sucre_vanille": 1
   },
   "meta": {
    "four": 180,
    "cuisson": 10
   }
  },
  {
   "id": "churros",
   "nom": "Churros",
   "ing": {
    "farine": 250,
    "eau": 250,
    "beurre": 50,
    "sel": 1,
    "sucre": 15
   },
   "meta": {
    "cuisson": 2
   }
  },
  {
   "id": "bottereaux",
   "nom": "Bottereaux",
   "ing": {
    "farine": 500,
    "oeufs": 3,
    "lait": 100,
    "beurre": 100,
    "levure": 1,
    "sel": 1,
    "sucre": 100
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 2
   }
  },
  {
   "id": "gateau-yaourt",
   "nom": "Gâteau Yaourt",
   "ing": {
    "farine": 375,
    "yaourt": 1,
    "oeufs": 3,
    "huile": 52.5,
    "levure": 1,
    "sel": 1,
    "sucre": 100,
    "sucre_vanille": 1
   },
   "meta": {
    "four": 180,
    "cuisson": 35
   }
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
    "cuisson": 10
   }
  },
  {
   "id": "cake-sale-chorizo",
   "nom": "Cake salé (chorizo)",
   "ing": {
    "farine": 150,
    "oeufs": 3,
    "lait": 125,
    "huile": 100,
    "levure": 1,
    "sel": 1,
    "chorizo": 250,
    "gruyere": 100
   },
   "meta": {
    "four": 180,
    "cuisson": 45
   }
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
    "sel": 1
   },
   "meta": {
    "temp": "froide",
    "cuisson": 1
   }
  },
  {
   "id": "tortillas-de-mais",
   "nom": "Tortillas de maïs",
   "ing": {
    "mais": 250,
    "eau": 300,
    "sel": 1
   },
   "meta": {
    "temp": "tiède",
    "cuisson": 0.5
   }
  },
  {
   "id": "empanadillas",
   "nom": "Empanadillas",
   "ing": {
    "farine": 250,
    "eau": 100,
    "huile": 60,
    "sel": 1
   },
   "meta": {
    "temp": "tiède",
    "four": 180,
    "cuisson": 20
   }
  },
  {
   "id": "sauce-bechamel",
   "nom": "Sauce Béchamel",
   "ing": {
    "farine": 50,
    "lait": 500,
    "beurre": 50,
    "sel": 1
   },
   "meta": {}
  },
  {
   "id": "mayonnaise",
   "nom": "Mayonnaise",
   "ing": {
    "oeufs": 1,
    "huile": 150
   },
   "meta": {}
  },
  {
   "id": "pate-brisee",
   "nom": "Pâte brisée",
   "ing": {
    "farine": 250,
    "eau": 500,
    "beurre": 125,
    "sel": 1
   },
   "meta": {
    "four": 180,
    "cuisson": 15
   }
  },
  {
   "id": "pate-feuilletee",
   "nom": "Pâte feuilletée",
   "ing": {
    "farine": 250,
    "eau": 125,
    "beurre": 185,
    "sel": 1
   },
   "meta": {}
  },
  {
   "id": "pate-a-pizza",
   "nom": "Pâte à pizza",
   "ing": {
    "farine": 250,
    "eau": 125,
    "huile": 15,
    "levure": 1,
    "sel": 2,
    "sucre": 15
   },
   "meta": {
    "temp": "tiede",
    "four": 250,
    "cuisson": 10
   }
  }
 ]
};
