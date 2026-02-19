export interface FoodResponse {
  id: number;
  name: string;
  price: number;
  description?: string;
  imagePath?: string | null;
  ingredients: Ingredient[];
  createdAt: string; 


  available?: boolean; 
  category?: string;
  spiceLevels?: string[];

}



export interface ApiAddOn {
  id: number;
  name: string;
  price: number;
  extraCost?: number; 
  category?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  price:number;
  extraCost: number;
  selected?: boolean; 
  category?: string;    
  isAvailable?: boolean; 
}