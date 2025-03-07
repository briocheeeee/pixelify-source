import React, { useState } from 'react';
import { Menu as MenuIcon, X } from 'lucide-react';
import { useStore } from '../store';
import { AuthModal } from './AuthModal';

export const Menu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, logout, showGrid, toggleGrid } = useStore();

  return (
    <>
      <div className="absolute left-4 top-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-solid border-black bg-white/75 text-neutral-950"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white">
            <div className="grid gap-1.5 p-4 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Welcome to PixelCanvas.io
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="fixed right-0 top-0 p-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close panel</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-col overflow-auto p-4">
              {!user ? (
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 bg-white text-indigo-600 border border-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-50"
                  >
                    Register
                  </button>
                </div>
              ) : (
                <button
                  onClick={logout}
                  className="mb-6 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  Sign Out
                </button>
              )}

              <p className="text-sm text-gray-500">
                Place color pixels on an infinite canvas with other players online! The cooldown is 5 seconds.
                Have fun 😄
              </p>

              <h2 className="mb-3 mt-6 text-base font-medium text-gray-900">Controls</h2>
              <p className="text-sm text-gray-500">Click a color in palette to select</p>
              <p className="text-sm text-gray-500">
                Press <kbd className="mx-1 px-2 py-0.5 bg-gray-100 border rounded text-xs">G</kbd> to toggle grid
              </p>
              <p className="text-sm text-gray-500">
                Press <kbd className="mx-1 px-2 py-0.5 bg-gray-100 border rounded text-xs">R</kbd> to pick color
              </p>
              <p className="text-sm text-gray-500">Drag mouse to move</p>
              <p className="text-sm text-gray-500">Scroll mouse wheel to zoom</p>

              <h2 className="mb-3 mt-6 text-base font-medium text-gray-900">Settings</h2>
              <div className="flex items-center justify-between py-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-900">Grid</p>
                  <span className="text-sm text-gray-500">Show pixel borders</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  onClick={toggleGrid}
                  className={`${
                    showGrid ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      showGrid ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};