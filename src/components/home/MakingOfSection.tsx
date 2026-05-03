import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Video, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductionVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'url' | 'upload';
  isActive: boolean;
  storagePath?: string;
}

export function MakingOfSection() {
  const [videos, setVideos] = useState<ProductionVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ProductionVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "production_videos")
          .maybeSingle();

        if (error) throw error;

        if (data && data.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          const activeVideos = (Array.isArray(parsed) ? parsed : []).filter((v: any) => v.isActive);
          setVideos(activeVideos);
        }
      } catch (err) {
        console.error("Failed to fetch production videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('video-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.production_videos'
        },
        () => fetchVideos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loading && videos.length === 0) return null;

  const getYouTubeId = (url: string) => {
    // Robust regex to handle standard URLs, embed URLs, youtu.be, and shorts
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:v\/|e(?:mbed)?\/|shorts\/|watch\?v=|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = getYouTubeId(url);
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return url;
  };

  const isEmbeddable = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  return (
    <section className="section-padding bg-cream/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-forest/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-golden/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

      <div className="container-main relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest/5 border border-forest/10 mb-4 animate-fade-in">
            <Sparkles className="w-4 h-4 text-golden" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-forest">The Process of Purity</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest leading-tight">
            {"See How We Craft Purity".split(" ").map((word, i) => (
              <span key={i} className="inline-block mr-[0.3em] animate-character-reveal opacity-0" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}>
                {word}
              </span>
            ))}
          </h2>
          <p className="text-forest/60 text-lg max-w-2xl mx-auto font-medium italic animate-slide-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
            Transparency is our primary ingredient. Explore the journey of our products from farm to table.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-forest/5 rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
              <div 
                key={video.id} 
                className="group relative aspect-video rounded-[32px] overflow-hidden bg-forest/10 border border-forest/5 shadow-soft hover:shadow-2xl transition-all duration-500 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${(index + 5) * 0.1}s`, animationFillMode: 'forwards' }}
                onClick={() => setSelectedVideo(video)}
              >
                {/* Fallback pattern for URLs that don't auto-thumbnail */}
                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors z-10" />
                
                {video.type === 'upload' && video.url ? (
                  <video 
                    src={video.url} 
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      (e.target as any).src = ""; // Clear broken source
                    }}
                    onMouseOver={(e) => {
                      if (e.currentTarget.readyState >= 2) {
                        e.currentTarget.play().catch(() => {});
                      }
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.pause(); 
                      e.currentTarget.currentTime = 0; 
                    }}
                  />
                ) : video.type === 'upload' ? (
                   <div className="w-full h-full bg-forest-dark flex items-center justify-center relative overflow-hidden">
                    <Video className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-forest-dark flex items-center justify-center relative overflow-hidden">
                    <Video className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    {(video.url.includes('youtube.com') || video.url.includes('youtu.be')) && getYouTubeId(video.url) && (
                        <img 
                            src={`https://img.youtube.com/vi/${getYouTubeId(video.url)}/hqdefault.jpg`} 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 blur-[2px] group-hover:blur-0 grow scale-110 group-hover:scale-100"
                            alt={video.title}
                        />
                    )}
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h4 className="text-white font-display text-xl md:text-2xl font-bold mb-1 drop-shadow-lg">{video.title}</h4>
                  <p className="text-white/80 text-xs font-medium line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 italic">{video.description}</p>
                </div>

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className="w-16 h-16 rounded-full bg-golden/90 backdrop-blur-sm flex items-center justify-center text-forest scale-90 group-hover:scale-110 group-hover:bg-golden transition-all duration-500 shadow-xl border border-white/20">
                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal Player */}
       {/* Video Modal Player */}
       <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
         <DialogContent className="p-0 bg-transparent border-none shadow-none max-h-[92vh] flex items-center justify-center lg:max-w-7xl md:max-w-5xl w-[98vw] md:w-[95vw]">
           <DialogHeader className="sr-only">
             <DialogTitle>{selectedVideo?.title}</DialogTitle>
             <DialogDescription>{selectedVideo?.description}</DialogDescription>
           </DialogHeader>
           
           <div className={`relative w-full flex flex-col md:flex-row overflow-hidden rounded-[32px] bg-black/95 backdrop-blur-3xl shadow-3xl border border-white/10 h-full md:h-auto max-h-[90vh]`}>
             
             {/* Close Button - More distinct */}
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setSelectedVideo(null)}
               className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xl transition-all hover:rotate-90 border border-white/5 shadow-2xl"
             >
               <X className="w-5 h-5" />
             </Button>
 
             {/* Video Portion - Adaptive width */}
             <div className={`relative bg-black flex items-center justify-center overflow-hidden shrink-0 \${selectedVideo?.url.includes('shorts') ? 'w-full md:w-[400px] lg:w-[450px] aspect-[9/16] md:aspect-auto h-[70vh] md:h-full' : 'w-full md:flex-1 aspect-video md:aspect-auto h-auto'}`}>
               <div className={`w-full h-full flex items-center justify-center \${selectedVideo?.url.includes('shorts') ? 'aspect-[9/16]' : 'aspect-video'}`}>
                 {selectedVideo && (
                   isEmbeddable(selectedVideo.url) ? (
                     <iframe 
                       src={getEmbedUrl(selectedVideo.url)}
                       className="w-full h-full border-none"
                       allow="autoplay; fullscreen; picture-in-picture" 
                       title={selectedVideo.title}
                     />
                   ) : (
                     <video 
                       src={selectedVideo.url}
                       className="w-full h-full object-contain"
                       controls
                       autoPlay
                       playsInline
                     />
                   )
                 )}
               </div>
             </div>
 
             {/* Description Portion - Consistent Side Section */}
             <div className={`flex flex-col bg-forest-dark/30 backdrop-blur-xl md:w-[350px] lg:w-[400px] w-full p-6 md:p-8 lg:p-10 border-l border-white/5 min-h-0`}>
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="p-1.5 md:p-2 bg-golden/20 rounded-xl">
                    <Sparkles className="w-4 h-4 md:w-5 h-5 text-golden" />
                  </div>
                  <DialogTitle className="text-lg md:text-xl lg:text-2xl font-display font-black text-golden tracking-tight uppercase italic leading-tight">
                    {selectedVideo?.title}
                  </DialogTitle>
                </div>
 
                <div className="overflow-y-auto pr-2 md:pr-4 custom-scrollbar flex-grow min-h-0">
                  <p className="text-white/80 text-xs md:text-sm lg:text-base leading-relaxed font-medium italic mb-6 md:mb-8">
                    {selectedVideo?.description}
                  </p>
                  
                  <div className="space-y-4 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                         <Video className="w-4 h-4 text-golden" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold leading-none mb-1">Feature</span>
                        <span className="text-xs text-white/80 font-bold">Process Story</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                         <Sparkles className="w-4 h-4 text-golden" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold leading-none mb-1">Quality</span>
                        <span className="text-xs text-white/80 font-bold">Traceability Guaranteed</span>
                      </div>
                    </div>
                  </div>
                </div>
 
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-30">
                   <div className="text-[8px] text-white font-black uppercase tracking-[0.3em]">MM Dairy Farm</div>
                   <div className="text-[8px] text-white font-black uppercase tracking-[0.3em] italic">Crafting Purity</div>
                </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </section>
  );
}
