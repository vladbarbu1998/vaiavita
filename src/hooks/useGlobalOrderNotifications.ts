import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  total: number;
  payment_status: string | null;
  created_at: string;
}

export const useGlobalOrderNotifications = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('admin_sound_enabled');
    return stored !== 'false'; // Default to true
  });
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('admin_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Initialize audio context on first user interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback((type: 'new_order' | 'payment_confirmed') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = getAudioContext();
      
      if (type === 'new_order') {
        // Play 3 ascending tones for new order
        [800, 1000, 1200].forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.12 + 0.15);
          osc.start(audioContext.currentTime + i * 0.12);
          osc.stop(audioContext.currentTime + i * 0.12 + 0.15);
        });
      } else {
        // Play chord for payment confirmed
        [523, 659, 784].forEach((freq) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.5);
        });
      }
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, [soundEnabled, getAudioContext]);

  const testSound = useCallback((type: 'new_order' | 'payment_confirmed') => {
    playNotificationSound(type);
    toast.info(type === 'new_order' ? '🔔 Test: Comandă nouă' : '💳 Test: Plată confirmată');
  }, [playNotificationSound]);

  return {
    isConnected,
    setIsConnected,
    soundEnabled,
    setSoundEnabled,
    playNotificationSound,
    testSound,
    getAudioContext,
  };
};

// Global singleton subscription for entire admin dashboard
let globalSubscription: ReturnType<typeof supabase.channel> | null = null;
let subscriptionCount = 0;
let globalCallbacks: Array<{
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order, oldOrder: Partial<Order>) => void;
  onOrderDelete?: (orderId: string) => void;
}> = [];

export const useGlobalOrdersSubscription = (
  onNewOrder?: (order: Order) => void,
  onOrderUpdate?: (order: Order, oldOrder: Partial<Order>) => void,
  onOrderDelete?: (orderId: string) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const { soundEnabled, setSoundEnabled, playNotificationSound, testSound } = useGlobalOrderNotifications();
  const callbacksRef = useRef({ onNewOrder, onOrderUpdate, onOrderDelete });
  const callbackIndexRef = useRef<number>(-1);
  
  // Keep ref for sound function to avoid subscription recreation
  const playNotificationSoundRef = useRef(playNotificationSound);
  playNotificationSoundRef.current = playNotificationSound;

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onNewOrder, onOrderUpdate, onOrderDelete };
    // Update in global array too
    if (callbackIndexRef.current >= 0) {
      globalCallbacks[callbackIndexRef.current] = callbacksRef.current;
    }
  }, [onNewOrder, onOrderUpdate, onOrderDelete]);

  useEffect(() => {
    subscriptionCount++;
    
    // Register callbacks
    callbackIndexRef.current = globalCallbacks.length;
    globalCallbacks.push(callbacksRef.current);
    
    console.log('[GlobalOrdersSubscription] Component mounted, count:', subscriptionCount);

    if (!globalSubscription) {
      console.log('[GlobalOrdersSubscription] Creating new global subscription');
      globalSubscription = supabase
        .channel('global-orders-realtime-singleton')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('[GlobalOrdersSubscription] Received event:', payload.eventType, payload);
            
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as Order;
              
              // Notify all registered callbacks
              globalCallbacks.forEach(cb => cb.onNewOrder?.(newOrder));
              
              // Always show toast for new orders
              playNotificationSoundRef.current('new_order');
              toast.success(`🔔 Comandă nouă: ${newOrder.order_number}`, {
                duration: 8000,
                description: `${newOrder.customer_first_name} ${newOrder.customer_last_name} - ${Number(newOrder.total).toFixed(2)} lei`
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedOrder = payload.new as Order;
              const oldOrder = payload.old as Partial<Order>;
              
              // Notify all registered callbacks
              globalCallbacks.forEach(cb => cb.onOrderUpdate?.(updatedOrder, oldOrder));
              
              // Check if payment was just confirmed
              if (oldOrder.payment_status === 'pending' && updatedOrder.payment_status === 'paid') {
                playNotificationSoundRef.current('payment_confirmed');
                toast.success(`💳 Plată confirmată: ${updatedOrder.order_number}`, {
                  duration: 8000,
                  description: `${updatedOrder.customer_first_name} ${updatedOrder.customer_last_name} - ${Number(updatedOrder.total).toFixed(2)} lei`
                });
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id as string;
              // Notify all registered callbacks
              globalCallbacks.forEach(cb => cb.onOrderDelete?.(deletedId));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_items'
          },
          (payload) => {
            console.log('[GlobalOrdersSubscription] Order items insert:', payload);
          }
        )
        .subscribe((status) => {
          console.log('[GlobalOrdersSubscription] Status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    } else {
      // Already subscribed
      console.log('[GlobalOrdersSubscription] Reusing existing subscription');
      setIsConnected(true);
    }

    return () => {
      subscriptionCount--;
      
      // Remove from callbacks array
      if (callbackIndexRef.current >= 0) {
        globalCallbacks.splice(callbackIndexRef.current, 1);
        callbackIndexRef.current = -1;
      }
      
      console.log('[GlobalOrdersSubscription] Component unmounting, remaining count:', subscriptionCount);
      
      if (subscriptionCount === 0 && globalSubscription) {
        console.log('[GlobalOrdersSubscription] Removing global subscription');
        supabase.removeChannel(globalSubscription);
        globalSubscription = null;
        globalCallbacks = [];
        setIsConnected(false);
      }
    };
  }, []);

  return {
    isConnected,
    soundEnabled,
    setSoundEnabled,
    testSound,
  };
};
