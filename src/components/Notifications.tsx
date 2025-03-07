import React, { useEffect } from 'react';
import { useStore } from '../store';
import { X } from 'lucide-react';

const ERROR_CODES: Record<string, number> = {
  'bad_request': 400,
  'unauthorized': 401,
  'forbidden': 403,
  'not_found': 404,
  'rate_limited': 429,
  'server_error': 500
};

export const Notifications: React.FC = () => {
  const { notifications, dismissNotification } = useStore();

  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dismissNotification]);

  return (
    <div className="fixed bottom-4 left-4 space-y-2 z-50">
      {notifications.map((notification) => {
        // Get error code based on message type
        let errorCode = 0;
        for (const [type, code] of Object.entries(ERROR_CODES)) {
          if (notification.message.toLowerCase().includes(type)) {
            errorCode = code;
            break;
          }
        }
        if (!errorCode) errorCode = notification.id;

        return (
          <div
            key={notification.id}
            className="bg-white/75 border-2 border-black rounded-xl p-4 flex items-start gap-4 max-w-md transition-opacity duration-500 hover:opacity-100"
            style={{
              opacity: Math.max(0, 1 - ((Date.now() - notification.timestamp) / 5000))
            }}
          >
            <div className="flex-1">
              <div className="font-bold">Error #{errorCode}</div>
              <div className="text-sm text-gray-700">{notification.message}</div>
              {notification.details && (
                <button
                  onClick={() => alert(notification.details)}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  View Details
                </button>
              )}
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};