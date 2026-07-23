/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  const [pallets, setPallets] = useState<PalletData>({
    ...INITIAL_PALLETS,
  });

  const [focusedField, setFocusedField] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

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

  const [subDraftQuantity, setSubDraftQuantity] =
    useState('');

  const handleSettingsClick = () => {
    alert(
      'ระบบเชื่อมต่อ Google Sheet ผ่าน Render Server แล้ว\n' +
        'ผู้ใช้งานไม่จำเป็นต้องกำหนด Spreadsheet ID'
    );
  };

  const handleKeypadPress = (key: string) => {
    if (!focusedField) return;

    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity((previousValue) => {
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
      });

      return;
    }

    const palletType =
      focusedField as PalletType;

    if (!PALLET_TYPES.includes(palletType)) {
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
    if (!focusedField) return;

    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity((previousValue) =>
        previousValue.slice(0, -1)
      );

      return;
    }

    const palletType =
      focusedField as PalletType;

    if (!PALLET_TYPES.includes(palletType)) {
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
    if (!focusedField) return;

    if (focusedField === 'sub-quantity') {
      setFocusedField(null);
      return;
    }

    const currentIndex = PALLET_TYPES.indexOf(
      focusedField as PalletType
    );

    if (
      currentIndex >= 0 &&
      currentIndex < PALLET_TYPES.length - 1
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
      const currentValue = Number.parseInt(
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
      const currentValue = Number.parseInt(
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
      alert('กรุณาเลือก Route ก่อนบันทึก');
      return;
    }

    if (isSaving) return;

    const palletTotal = PALLET_TYPES.reduce(
      (total, type) => {
        return (
          total + Number(pallets[type] || 0)
        );
      },
      0
    );

    const subPalletTotal = subPallets.reduce(
      (total, item) => {
        return (
          total + Number(item.quantity || 0)
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
      const subPalletsText = subPallets
        .map(
          (item) =>
            `${item.name} (${item.type}: ${item.quantity})`
        )
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
      alert('กรุณาเลือกประเภทพาเลท');
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
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const newSubPallet: SubPallet = {
      id,
      name: trimmedName,
      type: subDraftType,
      quantity: quantity.toString(),
    };

    setSubPallets((previousItems) => [
      ...previousItems,
      newSubPallet,
    ]);

    setSubDraftName('');
    setSubDraftType('');
    setSubDraftQuantity('');
    setFocusedField(null);
    setIsSubModalOpen(false);
  };

  const handleRemoveSubPallet = (
    subPalletId: string
  ) => {
    setSubPallets((previousItems) =>
      previousItems.filter(
        (item) => item.id !== subPalletId
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
        onSettingsClick={handleSettingsClick}
      />

      <main
        className={`flex-1 px-4 max-w-3xl mx-auto w-full flex flex-col gap-4 transition-all duration-300 ${
          focusedField
            ? 'pb-[450px]'
            : 'pb-28'
        }`}
      >
        {/* Route Selection */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">
            Route Selection{' '}
            <span className="text-red-500">
              *
            </span>
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={route}
                onChange={(event) =>
                  setRoute(event.target.value)
                }
                className="w-full appearance-none bg-slate-50 border-2 border-blue-500 rounded-xl p-3 sm:p-4 pr-10 sm:pr-12 text-lg sm:text-xl font-bold text-slate-800 focus:outline-none transition-colors"
              >
                <option
                  value=""
                  disabled
                  className="font-sans text-lg"
                >
                  เลือก Route
                </option>

                {ROUTES.map((routeName) => (
                  <option
                    key={routeName}
                    value={routeName}
                  >
                    {routeName}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500">
                <ChevronDown size={24} />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsScanning(true)
              }
              aria-label="สแกน Route"
              className="bg-blue-100 text-blue-700 w-[60px] h-[60px] rounded-xl border-2 border-blue-200 active:bg-blue-200 flex items-center justify-center shrink-0 transition-colors"
            >
              <ScanLine size={28} />
            </button>
          </div>
        </div>

        {/* Main Pallet List */}
        <div className="bg-white flex-1 p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-4 tracking-wide">
            Quantity Entry
          </label>

          <div className="flex-1 flex flex-col overflow-y-auto">
            {PALLET_TYPES.map((type) => (
              <PalletRow
                key={type}
                type={type}
                value={pallets[type]}
                isFocused={
                  focusedField === type
                }
                onFocus={() =>
                  setFocusedField(type)
                }
                onIncrement={() =>
                  handleIncrement(type)
                }
                onDecrement={() =>
                  handleDecrement(type)
                }
              />
            ))}
          </div>
        </div>

        {/* Sub Pallet List */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-700 font-bold text-sm uppercase tracking-wide">
              พาเลทเปล่าส่ง Sub
            </h2>

            <button
              type="button"
              onClick={() => {
                setFocusedField(null);
                setIsSubModalOpen(true);
              }}
              className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold text-sm flex items-center gap-1 active:bg-blue-100 transition-colors"
            >
              <Plus
                size={16}
                strokeWidth={3}
              />
              เพิ่ม
            </button>
          </div>

          {subPallets.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs font-semibold">
                ไม่มีรายการพาเลทส่ง Sub
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subPallets.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-xl gap-2"
                >
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-sm text-slate-600">
                      Sub:{' '}
                      <span className="text-blue-700">
                        {item.name}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveSubPallet(
                          item.id
                        )
                      }
                      aria-label={`ลบ ${item.name}`}
                      className="text-red-400 p-1 active:bg-red-50 rounded-lg transition-colors"
                    >
                      <X
                        size={16}
                        strokeWidth={3}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 font-bold text-slate-700">
                      <span className="w-3 h-3 rounded-full bg-slate-400" />
                      {item.type}
                    </div>

                    <span className="text-2xl font-black text-blue-800 w-12 text-right">
                      {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Save Button */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-200 px-6 py-4 flex items-center transition-transform duration-300 ${
          focusedField
            ? 'translate-y-full'
            : 'translate-y-0'
        } z-40`}
      >
        <div className="max-w-3xl mx-auto w-full h-full">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-full text-2xl font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-4 ${
              isSaving
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-700 text-white active:bg-blue-900'
            }`}
          >
            {isSaving ? (
              <span className="animate-pulse">
                กำลังบันทึก...
              </span>
            ) : (
              <>
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>

                SAVE
              </>
            )}
          </button>
        </div>
      </div>

      {/* Numeric Keypad */}
      <Keypad
        isVisible={Boolean(focusedField)}
        onKeyPress={handleKeypadPress}
        onDelete={handleKeypadDelete}
        onConfirm={handleKeypadConfirm}
        onHide={() =>
          setFocusedField(null)
        }
        title={
          focusedField === 'sub-quantity'
            ? 'SUB PALLET'
            : focusedField
              ? `${focusedField.toUpperCase()} PALLET`
              : ''
        }
        currentValue={
          focusedField === 'sub-quantity'
            ? subDraftQuantity
            : focusedField &&
                PALLET_TYPES.includes(
                  focusedField as PalletType
                )
              ? pallets[
                  focusedField as PalletType
                ]
              : ''
        }
      />

      {/* Overlay behind Keypad */}
      {focusedField && !isSubModalOpen && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() =>
            setFocusedField(null)
          }
          aria-hidden="true"
        />
      )}

      {/* Add Sub Pallet Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                เพิ่มพาเลทเปล่าส่ง Sub
              </h3>

              <button
                type="button"
                onClick={handleCloseSubModal}
                aria-label="ปิด"
                className="text-slate-400 p-2 active:bg-slate-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  ชื่อ Sub / รหัส{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={subDraftName}
                  onChange={(event) =>
                    setSubDraftName(
                      event.target.value
                    )
                  }
                  placeholder="ระบุชื่อ Sub"
                  maxLength={100}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  ประเภทพาเลท{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={subDraftType}
                  onChange={(event) =>
                    setSubDraftType(
                      event.target
                        .value as PalletType
                    )
                  }
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option
                    value=""
                    disabled
                  >
                    เลือกประเภท
                  </option>

                  {PALLET_TYPES.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  จำนวน{' '}
                  <
