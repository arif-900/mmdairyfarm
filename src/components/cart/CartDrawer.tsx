import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { formatWeight } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

export const CartDrawer = ({ children }: { children?: React.ReactNode }) => {
  const { items, removeItem, updateQuantity, toggleItemSelection, selectAllItems, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();
  
  const allSelected = items.length > 0 && items.every(i => i.selected);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="relative rounded-full bg-[#0B2118] border-white/10 text-[#F5F3EC] hover:bg-[#10291F] hover:text-[#C98A24] shadow-sm">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C98A24] text-[#061A13] text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[460px] max-w-full h-[100dvh] min-h-[100dvh] flex flex-col p-0 bg-[#061A13] border-l border-[#C98A24]/30 rounded-l-3xl sm:rounded-l-[36px] text-[#F5F3EC] shadow-2xl overflow-hidden [&>button]:hidden">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-white/10 bg-[#082D20] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-[#AAB8B0] uppercase tracking-[0.2em] mb-1">
                MMVALI DAIRY FARM
              </p>
              <SheetTitle className="font-display text-2xl font-black text-[#F5F3EC] tracking-tight uppercase">
                YOUR FRESH <span className="text-[#C98A24]">BOX</span>
              </SheetTitle>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C98A24] bg-[#10291F] px-3 py-1 rounded-full border border-white/10">
                {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <SheetTrigger asChild>
                <button
                  aria-label="Close cart"
                  className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 text-[#F5F3EC] hover:text-[#C98A24] hover:bg-white/10 flex items-center justify-center transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </SheetTrigger>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-16">
              <div className="w-20 h-20 rounded-full bg-[#10291F] border border-white/10 flex items-center justify-center text-[#C98A24] shadow-xl">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="font-display text-xl font-black uppercase text-[#F5F3EC] tracking-tight">
                  YOUR FRESH BOX IS EMPTY
                </h3>
                <p className="text-xs text-[#AAB8B0] font-bold">
                  Your next daily farm-fresh delivery starts here.
                </p>
              </div>
              <SheetTrigger asChild>
                <Button 
                  onClick={() => navigate('/products')}
                  className="h-12 px-8 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] font-black uppercase text-xs tracking-widest shadow-lg transition-all"
                >
                  EXPLORE PRODUCTS →
                </Button>
              </SheetTrigger>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all-drawer" 
                    checked={allSelected} 
                    onCheckedChange={(checked) => selectAllItems(!!checked)}
                    className="rounded-md border-white/20 data-[state=checked]:bg-[#C98A24] data-[state=checked]:border-[#C98A24] data-[state=checked]:text-[#061A13]"
                  />
                  <label htmlFor="select-all-drawer" className="text-[10px] font-bold uppercase tracking-widest text-[#AAB8B0] cursor-pointer">
                    {allSelected ? "Deselect All" : "Select All Items"}
                  </label>
                </div>
              </div>
              
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex gap-4 items-center pb-4 border-b border-white/10 group transition-all",
                    !item.selected && "opacity-40"
                  )}
                >
                  <Checkbox 
                    checked={item.selected} 
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    className="rounded-md border-white/20 data-[state=checked]:bg-[#C98A24] data-[state=checked]:border-[#C98A24] data-[state=checked]:text-[#061A13] shrink-0"
                  />

                  {/* Cream Photo Frame for Contrast */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F1EEE7] border border-white/10 shrink-0 p-1 flex items-center justify-center">
                    <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full !object-contain object-center" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-sm text-[#F5F3EC] truncate">{item.name}</h4>
                    <p className="text-[10px] font-bold text-[#AAB8B0] uppercase tracking-wider">
                      {formatWeight(item.selectedWeight, (item.unitType as "g" | "ml") || "g")}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {/* Compact Dark Elevated Stepper */}
                      <div className="flex items-center bg-[#10291F] border border-white/10 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-[#F5F3EC] w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)} 
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          aria-label="Increase quantity"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#F5F3EC] hover:text-[#C98A24] transition-colors disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-display font-black text-sm text-[#C98A24]">
                        ₹{item.calculatedPrice * item.quantity}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)} 
                    aria-label="Remove item"
                    className="p-2 text-[#718078] hover:text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed / Sticky Summary & Checkout Footer */}
        {items.length > 0 && (
          <SheetFooter className="p-6 bg-[#0B2118] border-t border-white/10 space-y-4 shrink-0">
            <div className="w-full space-y-4">
              {/* Free Delivery Progress */}
              <div className="p-3 bg-[#10291F] border border-white/10 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#C98A24]">
                  <span>Free Delivery Threshold</span>
                  <span>{totalPrice >= 1000 ? "Qualified!" : `₹${totalPrice} / ₹1000`}</span>
                </div>
                <div className="w-full bg-[#061A13] rounded-full h-1.5 overflow-hidden border border-white/10">
                  <div 
                    className="bg-[#C98A24] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (totalPrice / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#AAB8B0] font-bold">
                  <span>SUBTOTAL</span>
                  <span className="text-[#F5F3EC]">₹{totalPrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#AAB8B0] font-bold">
                  <span>DELIVERY</span>
                  <span className="text-[#4ADE80]">{totalPrice >= 1000 ? "FREE" : "Calculated at checkout"}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[#F5F3EC]">TOTAL</span>
                  <span className="text-2xl font-black text-[#C98A24]">₹{totalPrice}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <SheetTrigger asChild>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/cart')} 
                    className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/10 bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431]"
                  >
                    VIEW FULL CART
                  </Button>
                </SheetTrigger>
                
                <SheetTrigger asChild>
                  <Button 
                    onClick={() => navigate('/order')} 
                    disabled={totalItems === 0}
                    className="w-full h-14 bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-between px-6 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <span>CHECKOUT NOW</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
