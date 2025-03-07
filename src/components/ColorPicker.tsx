import React from 'react';
import { useStore } from '../store';

const COLORS = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',
  '#0083C7', '#0000EA', '#CF6EE4', '#820080'
];

export const ColorPicker: React.FC = () => {
  const { selectedColor, setSelectedColor } = useStore();

  return (
    <div className="border-2 border-solid border-black bg-white/75 text-center align-middle leading-10 text-neutral-950 fixed inset-x-0 bottom-4 mx-auto box-content flex h-16 w-64 flex-wrap rounded px-1 py-1" style={{ lineHeight: '0' }}>
      {COLORS.map((color) => (
        <button
          key={color}
          className={`z-10 m-0 block h-8 w-8 cursor-pointer p-0 outline outline-0 outline-white hover:z-20 hover:shadow-[0_0_5px_2px_rgba(0,0,0,0.25)] hover:outline-2 ${
            selectedColor === color ? 'z-30 shadow-[0_0_5px_2px_rgba(0,0,0,0.25)] outline-2' : ''
          }`}
          style={{ backgroundColor: color }}
          onClick={() => setSelectedColor(color)}
        />
      ))}
    </div>
  );
};