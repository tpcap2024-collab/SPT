/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronDown, ScanLine, Plus, X, PartyPopper } from 'lucide-react';
import { Header } from './components/Header';
import { Keypad } from './components/Keypad';
import { PalletRow } from './components/PalletRow';
import { Scanner } from './components/Scanner';
import { PalletData, PalletType, PALLET_TYPES } from './types';

import { SettingsModal } from './components/SettingsModal';
import { appendToSheet } from './lib/sheets';
import { getAccessToken } from './lib/firebase';

const ROUTES = [
  'Route 01 - North',
  'Route 02 - South',
  'Route 03 - East',
  'Route 04 - West',
  'Route 05 - Central'
];

export default function App() {
  const [route, setRoute] = useState<string>('');
  const [pallets, setPallets] = useState<PalletData>({
    'Green': '',
    'Cream': '',
    'Blue': '',
    'Box Sleeve': '',
    'Wing': '',
    'Glass': '',
    'Wood': ''
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Sub pallets state
  const [subPallets, setSubPallets] = useState<Array<{id: string, name: string, type: string, quantity: string}>>([]);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subDraftName, setSubDraftName] = useState('');
  const [subDraftType, setSubDraftType] = useState('');
  const [subDraftQuantity, setSubDraftQuantity] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem('spreadsheetId') || '');

  useEffect(() => {
    localStorage.setItem('spreadsheetId', spreadsheetId);
  }, [spreadsheetId]);

  // Prevent default keyboard from showing on inputs if any were used,
  // but we are using divs as buttons so it shouldn't be an issue.

  const handleKeypadPress = (key: string) => {
    if (!focusedField) return;
    
    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity(prev => {
        if (prev.length >= 4) return prev;
        return prev === '0' || prev === '' ? key : prev + key;
      });
      return;
    }
    
    setPallets(prev => {
      const currentValue = prev[focusedField as PalletType];
      // Limit to 4 digits to prevent overflow
      if (currentValue.length >= 4) return prev;
      // Prevent leading zeros if not followed by anything else (or just allow it and parse later)
      const newValue = currentValue === '0' || currentValue === '' ? key : currentValue + key;
      return { ...prev, [focusedField as PalletType]: newValue };
    });
  };

  const handleKeypadDelete = () => {
    if (!focusedField) return;
    
    if (focusedField === 'sub-quantity') {
      setSubDraftQuantity(prev => prev.slice(0, -1));
      return;
    }
    
    setPallets(prev => {
      const currentValue = prev[focusedField as PalletType];
      return { ...prev, [focusedField as PalletType]: currentValue.slice(0, -1) };
    });
  };

  const handleKeypadConfirm = () => {
    if (!focusedField) return;
    
    if (focusedField === 'sub-quantity') {
      setFocusedField(null);
      return;
    }
    
    const currentIndex = PALLET_TYPES.indexOf(focusedField as PalletType);
    if (currentIndex < PALLET_TYPES.length - 1) {
      setFocusedField(PALLET_TYPES[currentIndex + 1]);
    } else {
      setFocusedField(null);
    }
  };

  const handleIncrement = (type: PalletType) => {
    setPallets(prev => {
      const currentVal = parseInt(prev[type] || '0', 10);
      return { ...prev, [type]: Math.min(currentVal + 1, 9999).toString() };
    });
  };

  const handleDecrement = (type: PalletType) => {
    setPallets(prev => {
      const currentVal = parseInt(prev[type] || '0', 10);
      return { ...prev, [type]: Math.max(currentVal - 1, 0).toString() };
    });
  };

  const handleSave = async () => {
    if (!route) {
      alert('กรุณาเลือก Route ก่อนบันทึก');
      return;
    }

    if (!spreadsheetId) {
      alert('กรุณาตั้งค่า Google Sheet ID ก่อนบันทึก');
      setIsSettingsOpen(true);
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    try {
      const timestamp = new Date().toLocaleString('th-TH');
      
      let subPalletsStr = '';
      if (subPallets.length > 0) {
        subPalletsStr = subPallets.map(sp => `${sp.name} (${sp.type}: ${sp.quantity})`).join('\n');
      }

      // Format: Timestamp, Route, Green, Cream, Blue, Box Sleeve, Wing, Glass, Wood, Sub Pallets
      const rowData = [
        timestamp,
        route,
        pallets['Green'] || '0',
        pallets['Cream'] || '0',
        pallets['Blue'] || '0',
        pallets['Box Sleeve'] || '0',
        pallets['Wing'] || '0',
        pallets['Glass'] || '0',
        pallets['Wood'] || '0',
        subPalletsStr
      ];

      await appendToSheet(spreadsheetId, 'Sheet1', [rowData]);
      
      setSaveSuccess(true);
      setFocusedField(null);
    } catch (error: any) {
      alert(`ไม่สามารถบันทึกข้อมูลได้: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSaveSuccess(false);
    setRoute('');
    setPallets({
      'Green': '',
      'Cream': '',
      'Blue': '',
      'Box Sleeve': '',
      'Wing': '',
      'Glass': '',
      'Wood': ''
    });
    setSubPallets([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 select-none relative">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          spreadsheetId={spreadsheetId}
          onSpreadsheetIdChange={setSpreadsheetId}
        />
      )}

      <main className={`flex-1 px-4 max-w-3xl mx-auto w-full flex flex-col gap-4 transition-all duration-300 ${focusedField ? 'pb-[450px]' : 'pb-28'}`}>
        
        {/* Form Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">
            Route Selection <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full appearance-none bg-slate-50 border-2 border-blue-500 rounded-xl p-3 sm:p-4 pr-10 sm:pr-12 text-lg sm:text-xl font-bold text-slate-800 focus:outline-none transition-colors"
              >
                <option value="" disabled className="font-sans text-lg">เลือก Route</option>
                {ROUTES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500">
                <ChevronDown size={24} />
              </div>
            </div>
            <button 
              onClick={() => setIsScanning(true)}
              className="bg-blue-100 text-blue-700 w-[60px] h-[60px] rounded-xl border-2 border-blue-200 active:bg-blue-200 flex items-center justify-center shrink-0 transition-colors"
            >
              <ScanLine size={28} />
            </button>
          </div>
        </div>

        {/* Pallet List */}
        <div className="bg-white flex-1 p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-4 tracking-wide">Quantity Entry</label>
          <div className="flex-1 flex flex-col overflow-y-auto">
            {PALLET_TYPES.map(type => (
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

        {/* Sub Pallet List */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-700 font-bold text-sm uppercase tracking-wide">พาเลทเปล่าส่ง Sub</h2>
            <button
              onClick={() => setIsSubModalOpen(true)}
              className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold text-sm flex items-center gap-1 active:bg-blue-100 transition-colors"
            >
              <Plus size={16} strokeWidth={3} /> เพิ่ม
            </button>
          </div>
          {subPallets.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs font-semibold">ไม่มีรายการพาเลทส่ง Sub</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subPallets.map(sp => (
                <div key={sp.id} className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-xl gap-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-sm text-slate-600">Sub: <span className="text-blue-700">{sp.name}</span></span>
                    <button onClick={() => setSubPallets(prev => prev.filter(p => p.id !== sp.id))} className="text-red-400 p-1 active:bg-red-50 rounded-lg transition-colors">
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 font-bold text-slate-700">
                      <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                      {sp.type}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-blue-800 w-12 text-right">{sp.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Save Button Area - Fixed to bottom */}
      <div className={`fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-200 px-6 py-4 flex items-center transition-transform duration-300 ${focusedField ? 'translate-y-full' : 'translate-y-0'} z-40`}>
        <div className="max-w-3xl mx-auto w-full h-full">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-full text-2xl font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-4 ${
              isSaving
                ? 'bg-blue-400 text-white'
                : 'bg-blue-700 text-white active:bg-blue-900'
            }`}
          >
            {isSaving ? (
              <span className="animate-pulse">กำลังบันทึก...</span>
            ) : (
              <>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                SAVE
              </>
            )}
          </button>
        </div>
      </div>

      <Keypad
        isVisible={!!focusedField}
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
            : focusedField
              ? pallets[focusedField as PalletType]
              : ''
        }
      />
      
      {/* Invisible overlay to close keypad when clicking outside */}
      {focusedField && (
        <div 
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setFocusedField(null)}
        />
      )}

      {/* Sub Pallet Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">เพิ่มพาเลทเปล่าส่ง Sub</h3>
              <button onClick={() => { setIsSubModalOpen(false); setFocusedField(null); }} className="text-slate-400 p-2 active:bg-slate-200 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ชื่อ Sub / รหัส <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subDraftName}
                  onChange={(e) => setSubDraftName(e.target.value)}
                  placeholder="ระบุชื่อ Sub"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ประเภทพาเลท <span className="text-red-500">*</span></label>
                <select
                  value={subDraftType}
                  onChange={(e) => setSubDraftType(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="" disabled>เลือกประเภท</option>
                  {PALLET_TYPES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">จำนวน <span className="text-red-500">*</span></label>
                <div
                  onClick={() => setFocusedField('sub-quantity')}
                  className={`w-full h-16 border-2 rounded-xl flex items-center justify-center text-3xl font-black transition-colors ${
                    focusedField === 'sub-quantity' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  {subDraftQuantity || '0'}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!subDraftName.trim()) return alert('กรุณาระบุชื่อ Sub');
                  if (!subDraftType) return alert('กรุณาเลือกประเภทพาเลท');
                  if (!subDraftQuantity || subDraftQuantity === '0') return alert('กรุณาระบุจำนวน');
                  setSubPallets(prev => [...prev, { id: Date.now().toString(), name: subDraftName.trim(), type: subDraftType, quantity: subDraftQuantity }]);
                  setSubDraftName('');
                  setSubDraftType('');
                  setSubDraftQuantity('');
                  setIsSubModalOpen(false);
                  setFocusedField(null);
                }}
                className="w-full h-14 mt-2 bg-blue-600 text-white rounded-xl font-bold text-lg active:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
              >
                เพิ่มรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {saveSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-75 duration-500 ease-out">
            <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
              <PartyPopper size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">บันทึกสำเร็จ!</h2>
            <p className="text-slate-500 font-medium mb-8">ข้อมูลพาเลทถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว</p>
            <button 
              onClick={handleCloseSuccess}
              className="w-full bg-green-500 text-white font-bold text-xl py-4 rounded-xl active:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30"
            >
              ดำเนินการต่อ
            </button>
          </div>
        </div>
      )}

      {/* Scanner Overlay */}
      {isScanning && (
        <Scanner 
          onScan={(scannedRoute) => {
            setRoute(scannedRoute);
            setIsScanning(false);
          }}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  );
}
