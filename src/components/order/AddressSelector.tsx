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
            className="p-4 md:p-6 rounded-2xl border border-[#C98A24] bg-[#10291F] shadow-xl cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 md:gap-4 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-[#C98A24] text-[#061A13] font-bold shrink-0">
                  {getLabelIcon(selectedAddress.label)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[#F5F3EC] uppercase text-xs tracking-wider">{selectedAddress.label}</h4>
                    {selectedAddress.is_default && (
                      <span className="px-2 py-0.5 rounded-full bg-[#10291F] border border-white/10 text-[#4ADE80] text-[10px] font-bold uppercase">Default</span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[#F5F3EC] mt-1 truncate">{selectedAddress.full_name}</p>
                  <p className="text-[11px] md:text-xs text-[#AAB8B0] mt-1 break-words">{selectedAddress.address_line}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <AddressFormDialog 
                  userId={userId} 
                  onSuccess={fetchAddresses} 
                  editAddress={selectedAddress}
                  trigger={
                    <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-xl bg-[#061A13] border border-white/10 text-[#F5F3EC] hover:text-[#C98A24]">
                      <Edit2 className="w-3.5 h-3.5" />
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
                  className="w-8 h-8 rounded-xl bg-[#061A13] border border-white/10 text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="font-bold text-xs uppercase tracking-wider text-[#C98A24] bg-[#061A13] hover:bg-[#164431] border border-white/10 rounded-xl h-8 px-3"
                >
                  Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Header for Selection View */}
           {addresses.length > 0 && (
             <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-[10px] text-[#AAB8B0] uppercase tracking-wider">Select From Your Addresses</p>
                {selectedAddress && (
                  <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8B0] bg-[#10291F] hover:bg-[#164431] rounded-full h-8 px-4 border border-white/10">
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
                      "relative p-4 md:p-6 rounded-2xl border cursor-pointer transition-all",
                      selectedId === addr.id 
                        ? "border-[#C98A24] bg-[#10291F] shadow-xl" 
                        : "border-white/10 bg-[#061A13] hover:border-white/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 md:gap-4 min-w-0">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
                          selectedId === addr.id ? "bg-[#C98A24] text-[#061A13]" : "bg-[#10291F] text-[#AAB8B0]"
                        )}>
                          {getLabelIcon(addr.label)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[#F5F3EC] uppercase text-xs tracking-wider">{addr.label}</h4>
                            {addr.is_default && (
                              <span className="px-2 py-0.5 rounded-full bg-[#10291F] border border-white/10 text-[#4ADE80] text-[10px] font-bold uppercase">Default</span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm font-bold text-[#F5F3EC] mt-1 truncate">{addr.full_name}</p>
                          <p className="text-[11px] md:text-xs text-[#AAB8B0] mt-1 leading-relaxed break-words">
                            {addr.address_line}
                          </p>
                          <p className="text-[11px] md:text-xs font-bold text-[#C98A24] mt-1">{addr.phone}</p>
                        </div>
                      </div>
        
                      <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {selectedId === addr.id && (
                          <div className="w-7 h-7 rounded-full bg-[#C98A24] text-[#061A13] flex items-center justify-center ml-auto font-black text-xs">
                            ✓
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
                                className="w-8 h-8 rounded-xl bg-[#10291F] border border-white/10 text-[#F5F3EC] hover:text-[#C98A24]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
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
                            className="w-8 h-8 rounded-xl bg-[#10291F] border border-white/10 text-rose-400 hover:bg-rose-500/10"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
           </div>

            {addresses.length === 0 && !isLoading && (
               <div className="p-6 md:p-8 text-center bg-[#10291F] rounded-2xl border border-white/10">
                  <div className="w-12 h-12 rounded-2xl bg-[#061A13] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#C98A24]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-xs text-[#AAB8B0] uppercase tracking-wider mb-4">No saved addresses found</p>
               </div>
            )}

            {/* Add buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
                <AddressFormDialog 
                userId={userId} 
                onSuccess={fetchAddresses} 
                trigger={
                    <Button type="button" variant="outline" className="h-14 rounded-xl border border-white/10 bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] hover:text-[#C98A24] transition-all">
                    <div className="w-7 h-7 rounded-lg bg-[#061A13] flex items-center justify-center mr-3 shrink-0 text-[#C98A24]">
                        <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold uppercase text-xs tracking-wider">Add New Address</span>
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
                    className="h-14 rounded-xl border border-white/10 bg-[#10291F] text-[#F5F3EC] hover:bg-[#164431] transition-all"
                    >
                    <div className="w-7 h-7 rounded-lg bg-[#061A13] flex items-center justify-center mr-3 shrink-0 text-[#C98A24]">
                        <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold uppercase text-xs tracking-wider">Manual Enter</span>
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
