export type PalletType = 'Green' | 'Cream' | 'Blue' | 'Box Sleeve' | 'Wing' | 'Glass' | 'Wood';

export interface PalletData {
  'Green': string;
  'Cream': string;
  'Blue': string;
  'Box Sleeve': string;
  'Wing': string;
  'Glass': string;
  'Wood': string;
}

export const PALLET_TYPES: PalletType[] = [
  'Green',
  'Cream',
  'Blue',
  'Box Sleeve',
  'Wing',
  'Glass',
  'Wood'
];
