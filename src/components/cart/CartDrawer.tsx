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
  const someSelected = items.some(i => i.selected) && !allSelected;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="relative rounded-full">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 rounded-l-[40px] border-none shadow-2xl">
        <SheetHeader className="p-6 border-b bg-slate-50/50 rounded-tl-[40px]">
          <SheetTitle className="flex items-center gap-3 font-display text-2xl font-black italic">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Your Fresh Box
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <ShoppingBag className="h-16 w-16" />
              <p className="font-black uppercase tracking-widest text-xs">Your Box is Empty</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all" 
                    checked={allSelected} 
                    onCheckedChange={(checked) => selectAllItems(!!checked)}
                    className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                    {allSelected ? "Deselect All" : "Select All Items"}
                  </label>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {totalItems} Items Selected
                </span>
              </div>
              
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex gap-4 group animate-in slide-in-from-right-4 duration-300 transition-opacity",
                    !item.selected && "opacity-50"
                  )}
                >
                  <div className="flex items-center self-center pr-2">
                    <Checkbox 
                      checked={item.selected} 
                      onCheckedChange={() => toggleItemSelection(item.id)}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatWeight(item.selectedWeight, (item.unitType as "g" | "ml") || "g")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)} 
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          className="p-1 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-black text-sm">₹{item.calculatedPrice * item.quantity}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-8 bg-white border-t space-y-4">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-3xl font-black italic tracking-tighter text-slate-900">₹{totalPrice}</span>
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate('/cart')} 
                className="w-full h-12 rounded-2xl font-black text-xs tracking-widest border-2 border-slate-100 hover:bg-slate-50 uppercase mb-2"
              >
                View Full Cart
              </Button>
              <Button 
                onClick={() => navigate('/order')} 
                disabled={totalItems === 0}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[28px] font-black text-sm tracking-[0.2em] shadow-xl shadow-primary/20 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all uppercase flex items-center justify-between px-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
              >
                Checkout Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
