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

export const useGlobalOrdersSubscription = (
  onNewOrder?: (order: Order) => void,
  onOrderUpdate?: (order: Order, oldOrder: Partial<Order>) => void,
  onOrderDelete?: (orderId: string) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const { soundEnabled, setSoundEnabled, playNotificationSound, testSound } = useGlobalOrderNotifications();
  const callbacksRef = useRef({ onNewOrder, onOrderUpdate, onOrderDelete });

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onNewOrder, onOrderUpdate, onOrderDelete };
  }, [onNewOrder, onOrderUpdate, onOrderDelete]);

  useEffect(() => {
    subscriptionCount++;

    if (!globalSubscription) {
      console.log('Creating global orders subscription');
      globalSubscription = supabase
        .channel('global-orders-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('Global realtime order update:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as Order;
              // Always show toast for new orders, even if not on orders page
              playNotificationSound('new_order');
              toast.success(`🔔 Comandă nouă: ${newOrder.order_number}`, {
                duration: 8000,
                description: `${newOrder.customer_first_name} ${newOrder.customer_last_name} - ${Number(newOrder.total).toFixed(2)} lei`
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedOrder = payload.new as Order;
              const oldOrder = payload.old as Partial<Order>;
              
              // Check if payment was just confirmed
              if (oldOrder.payment_status === 'pending' && updatedOrder.payment_status === 'paid') {
                playNotificationSound('payment_confirmed');
                toast.success(`💳 Plată confirmată: ${updatedOrder.order_number}`, {
                  duration: 8000,
                  description: `${updatedOrder.customer_first_name} ${updatedOrder.customer_last_name} - ${Number(updatedOrder.total).toFixed(2)} lei`
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Global subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    } else {
      // Already subscribed
      setIsConnected(true);
    }

    return () => {
      subscriptionCount--;
      if (subscriptionCount === 0 && globalSubscription) {
        console.log('Removing global orders subscription');
        supabase.removeChannel(globalSubscription);
        globalSubscription = null;
        setIsConnected(false);
      }
    };
  }, [playNotificationSound]);

  return {
    isConnected,
    soundEnabled,
    setSoundEnabled,
    testSound,
  };
};
