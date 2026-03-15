import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: string | number;
  unit: string;
  image?: string;
  stock?: number;
}

const ProductCard = ({ id, name, description, price, unit, image, stock }: ProductCardProps) => {
  const isOutOfStock = stock !== undefined && stock <= 0;

  return (
    <div className={`card-elevated overflow-hidden group relative ${isOutOfStock ? 'opacity-80' : ''}`}>
      <div className="aspect-square overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? 'grayscale' : 'group-hover:scale-105'}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
            <span className="bg-red-600 text-white font-bold px-4 py-2 rounded shadow-lg transform -rotate-12 text-lg">
              OUT OF STOCK
            </span>
          </div>
        )}
        {stock !== undefined && stock > 0 && stock < 10 && (
          <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
            Only {stock} left!
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-foreground mb-2 flex justify-between items-start">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px]">
          {description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-2xl font-bold text-primary">₹{price}</span>
            <span className="text-muted-foreground text-sm">/{unit}</span>
          </div>
          {isOutOfStock ? (
            <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed border-red-200 text-red-700 bg-red-50">
              Sold Out
            </Button>
          ) : (
            <Button variant="accent" size="sm" asChild>
              <Link to={`/order?product=${id}`}>Order Now</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
