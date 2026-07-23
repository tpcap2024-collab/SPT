import React, { useState } from 'react';
import {
  ChevronDown,
  ScanLine,
  Plus,
  X,
  PartyPopper,
} from 'lucide-react';

import { Header } from './components/Header';
import { Keypad } from './components/Keypad';
import { PalletRow } from './components/PalletRow';
import { Scanner } from './components/Scanner';

import {
  PalletData,
  PalletType,
  PALLET_TYPES,
} from './types';

import { savePalletData } from './lib/sheets';

const ROUTES = [
  'Route 01 - North',
  'Route 02 - South',
  'Route 03 - East',
  'Route 04 - West',
  'Route 05 - Central',
];

const INITIAL_PALLETS: PalletData = {
  Green: '',
  Cream: '',
  Blue: '',
  'Box Sleeve': '',
  Wing: '',
  Glass: '',
  Wood: '',
  'Pallet return': '',
};

interface SubPallet {
  id: string;
  name: string;
  type: PalletType;
  quantity: string;
}

export default function App() {
  const [route, setRoute] = useState<string>('');

  const [pallets, setPallets] =
    useState<PalletData>({
      ...INITIAL_PALLETS,
    });

  const [focusedField, setFocusedField] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveSuccess, setSaveSuccess] =
    useState(false);

  const [isScanning, setIsScanning] =
    useState(false);

  const [subPallets, setSubPallets] =
    useState<SubPallet[]>([]);

  const [isSubModalOpen, setIsSubModalOpen] =
    useState(false);

  const [subDraftName, setSubDraftName] =
    useState('');

  const [subDraftType, setSubDraftType] =
    useState<PalletType | ''>('');

  const [
    subDraftQuantity,
    setSubDraftQuantity,
  ] = useState('');

  const handleSettingsClick = () => {
    alert(
      'ระบบเชื่อมต่อ Google Sheet ผ่าน Render Server แล้ว'
    );
  };

  const handleKeypadPress = (
    key: string
  ) => {
    if (!focusedField) {
      return;
    }

    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity(
        (previousValue) => {
          if (previousValue.length >= 4) {
            return previousValue;
          }

          if (
            previousValue === '' ||
            previousValue === '0'
          ) {
            return key;
          }

          return previousValue + key;
        }
      );

      return;
    }

    const palletType =
      focusedField as PalletType;

    if (
      !PALLET_TYPES.includes(palletType)
    ) {
      return;
    }

    setPallets((previousPallets) => {
      const currentValue =
        previousPallets[palletType];

      if (currentValue.length >= 4) {
        return previousPallets;
      }

      const newValue =
        currentValue === '' ||
        currentValue === '0'
          ? key
          : currentValue + key;

      return {
        ...previousPallets,
        newValue,
      };
    });
  };

  const handleKeypadDelete = () => {
    if (!focusedField) {
      return;
    }

    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity(
        (previousValue) =>
          previousValue.slice(0, -1)
      );

      return;
    }

    const palletType =
      focusedField as PalletType;

    if (
      !PALLET_TYPES.includes(palletType)
    ) {
      return;
    }

    setPallets((previousPallets) => {
      const currentValue =
        previousPallets[palletType];

      return {
        ...previousPallets,
        currentValue.slice(0, -1),
      };
    });
  };

  const handleKeypadConfirm = () => {
    if (!focusedField) {
      return;
    }

    if (focusedField === 'sub-quantity') {
      setFocusedField(null);
      return;
    }

    const currentIndex =
      PALLET_TYPES.indexOf(
        focusedField as PalletType
      );

    if (
      currentIndex >= 0 &&
      currentIndex <
        PALLET_TYPES.length - 1
    ) {
      setFocusedField(
        PALLET_TYPES[currentIndex + 1]
      );
    } else {
      setFocusedField(null);
    }
  };

  const handleIncrement = (
    type: PalletType
  ) => {
    setPallets((previousPallets) => {
      const currentValue =
        Number.parseInt(
          previousPallets[type] || '0',
          10
        );

      const newValue = Math.min(
        currentValue + 1,
        9999
      );

      return {
        ...previousPallets,
        newValue.toString(),
      };
    });
  };

  const handleDecrement = (
    type: PalletType
  ) => {
    setPallets((previousPallets) => {
      const currentValue =
        Number.parseInt(
          previousPallets[type] || '0',
          10
        );

      const newValue = Math.max(
        currentValue - 1,
        0
      );

      return {
        ...previousPallets,
        newValue.toString(),
      };
    });
  };

  const handleSave = async () => {
    if (!route) {
      alert(
        'กรุณาเลือก Route ก่อนบันทึก'
      );
      return;
    }

    if (isSaving) {
      return;
    }

    const palletTotal =
      PALLET_TYPES.reduce(
        (total, type) => {
          return (
            total +
            Number(pallets[type] || 0)
          );
        },
        0
      );

    const subPalletTotal =
      subPallets.reduce(
        (total, item) => {
          return (
            total +
            Number(item.quantity || 0)
          );
        },
        0
      );

    if (
      palletTotal === 0 &&
      subPalletTotal === 0
    ) {
      alert(
        'กรุณาระบุจำนวนพาเลทอย่างน้อย 1 รายการ'
      );
      return;
    }

    setIsSaving(true);

    try {
      const subPalletsText =
        subPallets
          .map((item) => {
            return `${item.name} (${item.type}: ${item.quantity})`;
          })
          .join('\n');

      await savePalletData({
        route,
        green: Number(
          pallets.Green || 0
        ),
        cream: Number(
          pallets.Cream || 0
        ),
        blue: Number(
          pallets.Blue || 0
        ),
        boxSleeve: Number(
          pallets['Box Sleeve'] || 0
        ),
        wing: Number(
          pallets.Wing || 0
        ),
        glass: Number(
          pallets.Glass || 0
        ),
        wood: Number(
          pallets.Wood || 0
        ),
        sub: subPalletsText,
        palletReturn: Number(
          pallets['Pallet return'] || 0
        ),
      });

      setFocusedField(null);
      setSaveSuccess(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';

      console.error(
        'Save pallet data failed:',
        error
      );

      alert(
        `ไม่สามารถบันทึกข้อมูลได้: ${message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSaveSuccess(false);
    setRoute('');

    setPallets({
      ...INITIAL_PALLETS,
    });

    setSubPallets([]);
    setSubDraftName('');
    setSubDraftType('');
    setSubDraftQuantity('');
    setFocusedField(null);
  };

  const handleAddSubPallet = () => {
    const trimmedName =
      subDraftName.trim();

    const quantity = Number(
      subDraftQuantity || 0
    );

    if (!trimmedName) {
      alert('กรุณาระบุชื่อ Sub');
      return;
    }

    if (!subDraftType) {
      alert(
        'กรุณาเลือกประเภทพาเลท'
      );
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 9999
    ) {
      alert(
        'กรุณาระบุจำนวนระหว่าง 1 ถึง 9999'
      );
      return;
    }

    const id =
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID ===
        'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const newSubPallet: SubPallet = {
      id,
      name: trimmedName,
      type: subDraftType,
      quantity: quantity.toString(),
    };

    setSubPallets(
      (previousItems) => [
        ...previousItems,
        newSubPallet,
      ]
    );

    setSubDraftName('');
    setSubDraftType('');
    setSubDraftQuantity('');
    setFocusedField(null);
    setIsSubModalOpen(false);
  };

  const handleRemoveSubPallet = (
    subPalletId: string
  ) => {
    setSubPallets(
      (previousItems) =>
        previousItems.filter(
          (item) =>
            item.id !== subPalletId
        )
    );
  };

  const handleCloseSubModal = () => {
    setIsSubModalOpen(false);
    setFocusedField(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 select-none relative">
      <Header
        onSettingsClick={
          handleSettingsClick
        }
      />

      <main
        className={`flex-1 px-4 max-w-3xl mx-auto w-full flex flex-col gap-4 transition-all duration-300 ${
          focusedField
            ? 'pb-[450px]'
            : 'pb-28'
        }`}
      >
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">
            Route Selection
            <span className="text-red-500 ml-2">
              จำเป็น
            </span>
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={route}
                onChange={(event) =>
                  setRoute(
                    event.target.value
                  )
                }
                className="w-full appearance-none bg-slate-50 border-2 border-blue-500 rounded-xl p-3 sm:p-4 pr-10 sm:pr-12 text-lg sm:text-xl font-bold 
