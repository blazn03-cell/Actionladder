import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image, Download, Share, Clock, Users, MapPin, Palette, Layout, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { generatePoster, generateBreakAndRunPoster } from '@/lib/poster-generator';
import type { PosterData } from '@/lib/poster-generator';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  aPlayerId: string;
  bPlayerId: string;
  hallId: string;
  scheduledAt: string;
  status: string;
}

interface PosterGenerationModalProps {
  challenge: Challenge;
  onClose: () => void;
  onGenerate: (template: string, theme: string) => void;
  isGenerating: boolean;
}

interface PosterOptions {
  templates: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  themes: Array<{
    id: string;
    name: string;
    description: string;
    colors: { primary: string; secondary: string; accent: string };
  }>;
}

export function PosterGenerationModal({ 
  challenge, 
  onClose, 
  onGenerate, 
  isGenerating 
}: PosterGenerationModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('fight-night');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Fetch poster options
  const { data: options, isLoading: optionsLoading } = useQuery<PosterOptions>({
    queryKey: ['/api/poster/options'],
    queryFn: () => apiRequest('/api/poster/options').then(res => res.options),
  });

  // Fetch poster data when template/theme changes
  const { data: posterData, isLoading: posterLoading } = useQuery<{ data: PosterData }>({
    queryKey: ['/api/poster/challenge', challenge.id, selectedTemplate, selectedTheme],
    queryFn: () => apiRequest(`/api/poster/challenge/${challenge.id}?template=${selectedTemplate}&theme=${selectedTheme}`),
    enabled: !!challenge.id,
  });

  const handleGeneratePoster = async () => {
    if (!posterData?.data) return;
    
    try {
      // Set the template and theme in poster data
      const updatedPosterData = {
        ...posterData.data,
        design: {
          template: selectedTemplate as any,
          theme: selectedTheme as any
        }
      };
      
      const imageUrl = await generatePoster(updatedPosterData);
      setGeneratedImageUrl(imageUrl);
      
      toast({
        title: 'Poster Generated!',
        description: 'Your challenge poster is ready for download.',
      });
      
      // Trigger the callback to parent component
      onGenerate(selectedTemplate, selectedTheme);
    } catch (error) {
      console.error('Error generating poster:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate poster. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPoster = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `challenge-${challenge.id}-poster.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Poster Downloaded',
      description: 'Poster has been saved to your downloads.',
    });
  };

  const handleSharePoster = async () => {
    if (!generatedImageUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      
      const file = new File([blob], `challenge-${challenge.id}-poster.png`, {
        type: 'image/png',
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Challenge Poster',
          text: `Check out this ActionLadder challenge: ${challenge.title}`,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Challenge link copied to clipboard.',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to share poster. Try downloading instead.',
        variant: 'destructive',
      });
    }
  };

  const challengeDate = new Date(challenge.scheduledAt);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-green-500/20 text-green-400 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-green-500/20 pb-4">
          <DialogTitle className="text-green-400 flex items-center gap-2">
            <Image className="h-5 w-5" />
            Generate Challenge Poster
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6 py-6">
          
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            
            {/* Challenge Info */}
            <Card className="bg-gray-800/50 border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Challenge Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-green-400 font-semibold">{challenge.title}</h4>
                  <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/50">
                    {challenge.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-400/70">
                  <Clock className="h-3 w-3" />
                  {challengeDate.toLocaleDateString()} at {challengeDate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-400/70">
                  <MapPin className="h-3 w-3" />
                  Hall: {challenge.hallId}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-400/70">
                  <Users className="h-3 w-3" />
                  {challenge.aPlayerId} vs {challenge.bPlayerId}
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="bg-gray-800/50 border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                {optionsLoading ? (
                  <div className="flex items-center gap-2 text-green-400/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading templates...
                  </div>
                ) : (
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="bg-gray-700/50 border-green-500/30 text-green-400">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-green-500/30">
                      {options?.templates.map(template => (
                        <SelectItem 
                          key={template.id} 
                          value={template.id}
                          className="text-green-400 focus:bg-green-500/20"
                        >
                          <div>
                            <div className="font-semibold">{template.name}</div>
                            <div className="text-xs text-green-400/70">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card className="bg-gray-800/50 border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                {optionsLoading ? (
                  <div className="flex items-center gap-2 text-green-400/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading themes...
                  </div>
                ) : (
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className="bg-gray-700/50 border-green-500/30 text-green-400">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-green-500/30">
                      {options?.themes.map(theme => (
                        <SelectItem 
                          key={theme.id} 
                          value={theme.id}
                          className="text-green-400 focus:bg-green-500/20"
                        >
                          <div>
                            <div className="font-semibold">{theme.name}</div>
                            <div className="text-xs text-green-400/70">{theme.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGeneratePoster}
              disabled={posterLoading || isGenerating || !posterData}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold py-3"
              data-testid="button-generate-poster"
            >
              {(posterLoading || isGenerating) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Generate Poster
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <Card className="bg-gray-800/50 border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400 text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[2/3] bg-gray-700/50 rounded-lg border-2 border-dashed border-green-500/30 flex items-center justify-center">
                  {generatedImageUrl ? (
                    <img
                      src={generatedImageUrl}
                      alt="Generated poster"
                      className="w-full h-full object-contain rounded-lg"
                      data-testid="img-poster-preview"
                    />
                  ) : posterLoading ? (
                    <div className="text-center text-green-400/70">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Loading preview...
                    </div>
                  ) : (
                    <div className="text-center text-green-400/50">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Click Generate to create poster</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {generatedImageUrl && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleDownloadPoster}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-download-poster"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={handleSharePoster}
                      variant="outline"
                      className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      data-testid="button-share-poster"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Poster Data Preview */}
            {posterData?.data && (
              <Card className="bg-gray-800/50 border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-400 text-sm">Content Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="text-green-400/70">Event:</span>
                    <span className="ml-2 text-green-400">{posterData.data.event.title}</span>
                  </div>
                  <div>
                    <span className="text-green-400/70">Hype:</span>
                    <span className="ml-2 text-green-400 font-bold">{posterData.data.event.hypeText}</span>
                  </div>
                  <div>
                    <span className="text-green-400/70">Players:</span>
                    <span className="ml-2 text-green-400">
                      {posterData.data.player1.name} ({posterData.data.player1.rating}) vs{' '}
                      {posterData.data.player2.name} ({posterData.data.player2.rating})
                    </span>
                  </div>
                  <div>
                    <span className="text-green-400/70">Call to Action:</span>
                    <span className="ml-2 text-green-400 font-semibold">{posterData.data.event.callToAction}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
}