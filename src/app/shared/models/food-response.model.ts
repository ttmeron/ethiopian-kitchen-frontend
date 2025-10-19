export interface FoodResponse {
  id: number;
  name: string;
  price: number;
  description?: string;
  imagePath?: string | null;
  ingredients: Ingredient[];
  createdAt: string; // example: "2023-07-15T14:30:00"


  available?: boolean; 
  category?: string;
  spiceLevels?: string[];

}



export interface ApiAddOn {
  id: number;
  name: string;
  price: number;
  extraCost?: number; // Optional in API response
  category?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  price:number;
  extraCost: number;
  selected?: boolean; // Add optional selected property
  category?: string;      // For categorization (sauces, toppings, etc.)
  isAvailable?: boolean; 
}