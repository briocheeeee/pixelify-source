import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CanvasState, Pixel, User, Notification } from './types';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

const CACHE_DEBOUNCE_TIME = 1000;
const COOLDOWN_TIME = 1000;
const REGISTER_COOLDOWN = 10000; // 10 seconds cooldown for registration
let lastRegistrationAttempt = 0;

const pixelCache = new Map<string, NodeJS.Timeout>();

export const useStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      pixels: {},
      selectedColor: '#000000',
      cooldown: 0,
      zoom: 1,
      pan: { x: 0, y: 0 },
      onlineUsers: 0,
      previewPixel: null,
      showGrid: true,
      user: null,
      notifications: [],
      
      setZoom: (zoom: number) => set({ zoom }),
      setPan: (pan: { x: number; y: number }) => set({ pan }),
      toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
      setSelectedColorFromPixel: (color: string) => set({ selectedColor: color }),
      setUser: (user: User | null) => set({ user }),
      
      addNotification: (message: string, details?: string) => set(state => ({
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            message,
            details,
            timestamp: Date.now()
          }
        ]
      })),

      dismissNotification: (id: number) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      login: async (email: string, password: string) => {
        try {
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profile) {
              set({ user: profile });
              toast.success('Successfully logged in!');
            }
          }
        } catch (error: any) {
          get().addNotification('Login failed', error.message);
          throw error;
        }
      },

      register: async (email: string, password: string, username: string) => {
        const now = Date.now();
        if (now - lastRegistrationAttempt < REGISTER_COOLDOWN) {
          const remainingTime = Math.ceil((REGISTER_COOLDOWN - (now - lastRegistrationAttempt)) / 1000);
          throw new Error(`For security purposes, you can only request this after ${remainingTime} seconds.`);
        }
        
        lastRegistrationAttempt = now;
        
        try {
          const { data: { user }, error } = await supabase.auth.signUp({
            email,
            password
          });

          if (error) throw error;

          if (user) {
            const { error: profileError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  email,
                  username,
                  isAdmin: false
                }
              ]);

            if (profileError) throw profileError;

            toast.success('Successfully registered! Please check your email.');
          }
        } catch (error: any) {
          get().addNotification('Registration failed', error.message);
          throw error;
        }
      },

      logout: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null });
          toast.success('Successfully logged out!');
        } catch (error: any) {
          get().addNotification('Logout failed', error.message);
          throw error;
        }
      },

      setPixel: async (x: number, y: number, color: string) => {
        const now = Date.now();
        if (now < get().cooldown) {
          get().addNotification('Cooldown active', 'Please wait before placing another pixel.');
          return;
        }

        const pixelKey = `${x},${y}`;
        const pixelData: Pixel = {
          x,
          y,
          color,
          lastUpdated: now,
          userId: get().user?.id || 'anonymous'
        };

        set((state) => ({
          pixels: {
            ...state.pixels,
            [pixelKey]: pixelData
          },
          cooldown: now + COOLDOWN_TIME,
          previewPixel: null
        }));

        if (pixelCache.has(pixelKey)) {
          clearTimeout(pixelCache.get(pixelKey));
        }

        const timeoutId = setTimeout(async () => {
          try {
            const { error } = await supabase
              .from('pixels')
              .upsert({
                x,
                y,
                color,
                last_updated: new Date(now).toISOString(),
                user_id: get().user?.id || 'anonymous'
              });

            if (error) {
              console.error('Error saving pixel:', error);
              get().addNotification('Failed to save pixel', error.message);
            }

            pixelCache.delete(pixelKey);
          } catch (error: any) {
            console.error('Failed to save pixel:', error);
            get().addNotification('Failed to save pixel', error.message);
          }
        }, CACHE_DEBOUNCE_TIME);

        pixelCache.set(pixelKey, timeoutId);
      },

      setSelectedColor: (color: string) => set({ selectedColor: color }),
      
      setPreviewPixel: (pixel: { x: number; y: number } | null) => 
        set({ previewPixel: pixel ? { ...pixel, color: get().selectedColor } : null }),

      loadInitialPixels: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profile) {
              set({ user: profile });
            }
          }

          const { data, error } = await supabase
            .from('pixels')
            .select('*');

          if (error) throw error;

          const pixelsMap: Record<string, Pixel> = {};
          data.forEach((pixel: any) => {
            pixelsMap[`${pixel.x},${pixel.y}`] = {
              x: pixel.x,
              y: pixel.y,
              color: pixel.color,
              lastUpdated: new Date(pixel.last_updated).getTime(),
              userId: pixel.user_id
            };
          });

          set({ pixels: pixelsMap });

          const channel = supabase
            .channel('online-users')
            .on('presence', { event: 'sync' }, () => {
              const presenceState = channel.presenceState();
              const userCount = Object.keys(presenceState).length;
              set({ onlineUsers: userCount });
            })
            .on('presence', { event: 'join' }, () => {
              set(state => ({ onlineUsers: state.onlineUsers + 1 }));
            })
            .on('presence', { event: 'leave' }, () => {
              set(state => ({ onlineUsers: Math.max(0, state.onlineUsers - 1) }));
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                await channel.track({ user_id: user?.id || 'anonymous' });
              }
            });

          return () => {
            channel.unsubscribe();
          };
        } catch (error: any) {
          console.error('Failed to load pixels:', error);
          get().addNotification('Failed to load pixels', error.message);
        }
      }
    }),
    {
      name: 'canvas-storage',
      partialize: (state) => ({ 
        cooldown: state.cooldown,
        showGrid: state.showGrid 
      })
    }
  )
);