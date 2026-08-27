import { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Product } from "@/data/products";
import { useInfiniteProductsQuery } from "@/hooks/useInfiniteProductsQuery";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ArrowRight,
  Loader2,
  Search,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Products = () => {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  const {
    products,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProductsQuery({
    searchQuery: debouncedSearchQuery,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Intersection observer for automatic infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getUnit = (product: Product) =>
    product.unitType === "ml" ? "L" : "kg";

  const getPrice = (product: Product) =>
    product.basePricePerKg || product.price;

  return (
    <Layout>
      {/* COMPACT PRODUCT PAGE INTRO */}
      <section className="bg-[#082D20] pt-8 pb-6 border-b border-white/10">
        <div className="container-main mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Header Typography */}
          <div className="space-y-1.5 max-w-3xl">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#C98A24]">
              MM DAIRY FARM
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#F5F3EC] tracking-tight leading-none">
              OUR PRODUCTS
            </h1>
            <p className="text-[#AAB8B0] text-sm sm:text-base font-medium leading-relaxed">
              Fresh dairy products, made with care.
            </p>
          </div>

          {/* SEARCH FIELD (Integrated, 52px height, 14px radius) */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#718078]" />
            <Input
              aria-label="Search products"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-[52px] pl-11 pr-4 rounded-[14px] border border-white/10 bg-[#0B2118] text-[#F5F3EC] placeholder:text-[#718078] text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#C98A24]/40 shadow-xs"
            />
          </div>
        </div>
      </section>

      {/* PRODUCT LISTING SECTION */}
      <section className="bg-[#061A13] py-6 sm:py-10">
        <div className="container-main mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">

          {/* PRODUCT COUNT */}
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#AAB8B0]">
              Showing {products.length} of {totalCount} {totalCount === 1 ? 'product' : 'products'}
            </span>
          </div>

          {/* LOADING & EMPTY STATES */}
          {isLoading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#C98A24]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#AAB8B0]">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B2118]/80 backdrop-blur-md mb-4 border border-white/10">
                <ShoppingBag className="h-6 w-6 text-[#C98A24]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#F5F3EC]">
                No products found
              </h2>
              <p className="text-xs text-[#AAB8B0] mt-1 max-w-xs">
                Try adjusting your search query.
              </p>
              <button
                onClick={() => setSearchInput("")}
                className="mt-5 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0F8A5F] text-white hover:bg-[#123B2A] transition-all"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              {/* PRODUCT GRID (3 cols desktop, 2 cols tablet & mobile) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {products.map((product, index) => {
                  const displayPrice = getPrice(product);
                  const unitLabel = getUnit(product);
                  const isOnSale =
                    product.originalPrice &&
                    product.originalPrice > displayPrice;
                  const discountPct = isOnSale
                    ? Math.round(
                      ((product.originalPrice! - displayPrice) /
                        product.originalPrice!) *
                      100
                    )
                    : 0;

                  // Priority loading for top 2 visible cards, lazy for all others
                  const isTopVisible = index < 2;

                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group flex flex-col justify-between bg-[#0B2118]/75 backdrop-blur-md rounded-2xl sm:rounded-[18px] border border-white/10 p-3 sm:p-4 shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out hover:-translate-y-[4px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)] hover:border-[#C98A24]/40"
                    >
                      <div className="space-y-2.5 sm:space-y-3.5">
                        {/* DEDICATED PRODUCT IMAGE FRAME (12px radius, #F4EFE5 bg, object-contain fit) */}
                        <div className="relative aspect-[1/0.85] rounded-xl overflow-hidden bg-[#F4EFE5] flex items-center justify-center p-2.5 sm:p-5">
                          <img
                            src={product.image}
                            alt={product.name}
                            width="300"
                            height="255"
                            loading={isTopVisible ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full !object-contain object-center transition-transform duration-300 ease-out group-hover:scale-[1.025]"
                          />

                          {/* Refined Natural Gold Discount Badge */}
                          {isOnSale && (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                              <span className="bg-[#C98A24] text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 rounded-md shadow-xs">
                                Save {discountPct}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* PRODUCT NAME & DESCRIPTION */}
                        <div className="space-y-1">
                          <h3 className="font-display font-extrabold text-[#F5F3EC] text-sm sm:text-lg group-hover:text-[#C98A24] transition-colors leading-snug truncate">
                            {product.name}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[#AAB8B0] line-clamp-2 leading-relaxed font-normal">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* PRICE & VIEW PRODUCT CTA ROW */}
                      <div className="pt-2.5 sm:pt-3.5 mt-2.5 sm:mt-3.5 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap">
                          <span className="text-base sm:text-xl font-black text-[#C98A24]">
                            ₹{displayPrice}
                          </span>
                          {isOnSale && (
                            <span className="text-[10px] sm:text-xs text-[#718078] line-through mr-0.5">
                              ₹{product.originalPrice}
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs font-bold text-[#AAB8B0] uppercase tracking-wider">
                            / {unitLabel}
                          </span>
                        </div>

                        {/* Clean View Product Action */}
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0F8A5F] group-hover:text-[#C98A24] group-hover:translate-x-1.5 transition-all duration-300 ease-out">
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* INFINITE SCROLL / LOAD MORE TRIGGER */}
              <div ref={loadMoreRef} className="pt-8 pb-4 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 bg-[#0B2118] border border-white/10 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#C98A24]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more products...
                  </div>
                ) : hasNextPage ? (
                  <button
                    onClick={() => fetchNextPage()}
                    className="flex items-center gap-2 bg-[#0B2118] hover:bg-[#10291F] border border-white/10 hover:border-[#C98A24]/40 text-[#F5F3EC] hover:text-[#C98A24] px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md"
                  >
                    <span>Load More Products</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                ) : products.length > 0 ? (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#718078]">
                    You have viewed all {totalCount} products
                  </p>
                ) : null}
              </div>
            </>
          )}

        </div>
      </section>
    </Layout>
  );
};

export default Products;
