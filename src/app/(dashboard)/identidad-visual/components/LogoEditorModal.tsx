"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/cropImage";
import { Crop, ZoomIn, RotateCw, Loader2, Maximize, Undo2, Image as ImageIcon } from "lucide-react";

interface LogoEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onSave: (croppedFile: File) => void;
    onSkip: () => void;
}

export function LogoEditorModal({ isOpen, onClose, imageSrc, onSave, onSkip }: LogoEditorModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
        setAspectRatio(1);
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        try {
            setIsProcessing(true);
            const croppedImageFile = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            if (croppedImageFile) {
                onSave(croppedImageFile as File);
            }
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[650px] border-white/10 bg-zinc-950 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                <Crop className="w-5 h-5 text-pink-400" /> Editar Logo
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 mt-1">
                                Ajusta el tamaño, recorta o rota tu logo. O úsalo tal como está.
                            </DialogDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onSkip} className="text-zinc-400 hover:text-white mt-1 border border-white/5 bg-white/5">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Usar Original (Sin Recorte)
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative w-full h-[300px] sm:h-[350px] bg-black/60 rounded-xl overflow-hidden border border-white/5 my-2">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspectRatio}
                        cropShape="rect"
                        showGrid={true}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                    />
                </div>

                <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs px-3 py-1 h-auto ${aspectRatio === 1 ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                            onClick={() => setAspectRatio(1)}
                        >
                            Cuadrado (1:1)
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs px-3 py-1 h-auto ${aspectRatio === undefined ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                            onClick={() => setAspectRatio(undefined)}
                        >
                            <Maximize className="w-3 h-3 mr-1" />
                            Libre
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleReset} title="Deshacer cambios" className="text-zinc-400 hover:text-white">
                        <Undo2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-zinc-300"><ZoomIn className="w-4 h-4" /> Zoom</span>
                            <span className="text-zinc-500 font-mono">{zoom.toFixed(1)}x</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(v) => setZoom(v[0])}
                            className="[&>span:first-child]:bg-pink-500/20 [&>span:first-child>span]:bg-pink-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-zinc-300"><RotateCw className="w-4 h-4" /> Rotación</span>
                            <span className="text-zinc-500 font-mono">{rotation}°</span>
                        </div>
                        <Slider
                            value={[rotation]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={(v) => setRotation(v[0])}
                            className="[&>span:first-child]:bg-orange-500/20 [&>span:first-child>span]:bg-orange-500"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-6 sm:justify-between gap-2 border-t border-white/5 pt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 bg-transparent hover:bg-white/5 text-zinc-300">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 border-0 text-white"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</span>
                        ) : "Aplicar Recorte"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
