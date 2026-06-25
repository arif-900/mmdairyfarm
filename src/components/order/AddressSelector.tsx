import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Briefcase, MapPin, Plus, Check, Loader2, Edit2, Trash2 } from "lucide-react";
import AddressFormDialog from "./AddressFormDialog";
import { toast } from "@/hooks/use-toast";
import AddressInput from "./AddressInput";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  lat: number;
  lng: number;
  label: string;
  is_default: boolean;
}

interface AddressSelectorProps {
  userId: string;
  selectedId: string | null;
  onSelect: (address: Address | any) => void;
  onTemporaryAddress?: (isTemp: boolean) => void;
}

const AddressSelector = ({ userId, selectedId, onSelect, onTemporaryAddress }: AddressSelectorProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      
      // Auto-select default address if none selected
      if (!selectedId && data && data.length > 0) {
        const defaultAddr = data.find(a => a.is_default) || data[0];
        onSelect(defaultAddr);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load addresses", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Address Deleted" });
      fetchAddresses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getLabelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "home": return <Home className="w-4 h-4" />;
      case "office": return <Briefcase className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {/* Main View: Show selected address OR the selection list */}
      {selectedAddress && !isExpanded ? (
        <div className="space-y-4">
          <div
            onClick={() => setIsExpanded(true)}
            className="p-6 rounded-[32px] border-2 border-primary bg-primary/5 shadow-xl shadow-primary/10 cursor-pointer group animate-in fade-in zoom-in-95 duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-primary text-white">
                  {getLabelIcon(selectedAddress.label)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">{selectedAddress.label}</h4>
                    {selectedAddress.is_default && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">Default</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-700 mt-1">{selectedAddress.full_name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedAddress.address_line}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1">
                   <AddressFormDialog 
                    userId={userId} 
                    onSuccess={fetchAddresses} 
                    editAddress={selectedAddress}
                    trigger={
                      <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50">
                        <Edit2 className="w-3 h-3 text-slate-400" />
                      </Button>
                    }
                   />
                   <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, selectedAddress.id);
                    }}
                    className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 hover:bg-rose-50 hover:border-rose-100 group"
                   >
                     <Trash2 className="w-3 h-3 text-rose-400 group-hover:text-rose-500" />
                   </Button>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl h-8 px-3"
                >
                  Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
           {/* Header for Selection View */}
           {addresses.length > 0 && (
             <div className="flex items-center justify-between mb-2">
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Select From Your Addresses</p>
                {selectedAddress && (
                  <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-full h-8 px-4">
                    Cancel
                  </Button>
                )}
             </div>
           )}

           {/* Saved Addresses List */}
           <div className="grid grid-cols-1 gap-4">
             {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => {
                    onSelect(addr);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "relative p-6 rounded-[32px] border-2 transition-all cursor-pointer group",
                    selectedId === addr.id 
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
                      : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                        selectedId === addr.id ? "bg-primary text-white" : "bg-slate-50 text-slate-400"
                      )}>
                        {getLabelIcon(addr.label)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">{addr.label}</h4>
                          {addr.is_default && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">Default</span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-700 mt-1">{addr.full_name}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[280px]">
                          {addr.address_line}
                        </p>
                        <p className="text-xs font-black text-slate-400 mt-2 tracking-tighter">{addr.phone}</p>
                      </div>
                    </div>
      
                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      {selectedId === addr.id && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white scale-110 ml-auto mb-2">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                         <AddressFormDialog 
                          userId={userId} 
                          onSuccess={fetchAddresses} 
                          editAddress={addr}
                          trigger={
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 hover:bg-white transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                            </Button>
                          }
                         />
                         <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(e, addr.id);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:border-rose-100 transition-all group"
                         >
                           <Trash2 className="w-3 h-3 text-rose-400 group-hover:text-rose-500" />
                         </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>

            {addresses.length === 0 && !isLoading && (
               <div className="p-8 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="text-slate-300 w-6 h-6" />
                  </div>
                  <p className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">No saved addresses found</p>
               </div>
            )}

            {/* Always show add buttons when in list mode or empty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <AddressFormDialog 
                userId={userId} 
                onSuccess={fetchAddresses} 
                trigger={
                    <Button type="button" variant="outline" className="h-16 rounded-2xl border-dashed border-2 border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary group transition-all">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center mr-3">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest">Add New Address</span>
                    </Button>
                }
                />

                <AddressFormDialog 
                userId={userId} 
                onSuccess={fetchAddresses} 
                autoLocate={true}
                trigger={
                    <Button 
                    type="button"
                    variant="outline" 
                    className="h-16 rounded-2xl border-2 transition-all border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mr-3">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest">Manual Enter</span>
                    </Button>
                }
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default AddressSelector;

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
