import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Tables } from '@/integrations/supabase/types';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  selectedWeight: number;
  calculatedPrice: number;
  quantity: number;
  stock?: number;
  image?: string;
  unitType?: string;
  selected?: boolean;
  deliveryDays?: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'selected'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  toggleItemSelection: (id: string) => void;
  selectAllItems: (selected: boolean) => void;
  clearCart: () => void;
  clearOrderedItems: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper to ensure user has a cart and return its ID
  const getOrCreateCart = async (userId: string) => {
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (cartError) throw cartError;

    if (cartData) return cartData.id;

    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (createError) throw createError;
    return newCart.id;
  };

  // Load cart from localStorage on mount (immediate load for perceived performance)
  useEffect(() => {
    const savedCart = localStorage.getItem('mmdairy_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // SYNC: Load cart from database when user logs in (OVERWRITE local)
  useEffect(() => {
    const syncWithDB = async () => {
      if (!user) return;
      
      setIsSyncing(true);
      try {
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cartError) throw cartError;

        if (cartData) {
          const { data: dbItems, error: itemsError } = await supabase
            .from('cart_items')
            .select(`
                id,
                product_id,
                quantity,
                selected_weight,
                unit_type,
                selected,
                products (
                    name,
                    price,
                    image_url,
                    stock,
                    available_weights
                )
            `)
            .eq('cart_id', cartData.id);

          if (itemsError) throw itemsError;

          if (dbItems) {
            const mappedItems: CartItem[] = dbItems.map((item: any) => ({
              id: item.id,
              productId: item.product_id,
              name: item.products.name,
              selectedWeight: item.selected_weight,
              calculatedPrice: item.products.price, // Fallback, usually calculated per weight in UI
              quantity: item.quantity,
              stock: item.products.stock,
              image: item.products.image_url,
              unitType: item.unit_type,
              selected: item.selected,
            }));
            
            // OVERWRITE behavior as requested
            setItems(mappedItems);
            console.log("Cart synced from DB:", mappedItems);
          }
        }
      } catch (err) {
        console.error("Error syncing cart with DB:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithDB();
  }, [user]);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('mmdairy_cart', JSON.stringify(items));
  }, [items]);

  const addItem = async (newItem: Omit<CartItem, 'id' | 'selected'>) => {
    const existingItemIndex = items.findIndex(
      item => item.productId === newItem.productId && item.selectedWeight === newItem.selectedWeight
    );

    let updatedItems = [...items];
    let cartId: string | null = null;
    
    if (user) {
      try {
        cartId = await getOrCreateCart(user.id);
      } catch (err) {
        console.error("Failed to sync cart", err);
      }
    }

    if (existingItemIndex !== -1) {
      const item = items[existingItemIndex];
      const newTotalQuantity = item.quantity + newItem.quantity;
      
      if (item.stock !== undefined && newTotalQuantity > item.stock) {
        toast({
          title: "Quantity Limited",
          description: `Only ${item.stock} total units of ${newItem.name} are available.`,
          variant: "destructive"
        });
        return;
      }

      updatedItems[existingItemIndex].quantity = newTotalQuantity;
      updatedItems[existingItemIndex].selected = true;
      
      if (user && cartId) {
        await supabase
          .from('cart_items')
          .update({ quantity: newTotalQuantity, selected: true })
          .eq('id', item.id);
      }
      
      toast({ title: "Cart Updated", description: `Added more ${newItem.name}.` });
    } else {
      const id = user ? undefined : `${newItem.productId}-${newItem.selectedWeight}-${Date.now()}`;
      let finalId = id;

      if (user && cartId) {
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: newItem.productId,
            quantity: newItem.quantity,
            selected_weight: newItem.selectedWeight,
            unit_type: newItem.unitType,
            selected: true
          })
          .select('id')
          .single();
        
        if (!error && data) finalId = data.id;
      }

      updatedItems.push({ ...newItem, id: finalId || `temp-${Date.now()}`, selected: true });
      toast({ title: "Added to Cart", description: `${newItem.name} added.` });
    }

    setItems(updatedItems);
  };

  const toggleItemSelection = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newSelected = !item.selected;
    setItems(current => current.map(i => i.id === id ? { ...i, selected: newSelected } : i));

    if (user) {
      await supabase.from('cart_items').update({ selected: newSelected }).eq('id', id);
    }
  };

  const selectAllItems = async (selected: boolean) => {
    setItems(current => current.map(item => ({ ...item, selected })));
    
    if (user) {
      const { data: cartData } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
      if (cartData) {
        await supabase.from('cart_items').update({ selected }).eq('cart_id', cartData.id);
      }
    }
  };

  const removeItem = async (id: string) => {
    setItems(current => current.filter(item => item.id !== id));
    if (user) {
      await supabase.from('cart_items').delete().eq('id', id);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const currentItem = items.find(i => i.id === id);
    if (!currentItem) return;

    const newQuantity = Math.max(1, currentItem.quantity + delta);
    
    if (delta > 0 && currentItem.stock !== undefined && currentItem.quantity >= currentItem.stock) {
      toast({ title: "Stock Limit", description: `Only ${currentItem.stock} units available.`, variant: "destructive" });
      return;
    }

    setItems(current => current.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));

    if (user) {
      await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', id);
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (user) {
      const { data: cartData } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
      if (cartData) {
        await supabase.from('cart_items').delete().eq('cart_id', cartData.id);
      }
    }
  };
  
  const clearOrderedItems = async () => {
    const selectedIds = items.filter(i => i.selected).map(i => i.id);
    setItems(current => current.filter(item => !item.selected));
    
    if (user && selectedIds.length > 0) {
      await supabase.from('cart_items').delete().in('id', selectedIds);
    }
  };

  const totalItems = items.reduce((sum, item) => item.selected ? sum + item.quantity : sum, 0);
  const totalPrice = items.reduce((sum, item) => item.selected ? sum + (item.calculatedPrice * item.quantity) : sum, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      toggleItemSelection,
      selectAllItems,
      clearCart,
      clearOrderedItems,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
