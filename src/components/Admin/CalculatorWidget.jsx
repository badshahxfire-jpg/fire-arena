import React, { useState } from 'react';

export default function CalculatorWidget({ onClose }) {
  const [input, setInput] = useState('0');
  
  const handlePress = (val) => {
    if (input === '0' && val !== '.') {
      setInput(val);
    } else {
      setInput(input + val);
    }
  };

  const handleCalculate = () => {
    try {
      // safe eval for basic math
      const result = new Function('return ' + input)();
      setInput(String(result));
    } catch (e) {
      setInput('Error');
    }
  };

  const handleClear = () => {
    setInput('0');
  };

  const handleDelete = () => {
    if (input.length > 1) {
      setInput(input.slice(0, -1));
    } else {
      setInput('0');
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[999] animate-fade-in-up">
      <div className="bg-[#111] border-2 border-orange-500/50 rounded-3xl p-4 shadow-[0_0_30px_rgba(249,115,22,0.3)] w-64 cyber-card relative">
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-black flex items-center justify-center border-2 border-[#111]"
        >
          ✕
        </button>
        
        <div className="bg-black border border-gray-800 rounded-2xl p-4 mb-4 text-right overflow-hidden break-words text-2xl font-mono text-green-400 cyber-neon-green">
          {input}
        </div>
        
        <div className="flex gap-2 mb-2">
          <button onClick={handleClear} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-xl font-bold">AC</button>
          <button onClick={handleDelete} className="flex-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 py-2 rounded-xl font-bold">DEL</button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn, idx) => (
            <button 
              key={idx}
              onClick={() => {
                if (btn === '=') handleCalculate();
                else handlePress(btn);
              }}
              className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                ['/', '*', '-', '+'].includes(btn) 
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/40' 
                  : btn === '=' 
                  ? 'bg-orange-500 text-black hover:bg-orange-600'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
