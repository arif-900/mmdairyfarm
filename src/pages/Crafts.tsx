import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Play, Video, X, Film, Clock, Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductionVideo {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'url' | 'upload';
  isActive: boolean;
  storagePath?: string;
  duration?: string;
  created_at?: string;
  createdAt?: string;
}

export default function Crafts() {
  const [videos, setVideos] = useState<ProductionVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ProductionVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error: err } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "production_videos")
          .maybeSingle();

        if (err) throw err;

        if (data && data.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          const activeVideos = (Array.isArray(parsed) ? parsed : []).filter((v: any) => v && v.isActive);

          // Sort newest first by created_at / createdAt timestamp
          const sorted = [...activeVideos].sort((a: any, b: any) => {
            const timeA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt).getTime() : 0;
            const timeB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).getTime() : 0;
            if (timeA && timeB) return timeB - timeA;
            return 0;
          });

          setVideos(sorted);
        } else {
          setVideos([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch all craft videos:", err);
        setError("Craft videos are temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    const channel = supabase
      .channel('all-craft-video-updates')
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

  const getYouTubeId = (url: string) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:v\/|e(?:mbed)?\/|shorts\/|watch\?v=|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url?.match(regex);
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
    <Layout>
      {/* PAGE HEADER */}
      <section className="bg-[#082D20] pt-10 pb-8 border-b border-white/10 text-[#F5F3EC]">
        <div className="container-main mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-[#9AAFA4] hover:text-[#C98A24] hover:bg-white/5 -ml-2 mb-2 rounded-xl text-xs font-bold"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
            </Link>
          </Button>

          <div className="space-y-2 max-w-3xl">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#C98A24]">
              THE PROCESS OF PURITY
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F3EC] tracking-tight">
              All Craft <span className="text-[#C98A24]">Stories</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9AAFA4] leading-relaxed max-w-xl">
              Discover every chapter of our farm journey, sustainable dairy practices, and natural craft stories.
            </p>
          </div>
        </div>
      </section>

      {/* ALL CRAFT VIDEOS GRID */}
      <section className="py-10 sm:py-16 bg-[#061A13] min-h-[60vh] text-[#F5F3EC]">
        <div className="container-main mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video bg-[#0B2D20] border border-white/10 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-[#9AAFA4] text-xs font-medium bg-[#0B2D20] rounded-2xl border border-white/10 p-6 max-w-md mx-auto">
              {error}
            </div>
          ) : videos.length === 0 ? (
            <div className="bg-[#0B2D20] border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-[#10291F] border border-white/10 flex items-center justify-center mx-auto text-[#C98A24]">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EC]">No craft stories available yet.</h3>
              <p className="text-xs text-[#9AAFA4]">Check back soon for new videos from our farm.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-[#9AAFA4]">
                <span>Showing All {videos.length} {videos.length === 1 ? 'Craft Video' : 'Craft Videos'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className="group relative aspect-video bg-[#0B2D20] border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:-translate-y-1 hover:border-[#C98A24]/50 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Media Thumbnail */}
                    <div className="absolute inset-0 bg-[#08251A] overflow-hidden">
                      {video.type === 'url' && getYouTubeId(video.url) ? (
                        <img
                          src={`https://img.youtube.com/vi/${getYouTubeId(video.url)}/hqdefault.jpg`}
                          alt={video.title}
                          width="480"
                          height="360"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#08251A] text-[#9AAFA4] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#10291F] via-[#08251A] to-[#061A13]" />
                          <Video className="w-10 h-10 text-[#C98A24] opacity-50 relative z-10" />
                          <span className="text-[10px] font-bold text-[#C98A24]/70 uppercase tracking-widest mt-1.5 relative z-10">Craft Process</span>
                        </div>
                      )}

                      {/* Gradient Backdrop */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 group-hover:from-black/70 transition-colors" />
                    </div>

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 hover:bg-[#C98A24] backdrop-blur-md text-white hover:text-[#061A13] flex items-center justify-center shadow-xl transition-all group-hover:scale-110 border border-white/30">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="relative z-10 p-4 mt-auto flex items-end justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-[#F5F3EC] text-sm sm:text-base drop-shadow-md group-hover:text-[#C98A24] transition-colors leading-snug">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#C98A24] font-medium">
                          <Compass className="w-3.5 h-3.5" />
                          <span>Craft Journey</span>
                        </div>
                      </div>

                      {video.duration && (
                        <div className="flex items-center gap-1 text-[10px] text-white/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                          <Clock className="w-3 h-3 text-[#C98A24]" />
                          <span>{video.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* VIDEO MODAL PLAYER */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="p-0 bg-[#08251A] border border-[#C98A24]/20 shadow-2xl max-w-4xl w-[calc(100%-24px)] md:w-[90vw] max-h-[92vh] md:max-h-[90vh] rounded-2xl overflow-hidden flex flex-col my-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedVideo?.title || "Craft Video"}</DialogTitle>
          </DialogHeader>

          {/* FIXED 16:9 VIDEO CONTAINER */}
          <div className="relative w-full aspect-video flex-shrink-0 bg-black flex items-center justify-center overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedVideo(null)}
              className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/10"
            >
              <X className="w-4 h-4" />
            </Button>

            {selectedVideo && (
              isEmbeddable(selectedVideo.url) ? (
                <iframe
                  src={getEmbedUrl(selectedVideo.url)}
                  className="w-full h-full border-none block"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={selectedVideo.title}
                />
              ) : (
                <video
                  src={selectedVideo.url}
                  className="w-full h-full object-contain block"
                  controls
                  autoPlay
                  playsInline
                />
              )
            )}
          </div>

          {/* SCROLLABLE DESCRIPTION AREA */}
          {selectedVideo && (
            <div className="flex-1 min-h-0 p-4 sm:p-6 bg-[#0B2D20] border-t border-white/10 flex flex-col overflow-hidden">
              <h3 className="text-base sm:text-lg font-extrabold text-[#F5F3EC] shrink-0 mb-2">
                {selectedVideo.title}
              </h3>
              {selectedVideo.description && (
                <div className="flex-1 min-h-0 overflow-y-auto max-h-[180px] sm:max-h-[220px] pr-2 text-xs sm:text-sm text-[#9AAFA4] leading-relaxed custom-scrollbar">
                  <p className="whitespace-pre-wrap">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
