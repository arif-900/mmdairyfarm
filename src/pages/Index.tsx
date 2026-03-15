import { Link } from "react-router-dom";
import { Droplets, MapPin, Truck, ArrowRight, MessageCircle, Milk } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import TrustBadge from "@/components/home/TrustBadge";
import ProductCard from "@/components/products/ProductCard";
import { useStoreProducts } from "@/data/products";
import heroFarm from "@/assets/hero-farm.jpg";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { products, loading } = useStoreProducts();
  const trustBadges = [
    {
      icon: Droplets,
      title: "100% Fresh Milk",
      description: "Farm-fresh milk delivered within hours of milking",
    },
    {
      icon: MapPin,
      title: "Local Farm",
      description: "Family-owned farm with generations of dairy expertise",
    },
    {
      icon: Truck,
      title: "Daily Delivery",
      description: "Doorstep delivery every morning, rain or shine",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroFarm}
            alt="MMVALI Dairy Farm"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/90 via-forest-dark/70 to-transparent" />
        </div>

        <div className="relative z-10 container-main section-padding">
          <div className="max-w-2xl animate-slide-up">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-cream mb-6 leading-tight">
              Pure Dairy Goodness,{" "}
              <span className="text-golden">Fresh From Our Farm</span>
            </h1>
            <p className="text-cream/90 text-lg md:text-xl mb-8 leading-relaxed">
              Welcome to MMVALI Dairy Farm. We deliver farm-fresh milk, curd, and ghee
              straight to your doorstep. Experience the taste of pure, natural dairy.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="accent" size="xl" asChild>
                <Link to="/products">
                  Explore Our Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="whatsapp" size="xl" asChild>
                <a
                  href="https://wa.me/919959091618?text=Hi, I'm interested in your dairy products!"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustBadges.map((badge, index) => (
              <TrustBadge
                key={index}
                icon={badge.icon}
                title={badge.title}
                description={badge.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding">
        <div className="container-main text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Welcome to MMVALI Dairy Farm
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            For generations, our family has been dedicated to raising healthy cattle and
            producing the finest dairy products. Our cows and buffaloes are fed with
            natural fodder and treated with love, ensuring you get the purest milk possible.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="default" size="lg" asChild>
              <Link to="/products">View Our Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Fresh Products
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              All products are prepared fresh daily using traditional methods passed down through generations.
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No products are currently available. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-main text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Order now and experience farm-fresh dairy delivered to your doorstep every morning.
          </p>
          <Button variant="accent" size="xl" asChild>
            <Link to="/order">
              Start Your Order
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
