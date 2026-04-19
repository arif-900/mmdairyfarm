import { createContext, useContext, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusMessages: Record<OrderStatus, { title: string; description: string }> = {
  pending: { title: "Order Received", description: "Your order has been received and is being processed." },
  paid: { title: "Payment Confirmed", description: "Your payment has been confirmed successfully!" },
  processing: { title: "Order Processing", description: "Your order is being prepared for delivery." },
  shipped: { title: "Order Shipped! 🚚", description: "Your order is on the way to your doorstep." },
  delivered: { title: "Order Delivered! 🎉", description: "Your order has been delivered. Enjoy!" },
  cancelled: { title: "Order Cancelled", description: "Your order has been cancelled." },
};

interface NotificationContextType {
  // Future: add methods for managing notifications
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to order status changes for this user
    const channel = supabase
      .channel(`order-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          const oldStatus = payload.old?.status as OrderStatus | undefined;

          // Only show notification if status actually changed
          if (newStatus && newStatus !== oldStatus) {
            const message = statusMessages[newStatus];
            if (message) {
              toast({
                title: message.title,
                description: message.description,
                duration: 6000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};
