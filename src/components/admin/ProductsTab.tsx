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
import { Package, Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
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

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductsTab() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const { toast } = useToast();

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
        } else {
            setCurrentProduct({
                name: "",
                description: "",
                price: 0,
                stock: 0,
                unit: "1 Liter",
                image_url: "",
                is_active: true,
            });
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

            const payload = {
                name: currentProduct.name,
                description: currentProduct.description || null,
                price: Number(currentProduct.price),
                stock: Number(currentProduct.stock),
                unit: currentProduct.unit || "Unit",
                image_url: currentProduct.image_url || null,
                is_active: currentProduct.is_active ?? true,
            };

            if (currentProduct.id) {
                // Update
                const { error } = await supabase
                    .from("products")
                    .update(payload)
                    .eq("id", currentProduct.id);
                if (error) throw error;
                toast({ title: "Success", description: "Product updated successfully." });
            } else {
                // Insert
                const { error } = await supabase
                    .from("products")
                    .insert([payload]);
                if (error) throw error;
                toast({ title: "Success", description: "New product created successfully." });
            }

            setIsDialogOpen(false);
            fetchProducts();
        } catch (error: any) {
            // Check for missing stock column error
            if (error.code === '42703' && error.message.includes('stock')) {
                toast({
                    title: "Database Migration Required",
                    description: "You must run the 'add-product-stock.sql' in Supabase before saving products with inventory.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Failed to save product",
                    description: error.message,
                    variant: "destructive",
                });
            }
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
            // Check if it has orders first? Maybe just attempt delete and catch foreign key error.
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", productToDelete.id);

            if (error) {
                if (error.code === '23503') {
                    throw new Error("Cannot delete product because it has associated orders or subscriptions. Try disabling it instead.");
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
                    <h2 className="text-2xl font-bold tracking-tight">Stock Management</h2>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p>No products found in the catalog.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Image</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            {product.image_url ? (
                                                <div className="w-10 h-10 rounded overflow-hidden border">
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 border flex items-center justify-center text-gray-400">
                                                    <ImageIcon className="h-5 w-5" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-foreground">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.unit}</p>
                                        </TableCell>
                                        <TableCell className="font-semibold">₹{product.price}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock} in stock
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={product.is_active}
                                                onCheckedChange={(c) => toggleStatus(product, c)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(product)}>
                                                <Trash2 className="h-4 w-4" />
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{currentProduct?.id ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Fill out the form below to manage this product's details and active stock.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={currentProduct?.name || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. Fresh Cow Milk"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="unit" className="text-right">Unit</Label>
                            <Input
                                id="unit"
                                value={currentProduct?.unit || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, unit: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. 1 Liter / 500 gm"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                value={currentProduct?.price || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">Stock Qty</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={currentProduct?.stock || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right mt-2">Description</Label>
                            <Textarea
                                id="description"
                                value={currentProduct?.description || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                className="col-span-3"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image_url" className="text-right">Image URL</Label>
                            <Input
                                id="image_url"
                                value={currentProduct?.image_url || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, image_url: e.target.value })}
                                className="col-span-3"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{productToDelete?.name}".
                            If this product has existing orders or subscriptions attached to it, the database will block the deletion to protect your order history. In that case, simply disable the "Status" toggle instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete Product</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
