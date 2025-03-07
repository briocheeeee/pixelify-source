export interface Pixel {
  x: number;
  y: number;
  color: string;
  lastUpdated: number;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

export interface Notification {
  id: number;
  message: string;
  details?: string;
  timestamp: number;
}

export interface CanvasState {
  pixels: Record<string, Pixel>;
  selectedColor: string;
  cooldown: number;
  zoom: number;
  pan: { x: number; y: number };
  onlineUsers: number;
  previewPixel: { x: number; y: number; color: string } | null;
  showGrid: boolean;
  user: User | null;
  notifications: Notification[];
  setPixel: (x: number, y: number, color: string) => void;
  setSelectedColor: (color: string) => void;
  loadInitialPixels: () => Promise<void>;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setPreviewPixel: (pixel: { x: number; y: number } | null) => void;
  toggleGrid: () => void;
  setSelectedColorFromPixel: (color: string) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  addNotification: (message: string, details?: string) => void;
  dismissNotification: (id: number) => void;
}