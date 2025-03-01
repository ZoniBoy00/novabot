export const businesses = {
  lemonade: {
    name: "🍋 Lemonade Stand",
    description: "A simple lemonade stand to start your business empire",
    basePrice: 1000,
    baseIncome: 50,
    upgradeMultiplier: 1.5,
    cooldown: 30 * 60 * 1000, // 30 minutes
  },
  foodTruck: {
    name: "🚚 Food Truck",
    description: "A mobile food business serving delicious meals",
    basePrice: 5000,
    baseIncome: 200,
    upgradeMultiplier: 1.6,
    cooldown: 45 * 60 * 1000, // 45 minutes
  },
  cafe: {
    name: "☕ Café",
    description: "A cozy café serving coffee and pastries",
    basePrice: 15000,
    baseIncome: 500,
    upgradeMultiplier: 1.7,
    cooldown: 60 * 60 * 1000, // 1 hour
  },
  restaurant: {
    name: "🍽️ Restaurant",
    description: "A full-service restaurant with loyal customers",
    basePrice: 50000,
    baseIncome: 1500,
    upgradeMultiplier: 1.8,
    cooldown: 2 * 60 * 60 * 1000, // 2 hours
  },
  mall: {
    name: "🏬 Shopping Mall",
    description: "A large shopping center with multiple stores",
    basePrice: 200000,
    baseIncome: 5000,
    upgradeMultiplier: 2.0,
    cooldown: 4 * 60 * 60 * 1000, // 4 hours
  },
}

export function calculateUpgradeCost(business, currentLevel) {
  const basePrice = businesses[business].basePrice
  const multiplier = businesses[business].upgradeMultiplier
  return Math.floor(basePrice * Math.pow(multiplier, currentLevel - 1))
}

export function calculateIncome(business, level) {
  const baseIncome = businesses[business].baseIncome
  return Math.floor(baseIncome * Math.pow(1.2, level - 1))
}

