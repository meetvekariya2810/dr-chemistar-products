export type Language = 'en' | 'hi' | 'gu';

export type ProductCategory = 
  | 'Insecticide' 
  | 'Fungicide' 
  | 'Herbicide' 
  | 'PGR' 
  | 'Fertilizer';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  commonName: string;
  activeIngredient: string;
  formulation: string;
  dose: string;
  packing: string[];
  targetPest?: string[];
  targetDisease?: string[];
  targetCrops: string[];
  modeOfAction: string;
  benefits: string[];
  safetyInstructions?: string;
  storageInstructions?: string;
  badge?: string;
  imageColor?: string;
  popular?: boolean;
  pdfPage?: number;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
}

export interface CropSolution {
  id: string;
  name: string;
  nameHi: string;
  nameGu: string;
  category: 'Cereals' | 'Cash Crops' | 'Vegetables' | 'Fruits' | 'Oilseeds' | 'Pulses';
  image: string;
  majorPests: string[];
  majorDiseases: string[];
  recommendedProductIds: string[];
  spraySchedule: {
    stage: string;
    days: string;
    focus: string;
    products: string[];
  }[];
}

export interface DiseasePestItem {
  id: string;
  type: 'pest' | 'disease';
  name: string;
  nameHi: string;
  nameGu: string;
  crops: string[];
  symptoms: string;
  cause: string;
  prevention: string;
  recommendedProductIds: string[];
}

export interface DealerRequest {
  id: string;
  firmName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gstNumber: string;
  licenseNumber: string;
  status: 'Pending' | 'Approved' | 'In Review';
  date: string;
}

export interface ProductEnquiry {
  id: string;
  name: string;
  phone: string;
  userType: 'Farmer' | 'Dealer' | 'Distributor';
  productName?: string;
  message: string;
  city: string;
  date: string;
}
