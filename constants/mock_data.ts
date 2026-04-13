import { CoffeeShop, GoogleRoute } from "@/app/(tabs)";

export const MOCK_MORE_INFO: Record<string, any> = {
  "mock-shop-1": {
    editorialSummary: {
      text: "A high-tech workspace with industrial decor, serving precision-brewed pour-overs and artisanal pastries.",
    },
    reviews: [
      {
        authorAttribution: {
          displayName: "Alex Rivera",
          photoUri: "https://i.pravatar.cc/150?u=alex",
        },
        relativePublishTimeDescription: "2 days ago",
        rating: 5,
        text: {
          text: "Absolutely love this place! The wifi is super fast and there are power outlets at every table. Perfect for getting some laptop work done.",
        },
      },
      {
        authorAttribution: {
          displayName: "Samantha Reed",
          photoUri: "https://i.pravatar.cc/150?u=sam",
        },
        relativePublishTimeDescription: "1 week ago",
        rating: 4,
        text: {
          text: "Great coffee, but it gets a bit noisy during the lunch rush. The seasonal latte is a must-try though!",
        },
      },
    ],
  },
  "mock-shop-2": {
    editorialSummary: {
      text: "A cozy, quiet escape in the heart of Old Town, known for its traditional roasting methods.",
    },
    reviews: [
      {
        authorAttribution: {
          displayName: "Jordan Smith",
          photoUri: "https://i.pravatar.cc/150?u=jordan",
        },
        relativePublishTimeDescription: "3 hours ago",
        rating: 5,
        text: {
          text: "Very quiet and peaceful. Not many sockets for charging, but a great spot to read a book and enjoy a quiet espresso.",
        },
      },
    ],
  },
};
export const MOCK_COFFEE_SHOPS: CoffeeShop[] = [
  {
    id: "mock-shop-1",
    displayName: { text: "The Caffeine Lab" },
    formattedAddress: "123 Espresso Lane, Tech District, 94103",
    rating: 4.8,
    userRatingCount: 1250,
    freeWifi: true,
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: [
        "Monday: 7:00 AM – 7:00 PM",
        "Tuesday: 7:00 AM – 7:00 PM",
        "Wednesday: 7:00 AM – 7:00 PM",
        "Thursday: 7:00 AM – 7:00 PM",
        "Friday: 7:00 AM – 9:00 PM",
        "Saturday: 8:00 AM – 9:00 PM",
        "Sunday: 8:00 AM – 6:00 PM",
      ],
    },
    photos: [
      {
        name: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        widthPx: 1000,
        heightPx: 1000,
      },
      {
        name: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
        widthPx: 1000,
        heightPx: 1000,
      },
    ],
  },
  {
    id: "mock-shop-56",
    displayName: { text: "SB" },
    formattedAddress: "123 Espresso Lane, Tech District, 94103",
    rating: 4.8,
    userRatingCount: 1250,
    freeWifi: true,
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: [
        "Monday: 7:00 AM – 7:00 PM",
        "Tuesday: 7:00 AM – 7:00 PM",
        "Wednesday: 7:00 AM – 7:00 PM",
        "Thursday: 7:00 AM – 7:00 PM",
        "Friday: 7:00 AM – 9:00 PM",
        "Saturday: 8:00 AM – 9:00 PM",
        "Sunday: 8:00 AM – 6:00 PM",
      ],
    },
    photos: [
      {
        name: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        widthPx: 1000,
        heightPx: 1000,
      },
      {
        name: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
        widthPx: 1000,
        heightPx: 1000,
      },
    ],
  },
  {
    id: "mock-shop-2",
    displayName: { text: "Rustic Beans" },
    formattedAddress: "456 Heritage St, Old Town, 94105",
    rating: 4.2,
    userRatingCount: 840,
    freeWifi: false,
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
    },
    regularOpeningHours: {
      openNow: false,
      weekdayDescriptions: [
        "Monday: 8:00 AM – 5:00 PM",
        "Tuesday: 8:00 AM – 5:00 PM",
        "Wednesday: 8:00 AM – 5:00 PM",
        "Thursday: 8:00 AM – 5:00 PM",
        "Friday: 8:00 AM – 5:00 PM",
        "Saturday: Closed",
        "Sunday: Closed",
      ],
    },
    photos: [
      {
        name: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        widthPx: 1000,
        heightPx: 1000,
      },
    ],
  },
];

export const MOCK_ROUTE: GoogleRoute = {
  routes: [
    {
      distanceMeters: 1450,
      duration: "480s", // 8 minutes
    },
  ],
};
