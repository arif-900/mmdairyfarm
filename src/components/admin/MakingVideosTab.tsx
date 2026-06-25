import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Plus, Trash2, Edit, Loader2, Video, Eye, EyeOff, Upload, Link as LinkIcon, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MakingOfSection } from "@/components/home/MakingOfSection";

interface ProductionVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'url' | 'upload';
  isActive: boolean;
  storagePath?: string;
}

export const MakingVideosTab = () => {
  const [videos, setVideos] = useState<ProductionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form State
  const [currentVideo, setCurrentVideo] = useState<Partial<ProductionVideo>>({
    title: "",
    description: "",
    url: "",
    type: 'url',
    isActive: true
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bucketError, setBucketError] = useState<string | null>(null);

  useEffect(() => {
    checkBucket();
    fetchVideos();
  }, []);

  const checkBucket = async () => {
    try {
      // Testing bucket access by listing objects (more permissive than getBucket)
      const { data, error } = await supabase.storage.from('production_videos').list('', { limit: 1 });

      if (error) {
        // If it's a 400/404, it likely doesn't exist or policies are missing
        setBucketError("Bucket 'production_videos' needs configuration. Ensure it's PUBLIC and has 'SELECT' policies enabled.");
      } else {
        setBucketError(null);
      }
    } catch (err) {
      setBucketError("Could not verify storage. Please ensure the bucket exists.");
    }
  };

  const getYouTubeId = (url: string) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:v\/|e(?:mbed)?\/|shorts\/|watch\?v=|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "production_videos")
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setVideos(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err: any) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (video?: ProductionVideo) => {
    if (video) {
      setCurrentVideo(video);
    } else {
      setCurrentVideo({
        id: crypto.randomUUID(),
        title: "",
        description: "",
        url: "",
        type: 'url',
        isActive: true
      });
    }
    setUploadFile(null);
    setIsDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    try {
      if (file.size > 48 * 1024 * 1024) {
        throw new Error("File too large. Your bucket limit is 48MB.");
      }
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('production_videos')
        .upload(filePath, file);

      if (uploadError) {
        // Detailed error messages for common Supabase Storage issues
        if (uploadError.message.includes('bucket not found') || (uploadError as any).status === 400) {
          throw new Error("Storage Error: Please ensure a PUBLIC bucket named 'production_videos' exists in your Supabase Dashboard (Storage tab).");
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('production_videos')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    } catch (err: any) {
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentVideo.title || (!currentVideo.url && !uploadFile && currentVideo.type === 'url')) {
      toast({ title: "Validation Error", description: "Title and Video Source are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let finalVideo = { ...currentVideo } as ProductionVideo;

      if (uploadFile) {
        const { publicUrl, filePath } = await handleUpload(uploadFile);
        finalVideo.url = publicUrl;
        finalVideo.storagePath = filePath;
        finalVideo.type = 'upload';
      }

      let updatedVideos;
      const exists = videos.find(v => v.id === finalVideo.id);
      if (exists) {
        updatedVideos = videos.map(v => v.id === finalVideo.id ? finalVideo : v);
      } else {
        updatedVideos = [...videos, finalVideo];
      }

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "production_videos",
          value: JSON.stringify(updatedVideos)
        }, { onConflict: 'key' });

      if (error) throw error;

      setVideos(updatedVideos);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Video saved successfully" });
    } catch (err: any) {
      toast({ title: "Error Saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (video: ProductionVideo) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      // Delete from storage if it was an upload
      if (video.type === 'upload' && video.storagePath) {
        await supabase.storage.from('production_videos').remove([video.storagePath]);
      }

      const updatedVideos = videos.filter(v => v.id !== video.id);

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "production_videos",
          value: JSON.stringify(updatedVideos)
        }, { onConflict: 'key' });

      if (error) throw error;
      setVideos(updatedVideos);
      toast({ title: "Deleted", description: "Video removed successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleVisibility = async (videoId: string, status: boolean) => {
    try {
      const updatedVideos = videos.map(v => v.id === videoId ? { ...v, isActive: status } : v);

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "production_videos",
          value: JSON.stringify(updatedVideos)
        }, { onConflict: 'key' });

      if (error) throw error;
      setVideos(updatedVideos);
      toast({ title: "Success", description: `Video \${status ? 'is now visible' : 'is now hidden'} on homepage` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end pb-8 border-b border-forest/10">
        <div>
          <h2 className="text-3xl font-black text-forest uppercase tracking-tighter italic flex items-center gap-3">
            <Video className="h-7 w-7 text-forest" />
            Story Studio
          </h2>
          <p className="text-[12px] text-muted-foreground font-bold tracking-widest uppercase opacity-40">Administrative Content Management</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-forest hover:bg-forest/90 text-white rounded-[10px] h-12 px-8 font-black uppercase text-xs tracking-widest shadow-xl shadow-forest/10 transition-all active:scale-95">
          <Plus className="h-4 w-4 mr-2" />New Story
        </Button>
      </div>

      <div className="space-y-6">

        {bucketError && (
          <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-[10px]">
                <Video className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-900 leading-tight">Configuring Storage Policies</p>
                <p className="text-xs text-amber-700 font-medium">Your bucket exists! Now add <strong>Policies</strong> in Supabase for: <span className="underline decoration-amber-300 font-black">SELECT</span>, <span className="underline decoration-amber-300 font-black">INSERT</span>, and <span className="underline decoration-amber-300 font-black">DELETE</span>.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={checkBucket} className="rounded-[10px] border-amber-200 text-amber-900 font-black h-10 px-6 uppercase text-[10px] tracking-widest hover:bg-amber-100">
              Refresh Setup
            </Button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-forest" />
            <p className="text-xs font-black uppercase tracking-widest text-forest/40">Fetching Cine-data...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white/30 backdrop-blur-sm border-2 border-dashed border-forest/10 rounded-[10px] p-20 text-center">
            <div className="w-20 h-20 bg-forest/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="h-10 w-10 text-forest/20" />
            </div>
            <p className="text-lg font-bold text-forest/40">No production stories yet.</p>
            <p className="text-xs font-medium text-forest/30 mt-1">Start by adding a video of your farm process.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {videos.map((video) => (
              <Card key={video.id} className={`group overflow-hidden rounded-[10px] border border-forest/5 shadow-soft transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 ${!video.isActive ? "opacity-50 grayscale" : ""}`}>
                <div className="aspect-video relative overflow-hidden bg-forest/5">
                  {video.type === 'url' ? (
                    <div className="w-full h-full bg-forest-dark flex items-center justify-center relative overflow-hidden">
                      <Video className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                      {getYouTubeId(video.url) && (
                        <img
                          src={`https://img.youtube.com/vi/${getYouTubeId(video.url)}/hqdefault.jpg`}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 blur-[0.5px] group-hover:blur-0 grow scale-110 group-hover:scale-100"
                          alt={video.title}
                        />
                      )}
                    </div>
                  ) : video.url ? (
                    <video
                      src={video.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Video className="h-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${video.isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-400 text-white"}`}>
                      {video.isActive ? "Live" : "Draft"}
                    </span>
                  </div>
                </div>
                <CardHeader className="p-6 pb-2 space-y-1">
                  <CardTitle className="text-base font-black text-forest uppercase tracking-tight line-clamp-1">{video.title}</CardTitle>
                  <CardDescription className="text-[10px] font-medium opacity-50 line-clamp-1">{video.description}</CardDescription>
                </CardHeader>
                <CardFooter className="p-6 pt-0 flex flex-col gap-4">
                  <div className="h-px w-full bg-forest/5" />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Switch
                        className="data-[state=checked]:bg-emerald-500"
                        checked={video.isActive}
                        onCheckedChange={(status) => toggleVisibility(video.id, status)}
                      />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-forest/40">Visible</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(video)} className="h-10 w-10 rounded-[10px] hover:bg-forest/5 hover:text-forest transition-colors">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(video)} className="h-10 w-10 rounded-[10px] hover:bg-rose-50 hover:text-rose-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-[10px] overflow-hidden border-none shadow-3xl bg-white/95 backdrop-blur-2xl max-h-[95vh] flex flex-col">
          <DialogHeader className="p-6 pb-5 bg-forest text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-golden/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <DialogTitle className="text-3xl font-display font-black italic uppercase tracking-tighter flex items-center gap-4 relative z-10">
              <div className="p-2.5 bg-golden/20 rounded-[10px]">
                <Video className="h-6 w-6 text-golden" />
              </div>
              {currentVideo.id ? "Edit Story" : "New Story"}
            </DialogTitle>
            <DialogDescription className="text-white/60 font-medium text-xs tracking-wide mt-2 relative z-10">
              Configure your production display story with premium visuals.
            </DialogDescription>
          </DialogHeader>

          <div className="p-7 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Story Title</Label>
              <Input
                value={currentVideo.title}
                onChange={e => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                placeholder="e.g. Traditional Ghee Crafting"
                className="rounded-[10px] h-12 border-slate-100"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-forest/40 ml-1">Short Description</Label>
              <Textarea
                value={currentVideo.description}
                onChange={e => setCurrentVideo({ ...currentVideo, description: e.target.value })}
                placeholder="Briefly describe what happens in this video..."
                className="rounded-[10px] min-h-[120px] bg-white border-forest/10 focus:border-forest/30 focus:ring-forest/5 shadow-inner p-4 text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-5">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-forest/40 ml-1">Video Source</Label>
              <div className="flex rounded-[10px] bg-forest/5 p-1.5 border border-forest/10">
                <Button
                  type="button"
                  variant={currentVideo.type === 'url' ? 'default' : 'ghost'}
                  onClick={() => setCurrentVideo({ ...currentVideo, type: 'url' })}
                  className="flex-1 rounded-[10px] font-bold h-10 text-[11px] uppercase tracking-wider"
                >
                  <LinkIcon className="h-3 w-3 mr-2" /> URL Link
                </Button>
                <Button
                  type="button"
                  variant={currentVideo.type === 'upload' ? 'default' : 'ghost'}
                  onClick={() => setCurrentVideo({ ...currentVideo, type: 'upload' })}
                  className={`flex-1 rounded-[10px] font-black h-10 text-[10px] uppercase tracking-widest transition-all ${currentVideo.type === 'upload' ? 'bg-forest text-white shadow-lg' : 'text-forest/40 hover:text-forest'}`}
                >
                  <Upload className="h-4 w-4 mr-2" /> Direct Upload
                </Button>
              </div>

              {currentVideo.type === 'url' ? (
                <div className="space-y-2">
                  <Input
                    value={currentVideo.url}
                    onChange={e => setCurrentVideo({ ...currentVideo, url: e.target.value })}
                    placeholder="YouTube or Vimeo URL"
                    className="rounded-[10px] h-12 border-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 font-medium italic">Supports YouTube, Vimeo, or direct MP4 links.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-200 rounded-[10px] p-6 text-center hover:border-forest/40 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={e => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-forest/5 rounded-full flex items-center justify-center mb-2">
                        <Upload className="h-5 w-5 text-forest" />
                      </div>
                      <p className="text-xs font-bold text-slate-600">
                        {uploadFile ? uploadFile.name : "Select Video File"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">MP4, WebM recommended (Max 48MB)</p>
                    </div>
                  </div>
                  {currentVideo.url && !uploadFile && (
                    <p className="text-[10px] text-forest font-bold text-center">Current video: {(currentVideo as any).storagePath || 'Uploaded Video'}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 bg-slate-50 border-t flex-shrink-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving} className="rounded-[10px] font-black text-[10px] uppercase tracking-widest">Discard</Button>
            <Button onClick={handleSave} disabled={saving || isUploading} className="rounded-[10px] h-12 px-8 bg-forest hover:bg-forest/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl border-b-4 border-forest-dark active:border-b-0 active:translate-y-1 transition-all">
              {(saving || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentVideo.id ? "Commit Change" : "Publish Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
