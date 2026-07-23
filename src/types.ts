export type PalletType =
  | 'Green'
  | 'Cream'
  | 'Blue'
  | 'Box Sleeve'
  | 'Wing'
  | 'Glass'
  | 'Wood'
  | 'Pallet return';

export type PalletData = Record<PalletType, string>;

export const PALLET_TYPES: PalletType[] = [
  'Green',
  'Cream',
  'Blue',
  'Box Sleeve',
  'Wing',
  'Glass',
  'Wood',
  'Pallet return',
];
`
