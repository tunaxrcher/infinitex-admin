'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete } from 'lucide-react';

interface PinEntryScreenProps {
  onSuccess: (token: string) => void;
}

const PIN_LENGTH = 6;

export function PinEntryScreen({ onSuccess }: PinEntryScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleNumberPress = useCallback(async (num: string) => {
    if (pin.length >= PIN_LENGTH || isLoading) return;
    
    const newPin = pin + num;
    setPin(newPin);
    setError('');

    // Auto-submit when PIN is complete
    if (newPin.length === PIN_LENGTH) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/loan-check/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: newPin }),
        });

        const data = await response.json();

        if (data.success) {
          onSuccess(data.token);
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setError(data.message || 'PIN ไม่ถูกต้อง');
          setPin('');
        }
      } catch (err) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        setPin('');
      } finally {
        setIsLoading(false);
      }
    }
  }, [pin, isLoading, onSuccess]);

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, [isLoading]);

  const handleCancel = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  const letterMap: Record<string, string> = {
    '2': 'ABC',
    '3': 'DEF',
    '4': 'GHI',
    '5': 'JKL',
    '6': 'MNO',
    '7': 'PQRS',
    '8': 'TUV',
    '9': 'WXYZ',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Background with gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E8B4C8 0%, #D4A5C9 25%, #9B7BB8 50%, #6B5B95 75%, #4A4A8A 100%)',
        }}
      />
      <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-8">
        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-light text-white mb-8 tracking-wider"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Enter Passcode
        </motion.h1>

        {/* PIN Dots */}
        <motion.div 
          className="flex gap-4 mb-4"
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                backgroundColor: i < pin.length ? 'rgba(255, 255, 255, 1)' : 'transparent',
              }}
              transition={{ delay: i * 0.05 }}
              className="w-3.5 h-3.5 rounded-full border-2 border-white/80"
            />
          ))}
        </motion.div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-300 text-sm mb-6 h-5"
            >
              {error}
            </motion.p>
          )}
          {!error && <div className="h-5 mb-6" />}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid gap-y-4 mt-4">
          {keypadNumbers.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-6 justify-center">
              {row.map((key) => {
                if (key === '') {
                  return <div key="empty" className="w-20 h-20" />;
                }

                if (key === 'delete') {
                  return (
                    <motion.button
                      key="delete"
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDelete}
                      disabled={isLoading || pin.length === 0}
                      className="w-20 h-20 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      <Delete className="w-7 h-7" />
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                    onClick={() => handleNumberPress(key)}
                    disabled={isLoading}
                    className="w-20 h-20 rounded-full flex flex-col items-center justify-center bg-white/10 border border-white/20 backdrop-blur-sm disabled:opacity-50 transition-colors"
                  >
                    <span className="text-3xl font-light text-white">{key}</span>
                    {letterMap[key] && (
                      <span className="text-[10px] font-medium text-white/70 tracking-[0.2em] mt-0.5">
                        {letterMap[key]}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom buttons */}
        <div className="flex justify-between w-full mt-12 px-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            className="text-white/80 text-base font-light tracking-wide"
          >
            Emergency
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            disabled={isLoading}
            className="text-white/80 text-base font-light tracking-wide disabled:opacity-50"
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </div>
  );
}
