import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Scale, Info } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductsTab() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> & { delivery_days?: number | null }>({});
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const { toast } = useToast();

    // Helper to handle weight array as string
    const [weightsString, setWeightsString] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error: any) {
            console.error("Error fetching products:", error);
            toast({
                title: "Failed to load products",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setCurrentProduct(product);
            setWeightsString(product.available_weights?.join(", ") || "250, 500, 1000");
        } else {
            setCurrentProduct({
                name: "",
                description: "",
                price: 0,
                stock: 0,
                unit: "1kg",
                image_url: "",
                is_active: true,
                base_price_per_kg: 0,
                unit_type: "g",
                available_weights: [250, 500, 1000],
                original_price: null,
                background_gif: null
            } as any);
            setWeightsString("250, 500, 1000");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!currentProduct?.name || currentProduct.price === undefined || currentProduct.stock === undefined) {
            toast({ title: "Validation Error", description: "Name, price, and stock are required", variant: "destructive" });
            return;
        }

        try {
            setIsSaving(true);

            // Parse weights
            const weights = weightsString.split(",").map(w => parseInt(w.trim())).filter(w => !isNaN(w));

            const payload = {
                name: currentProduct.name,
                description: currentProduct.description || null,
                price: Number(currentProduct.price),
                stock: Number(currentProduct.stock),
                unit: currentProduct.unit || "Unit",
                image_url: currentProduct.image_url || null,
                is_active: currentProduct.is_active ?? true,
                // New Dynamic Pricing Fields
                base_price_per_kg: currentProduct.base_price_per_kg ? Number(currentProduct.base_price_per_kg) : Number(currentProduct.price),
                available_weights: weights.length > 0 ? weights : [250, 500, 1000],
                unit_type: currentProduct.unit_type || "g",
                delivery_days: currentProduct.delivery_days ?? 3,
                original_price: currentProduct.original_price ? Number(currentProduct.original_price) : null,
                background_gif: (currentProduct as any).background_gif || null,
            };

            if (currentProduct.id) {
                const { error } = await supabase
                    .from("products")
                    .update(payload)
                    .eq("id", currentProduct.id);
                if (error) throw error;
                toast({ title: "Success", description: "Product updated successfully." });
            } else {
                const { error } = await supabase
                    .from("products")
                    .insert([payload]);
                if (error) throw error;
                toast({ title: "Success", description: "New product created successfully." });
            }

            setIsDialogOpen(false);
            fetchProducts();
        } catch (error: any) {
            toast({
                title: "Failed to save product",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", productToDelete.id);

            if (error) {
                if (error.code === '23503') {
                    throw new Error("Cannot delete product because it has associated orders. Try disabling it instead.");
                }
                throw error;
            }

            toast({ title: "Product Deleted", description: `${productToDelete.name} was removed.` });
            fetchProducts();
        } catch (error: any) {
            toast({
                title: "Delete Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const toggleStatus = async (product: Product, newStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("products")
                .update({ is_active: newStatus })
                .eq("id", product.id);

            if (error) throw error;
            fetchProducts();
            toast({ title: "Status Updated", description: `${product.name} is now ${newStatus ? 'Active' : 'Disabled'}.` });
        } catch (error: any) {
            toast({
                title: "Action Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2 bg-primary">
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Package className="h-12 w-12 mx-auto text-slate-200 mb-2" />
                        <p>No products found in the catalog.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product details</TableHead>
                                    <TableHead>Base Price</TableHead>
                                    <TableHead>Weights</TableHead>
                                    <TableHead>Lead Time</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50/30 transition-colors">
                                        <TableCell>
                                            {product.image_url ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                    <ImageIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold text-slate-900">{product.name}</p>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{product.unit}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">₹{product.base_price_per_kg || product.price}</span>
                                                    {product.original_price && product.original_price > (product.base_price_per_kg || product.price) && (
                                                        <span className="text-xs text-rose-500 line-through">₹{product.original_price}</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400">per 1000{product.unit_type || 'g'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {product.available_weights?.map(w => (
                                                    <span key={w} className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold rounded text-slate-500">
                                                        {w}{product.unit_type || 'g'}
                                                    </span>
                                                )) || <span className="text-slate-300 text-xs">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {(product as any).delivery_days === 0 ? (
                                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    Same Day
                                                </span>
                                            ) : (product as any).delivery_days > 0 ? (
                                                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    Delivers in {(product as any).delivery_days} days
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] italic">3 Day Default</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                product.stock > 10 ? 'bg-emerald-50 text-emerald-600' : product.stock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                            )}>
                                                {product.stock} Units
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={product.is_active}
                                                onCheckedChange={(c) => toggleStatus(product, c)}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)} className="h-8 w-8 rounded-lg">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)} className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 rounded-[32px] overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-xl font-black italic flex items-center gap-2 uppercase tracking-tighter">
                            <Scale className="h-5 w-5 text-primary" />
                            {currentProduct?.id ? "Modify Product" : "Launch New Product"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Basic Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Identity</Label>
                                    <Input
                                        id="name"
                                        value={currentProduct?.name || ""}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        className="rounded-xl h-12"
                                        placeholder="Product Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit" className="text-xs font-bold uppercase tracking-widest text-slate-500">Display Unit</Label>
                                    <Input
                                        id="unit"
                                        value={currentProduct?.unit || ""}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, unit: e.target.value })}
                                        className="rounded-xl h-12"
                                        placeholder="e.g. 1kg / 1L"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Inventory</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={currentProduct?.stock || ""}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                                        className="rounded-xl h-12"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Pricing Feature */}
                            <div className="space-y-4 p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Weight-Based Pricing</h3>
                                
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="base_price" className="text-xs font-bold uppercase tracking-widest text-emerald-700">Base Price (Per 1000)</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black italic">₹</span>
                                                <Input
                                                    id="base_price"
                                                    type="number"
                                                    value={currentProduct?.base_price_per_kg || ""}
                                                    onChange={(e) => setCurrentProduct({ ...currentProduct, base_price_per_kg: parseFloat(e.target.value), price: parseFloat(e.target.value) })}
                                                    className="rounded-xl h-12 pl-8 border-emerald-200"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="original_price" className="text-xs font-bold uppercase tracking-widest text-emerald-700">Original Price (Sale)</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black italic">₹</span>
                                                <Input
                                                    id="original_price"
                                                    type="number"
                                                    value={currentProduct?.original_price || ""}
                                                    onChange={(e) => setCurrentProduct({ ...currentProduct, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                                                    className="rounded-xl h-12 pl-8 border-emerald-200"
                                                    placeholder="e.g. 150"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                <div className="space-y-2">
                                    <Label htmlFor="unit_type" className="text-xs font-bold uppercase tracking-widest text-emerald-700">Unit Type</Label>
                                    <Select 
                                        value={currentProduct?.unit_type || "g"} 
                                        onValueChange={(v) => setCurrentProduct({ ...currentProduct, unit_type: v })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-emerald-200">
                                            <SelectValue placeholder="Select Unit" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="g">Grams (g)</SelectItem>
                                            <SelectItem value="ml">Milliliters (ml)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="weights" className="text-xs font-bold uppercase tracking-widest text-emerald-700">Weight Variants</Label>
                                    <Input
                                        id="weights"
                                        value={weightsString}
                                        onChange={(e) => setWeightsString(e.target.value)}
                                        className="rounded-xl h-12 border-emerald-200"
                                        placeholder="250, 500, 1000"
                                    />
                                    <p className="text-[9px] text-emerald-600/60 font-medium italic">Separate values with commas</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-500">Story Telling (Description)</Label>
                                <Textarea
                                    id="description"
                                    value={currentProduct?.description || ""}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    className="rounded-2xl min-h-[100px]"
                                    placeholder="Details about origin, ingredients, and craft..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="delivery_days" className="text-xs font-bold uppercase tracking-widest text-slate-500">Delivery Lead Time (Days)</Label>
                                <Input
                                    id="delivery_days"
                                    type="number"
                                    value={currentProduct?.delivery_days ?? ""}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, delivery_days: e.target.value ? parseInt(e.target.value) : null })}
                                    className="rounded-xl h-12"
                                    min="0"
                                />
                                <p className="text-[9px] text-slate-400 font-medium italic">How many days from order to delivery</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_url" className="text-xs font-bold uppercase tracking-widest text-slate-500">Feature Image Link</Label>
                            <Input
                                id="image_url"
                                value={currentProduct?.image_url || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, image_url: e.target.value })}
                                className="rounded-xl h-12"
                                placeholder="Paste Unsplash or Direct URL"
                            />
                        </div>

                        <div className="space-y-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <Label htmlFor="background_gif" className="text-xs font-bold uppercase tracking-widest text-indigo-700">Detail Page Background GIF (Optional)</Label>
                            <Input
                                id="background_gif"
                                value={(currentProduct as any)?.background_gif || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, background_gif: e.target.value } as any)}
                                className="rounded-xl h-12 border-indigo-200"
                                placeholder="Paste GIF URL for a premium dynamic background"
                            />
                            <p className="text-[9px] text-indigo-600/60 font-medium italic">Animated background for the product detail page</p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t items-center justify-between">
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setCurrentProduct({ ...currentProduct, is_active: !currentProduct?.is_active })}>
                            <Switch
                                checked={currentProduct?.is_active ?? true}
                                onCheckedChange={(c) => setCurrentProduct({ ...currentProduct, is_active: c })}
                            />
                            <span className="text-[10px] font-black uppercase text-slate-400">Live Status</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="rounded-xl font-black text-[10px] uppercase tracking-widest">Discard</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-[0.2em] shadow-xl border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Commit Change
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[32px] p-8 border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Vanish Product?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 italic">
                            This will permanently remove <span className="font-bold text-slate-900">"{productToDelete?.name}"</span> from the catalog. Existing historical orders will still refer to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8">
                        <AlertDialogCancel className="rounded-xl font-black text-[10px] uppercase">Wait, No</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase">Yes, vanish it</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
