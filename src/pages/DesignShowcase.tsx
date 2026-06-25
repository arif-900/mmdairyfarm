import React from 'react';
import FloatingProductCard from '@/components/products/FloatingProductCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockProducts = [
  {
    id: '1',
    name: 'Organic Whole Milk',
    price: 85,
    originalPrice: 95,
    category: 'Fresh Dairy',
    image: 'https://images.unsplash.com/photo-1550583724-125581f77033?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Pure Desi Ghee',
    price: 650,
    originalPrice: 720,
    category: 'Premium Quality',
    image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Fresh Farm Curd',
    price: 45,
    originalPrice: 50,
    category: 'Daily Essential',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Artisan Paneer',
    price: 320,
    originalPrice: 350,
    category: 'Handcrafted',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800&auto=format&fit=crop',
  }
];

const DesignShowcase = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#121212] transition-colors duration-500">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative container-main section-padding">
        {/* Header */}
        <header className="mb-16 space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="group mb-8 hover:bg-white/50 dark:hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">UI Design Showcase</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1]">
            Floating <span className="text-gradient">Product Cards</span>
          </h1>
          
          <p className="max-w-2xl text-lg text-slate-500 dark:text-slate-400 font-medium">
            Experience the next level of product presentation with continuous motion, 
            layered shadows, and glassmorphic depth effects.
          </p>
        </header>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pb-20">
          {mockProducts.map((product) => (
            <FloatingProductCard
              key={product.id}
              {...product}
              onAddToCart={() => console.log('Added to cart:', product.name)}
            />
          ))}
        </div>

        {/* Feature List */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-t border-slate-200 dark:border-white/10">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Continuous Motion</h3>
            <p className="text-slate-500 dark:text-slate-400">Smooth 4s infinite float animation using GPU-optimized transform properties.</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Layered Depth</h3>
            <p className="text-slate-500 dark:text-slate-400">Combining outer soft shadows with inner glows and glassmorphic borders.</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Responsive & Performant</h3>
            <p className="text-slate-500 dark:text-slate-400">Pure CSS animations ensure zero JS overhead during the floating effect.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignShowcase;
