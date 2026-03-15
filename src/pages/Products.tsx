import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { useStoreProducts } from "@/data/products";
import { Loader2 } from "lucide-react";

const Products = () => {
  const { products, loading } = useStoreProducts();

  return (
    <Layout>
      {/* Page Header */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-main text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
            Our Products
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto animate-fade-in">
            Fresh, natural dairy products made with love and traditional methods.
            Delivered straight from our farm to your table.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="section-padding">
        <div className="container-main">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No products are currently available in the store.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quality Promise */}
      <section className="section-padding bg-secondary/30">
        <div className="container-main text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-foreground mb-6">
            Our Quality Promise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-background rounded-xl shadow-soft">
              <div className="text-3xl mb-3">🥛</div>
              <h3 className="font-semibold text-foreground mb-2">No Additives</h3>
              <p className="text-sm text-muted-foreground">
                100% pure milk with no preservatives or water added
              </p>
            </div>
            <div className="p-6 bg-background rounded-xl shadow-soft">
              <div className="text-3xl mb-3">🌿</div>
              <h3 className="font-semibold text-foreground mb-2">Natural Feed</h3>
              <p className="text-sm text-muted-foreground">
                Cattle fed with organic fodder and clean drinking water
              </p>
            </div>
            <div className="p-6 bg-background rounded-xl shadow-soft">
              <div className="text-3xl mb-3">⏰</div>
              <h3 className="font-semibold text-foreground mb-2">Same Day Fresh</h3>
              <p className="text-sm text-muted-foreground">
                Milked in the morning, delivered to you by evening
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
