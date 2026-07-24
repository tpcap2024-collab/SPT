import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ScanLine,
  Plus,
  X,
  PartyPopper,
  RefreshCw,
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

import {
  getRoutes,
  savePalletData,
} from './lib/sheets';

const INITIAL_PALLETS: PalletData = {
  Green: '',
  Cream: '',
  Blue: '',
  'Box Sleeve': '',
  Wing: '',
  Glass: '',
  Wood: '',
};

interface SubPallet {
  id: string;
  name: string;
  type: PalletType;
  quantity: string;
}

export default function App() {
  const [route, setRoute] = useState<string>('');
  const [routes, setRoutes] = useState<string[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [routeError, setRouteError] = useState('');

  const [pallets, setPallets] = useState<PalletData>({
    ...INITIAL_PALLETS,
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [subPallets, setSubPallets] = useState<SubPallet[]>([]);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subDraftName, setSubDraftName] = useState('');
  const [subDraftType, setSubDraftType] = useState<PalletType | ''>('');
  const [subDraftQuantity, setSubDraftQuantity] = useState('');

  const loadRoutes = async () => {
    setIsLoadingRoutes(true);
    setRouteError('');

    try {
      const result = await getRoutes();
      setRoutes(result.routes);

      if (
        route &&
        !result.routes.includes(route)
      ) {
        setRoute('');
      }

      if (result.routes.length === 0) {
        setRouteError('ไม่พบรายการ Route ใน Google Sheet');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหลดรายการ Route ได้';

      console.error('Load routes failed:', error);
      setRoutes([]);
      setRoute('');
      setRouteError(message);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  useEffect(() => {
    void loadRoutes();
  }, []);

  const handleSettingsClick = () => {
    alert('ระบบเชื่อมต่อ Google Sheet ผ่าน Render Server แล้ว');
  };

  const handleKeypadPress = (key: string) => {
    if (!focusedField) {
      return;
    }

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

    const palletType = focusedField as PalletType;

    if (!PALLET_TYPES.includes(palletType)) {
      return;
    }

    setPallets((previousPallets) => {
      const currentValue = previousPallets[palletType];

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
        [palletType]: newValue,
      };
    });
  };

  const handleKeypadDelete = () => {
    if (!focusedField) {
      return;
    }

    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity((previousValue) =>
        previousValue.slice(0, -1)
      );
      return;
    }

    const palletType = focusedField as PalletType;

    if (!PALLET_TYPES.includes(palletType)) {
      return;
    }

    setPallets((previousPallets) => {
      const currentValue = previousPallets[palletType];
      const newValue = currentValue.slice(0, -1);

      return {
        ...previousPallets,
        [palletType]: newValue,
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

    const currentIndex = PALLET_TYPES.indexOf(
      focusedField as PalletType
    );

    if (
      currentIndex >= 0 &&
      currentIndex < PALLET_TYPES.length - 1
    ) {
      setFocusedField(PALLET_TYPES[currentIndex + 1]);
    } else {
      setFocusedField(null);
    }
  };

  const handleIncrement = (type: PalletType) => {
    setPallets((previousPallets) => {
      const currentValue = Number.parseInt(
        previousPallets[type] || '0',
        10
      );
      const newValue = Math.min(currentValue + 1, 9999);

      return {
        ...previousPallets,
        [type]: newValue.toString(),
      };
    });
  };

  const handleDecrement = (type: PalletType) => {
    setPallets((previousPallets) => {
      const currentValue = Number.parseInt(
        previousPallets[type] || '0',
        10
      );
      const newValue = Math.max(currentValue - 1, 0);

      return {
        ...previousPallets,
        [type]: newValue.toString(),
      };
    });
  };

  const handleSave = async () => {
    if (!route) {
      alert('กรุณาเลือก Route ก่อนบันทึก');
      return;
    }

    if (!routes.includes(route)) {
      alert('Route ที่เลือกไม่มีอยู่ในรายการ กรุณาโหลด Route ใหม่');
      return;
    }

    if (isSaving) {
      return;
    }

    const mainPalletTotal = PALLET_TYPES.reduce(
      (total, type) => total + Number(pallets[type] || 0),
      0
    );

    const subPalletTotal = subPallets.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

    if (
      mainPalletTotal === 0 &&
      subPalletTotal === 0
    ) {
      alert('กรุณาระบุจำนวนพาเลทอย่างน้อย 1 รายการ');
      return;
    }

    setIsSaving(true);

    try {
      const subPalletsText = subPallets
        .map((item) =>
          `${item.name} (${item.type}: ${item.quantity})`
        )
        .join('\n');

      const returnTotals: Record<PalletType, number> = {
        Green: 0,
        Cream: 0,
        Blue: 0,
        'Box Sleeve': 0,
        Wing: 0,
        Glass: 0,
        Wood: 0,
      };

      subPallets.forEach((item) => {
        const quantity = Number(item.quantity || 0);
        returnTotals[item.type] =
          returnTotals[item.type] + quantity;
      });

      const returnTotal =
        returnTotals.Green +
        returnTotals.Cream +
        returnTotals.Blue +
        returnTotals['Box Sleeve'] +
        returnTotals.Wing +
        returnTotals.Glass +
        returnTotals.Wood;

      await savePalletData({
        route: route.trim(),
        green: Number(pallets.Green || 0),
        cream: Number(pallets.Cream || 0),
        blue: Number(pallets.Blue || 0),
        boxSleeve: Number(pallets['Box Sleeve'] || 0),
        wing: Number(pallets.Wing || 0),
        glass: Number(pallets.Glass || 0),
        wood: Number(pallets.Wood || 0),
        sub: subPalletsText,
        returnGreen: returnTotals.Green,
        returnCream: returnTotals.Cream,
        returnBlue: returnTotals.Blue,
        returnBoxSleeve: returnTotals['Box Sleeve'],
        returnWing: returnTotals.Wing,
        returnGlass: returnTotals.Glass,
        returnWood: returnTotals.Wood,
        returnTotal,
      });

      setFocusedField(null);
      setSaveSuccess(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';

      console.error('Save pallet data failed:', error);
      alert(`ไม่สามารถบันทึกข้อมูลได้: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSaveSuccess(false);
    setRoute('');
    setPallets({ ...INITIAL_PALLETS });
    setSubPallets([]);
    setSubDraftName('');
    setSubDraftType('');
    setSubDraftQuantity('');
    setFocusedField(null);
  };

  const handleAddSubPallet = () => {
    const trimmedName = subDraftName.trim();
    const quantity = Number(subDraftQuantity || 0);

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
      alert('กรุณาระบุจำนวนระหว่าง 1 ถึง 9999');
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

  const handleRemoveSubPallet = (subPalletId: string) => {
    setSubPallets((previousItems) =>
      previousItems.filter((item) => item.id !== subPalletId)
    );
  };

  const handleCloseSubModal = () => {
    setIsSubModalOpen(false);
    setFocusedField(null);
  };

  const handleScannedRoute = (scannedRoute: string) => {
    const normalizedRoute = scannedRoute.trim();

    if (!routes.includes(normalizedRoute)) {
      alert('ไม่พบ Route ที่สแกนในแท็บ Route');
      setIsScanning(false);
      return;
    }

    setRoute(normalizedRoute);
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 select-none relative">
      <Header onSettingsClick={handleSettingsClick} />

      <main
        className={`flex-1 px-4 max-w-3xl mx-auto w-full flex flex-col gap-4 transition-all duration-300 ${
          focusedField ? 'pb-[450px]' : 'pb-28'
        }`}
      >
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Route Selection
              <span className="text-red-500 ml-2">จำเป็น</span>
            </label>

            <button
              type="button"
              onClick={() => void loadRoutes()}
              disabled={isLoadingRoutes}
              className="text-blue-600 text-xs font-bold flex items-center gap-1 disabled:text-slate-400"
            >
              <RefreshCw
                size={15}
                className={isLoadingRoutes ? 'animate-spin' : ''}
              />
              โหลดใหม่
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={route}
                onChange={(event) => setRoute(event.target.value)}
                disabled={isLoadingRoutes || routes.length === 0}
                className="w-full appearance-none bg-slate-50 border-2 border-blue-500 rounded-xl p-3 sm:p-4 pr-10 sm:pr-12 text-lg sm:text-xl font-bold text-slate-800 focus:outline-none transition-colors disabled:border-slate-300 disabled:text-slate-400"
              >
                <option value="" disabled>
                  {isLoadingRoutes
                    ? 'กำลังโหลด Route...'
                    : routes.length === 0
                      ? 'ไม่พบ Route'
                      : 'เลือก Route'}
                </option>

                {routes.map((routeName) => (
                  <option key={routeName} value={routeName}>
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
              onClick={() => setIsScanning(true)}
              disabled={isLoadingRoutes || routes.length === 0}
              aria-label="สแกน Route"
              className="bg-blue-100 text-blue-700 w-[60px] h-[60px] rounded-xl border-2 border-blue-200 active:bg-blue-200 flex items-center justify-center shrink-0 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
            >
              <ScanLine size={28} />
            </button>
          </div>

          {routeError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <p className="text-red-700 text-sm font-semibold">
                {routeError}
              </p>

              <button
                type="button"
                onClick={() => void loadRoutes()}
                className="shrink-0 text-red-700 bg-red-100 px-3 py-2 rounded-lg text-xs font-bold"
              >
                ลองใหม่
              </button>
            </div>
          )}
        </div>

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
                isFocused={focusedField === type}
                onFocus={() => setFocusedField(type)}
                onIncrement={() => handleIncrement(type)}
                onDecrement={() => handleDecrement(type)}
              />
            ))}
          </div>
        </div>

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
              <Plus size={16} strokeWidth={3} />
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
                      <span className="text-blue-700">{item.name}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubPallet(item.id)}
                      aria-label={`ลบ ${item.name}`}
                      className="text-red-400 p-1 active:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} strokeWidth={3} />
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

      <div
        className={`fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-200 px-6 py-4 flex items-center transition-transform duration-300 ${
          focusedField ? 'translate-y-full' : 'translate-y-0'
        } z-40`}
      >
        <div className="max-w-3xl mx-auto w-full h-full">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoadingRoutes || routes.length === 0}
            className={`w-full h-full text-2xl font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-4 ${
              isSaving || isLoadingRoutes || routes.length === 0
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-700 text-white active:bg-blue-900'
            }`}
          >
            {isSaving ? (
              <span className="animate-pulse">กำลังบันทึก...</span>
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

      <Keypad
        isVisible={Boolean(focusedField)}
        onKeyPress={handleKeypadPress}
        onDelete={handleKeypadDelete}
        onConfirm={handleKeypadConfirm}
        onHide={() => setFocusedField(null)}
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
                PALLET_TYPES.includes(focusedField as PalletType)
              ? pallets[focusedField as PalletType]
              : ''
        }
      />

      {focusedField && !isSubModalOpen && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setFocusedField(null)}
          aria-hidden="true"
        />
      )}

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
                  ชื่อ Sub หรือรหัส
                  <span className="text-red-500 ml-2">จำเป็น</span>
                </label>

                <input
                  type="text"
                  value={subDraftName}
                  onChange={(event) => setSubDraftName(event.target.value)}
                  placeholder="ระบุชื่อ Sub"
                  maxLength={100}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  ประเภทพาเลท
                  <span className="text-red-500 ml-2">จำเป็น</span>
                </label>

                <select
                  value={subDraftType}
                  onChange={(event) =>
                    setSubDraftType(event.target.value as PalletType)
                  }
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="" disabled>
                    เลือกประเภท
                  </option>

                  {PALLET_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  จำนวน
                  <span className="text-red-500 ml-2">จำเป็น</span>
                </label>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setFocusedField('sub-quantity')}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      setFocusedField('sub-quantity');
                    }
                  }}
                  className={`w-full h-16 border-2 rounded-xl flex items-center justify-center text-3xl font-black transition-colors ${
                    focusedField === 'sub-quantity'
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  {subDraftQuantity || '0'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSubPallet}
                className="w-full h-14 mt-2 bg-blue-600 text-white rounded-xl font-bold text-lg active:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
              >
                เพิ่มรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-75 duration-500 ease-out">
            <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
              <PartyPopper size={48} strokeWidth={2.5} />
            </div>

            <h2 className="text-3xl font-black text-slate-800 mb-2">
              บันทึกสำเร็จ
            </h2>

            <p className="text-slate-500 font-medium mb-8">
              ข้อมูลพาเลทถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว
            </p>

            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full bg-green-500 text-white font-bold text-xl py-4 rounded-xl active:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30"
            >
              ดำเนินการต่อ
            </button>
          </div>
        </div>
      )}

      {isScanning && (
        <Scanner
          onScan={handleScannedRoute}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  );
}
