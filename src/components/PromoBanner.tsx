import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  Check, 
  X, 
  Edit3, 
  Eye, 
  EyeOff, 
  Megaphone,
  Tag,
  Flame,
  Percent,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, getGoogleDriveDirectLink } from '../lib/utils';
import { DEFAULT_OWNER_ID } from '../constants';

export interface CatalogBannerData {
  id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  discountText?: string;
  linkUrl?: string;
  targetAudience?: 'all' | 'detal' | 'mayor';
  isActive: boolean;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
}

interface PromoBannerProps {
  banner: CatalogBannerData | null;
  priceType: 'detal' | 'mayor';
  ownerId: string;
  isOwner?: boolean;
  onBannerUpdated?: (updated: CatalogBannerData | null) => void;
}

export function PromoBanner({
  banner,
  priceType,
  ownerId,
  isOwner = true,
  onBannerUpdated
}: PromoBannerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Check if banner should be displayed for current priceType
  const audience = banner?.targetAudience || 'all';
  const isTargetMatch = audience === 'all' || audience === priceType;
  const shouldShow = banner && banner.isActive && isTargetMatch && Boolean(banner.imageUrl);

  if (!shouldShow && !isOwner) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 pt-6">
        {shouldShow ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative group overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl shadow-slate-900/10 border border-slate-800/80"
          >
            {/* Background Image with optimized overlay */}
            <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden">
              <img 
                src={getGoogleDriveDirectLink(banner.imageUrl)} 
                alt={banner.title || 'Propaganda Promocional'} 
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              
              {/* Gradient Scrim for text readability if text exists */}
              {(banner.title || banner.subtitle || banner.badge || banner.discountText) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col justify-end p-5 sm:p-7 md:p-8" />
              )}

              {/* Floating Content / Text Overlay */}
              {(banner.title || banner.subtitle || banner.badge || banner.discountText) && (
                <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-end">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {banner.badge && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-md">
                        <Flame size={13} className="text-slate-950 animate-pulse" />
                        {banner.badge}
                      </span>
                    )}

                    {banner.discountText && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-md">
                        <Percent size={12} />
                        {banner.discountText}
                      </span>
                    )}

                    {priceType === 'detal' && (
                      <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-slate-300 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full">
                        Especial Detal
                      </span>
                    )}
                  </div>

                  {banner.title && (
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic serif tracking-tight text-white drop-shadow-md leading-tight">
                      {banner.title}
                    </h2>
                  )}

                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 sm:mt-1.5 max-w-xl line-clamp-2 drop-shadow leading-relaxed font-medium">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Owner Management Overlay Button */}
            {isOwner && (
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                <button 
                  onClick={() => setIsEditorOpen(true)}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-900 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer border border-white/40"
                  title="Gestionar o Cambiar Imagen del Banner"
                >
                  <Edit3 size={13} className="text-blue-600" />
                  <span>Editar Banner</span>
                </button>
              </div>
            )}
          </motion.div>
        ) : isOwner ? (
          /* Empty State for Store Owner to easily add a banner */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-2 border-dashed border-blue-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all hover:border-blue-300"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                <Megaphone size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Publica una Propaganda o Banner Promocional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                  Tus clientes verán este anuncio en grande cuando ingresen al catálogo al detal.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsEditorOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-100 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Upload size={14} />
              <span>Cargar Imagen / Promoción</span>
            </button>
          </motion.div>
        ) : null}
      </div>

      {/* Banner Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <BannerEditorModal 
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            initialBanner={banner}
            ownerId={ownerId}
            onSaved={(saved) => {
              if (onBannerUpdated) onBannerUpdated(saved);
              setIsEditorOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ----------------------------------------------------
// Banner Editor & Image Upload Modal Component
// ----------------------------------------------------

interface BannerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBanner: CatalogBannerData | null;
  ownerId: string;
  onSaved: (saved: CatalogBannerData | null) => void;
}

export function BannerEditorModal({
  isOpen,
  onClose,
  initialBanner,
  ownerId,
  onSaved
}: BannerEditorModalProps) {
  const [imageUrl, setImageUrl] = useState(initialBanner?.imageUrl || '');
  const [title, setTitle] = useState(initialBanner?.title || '');
  const [subtitle, setSubtitle] = useState(initialBanner?.subtitle || '');
  const [badge, setBadge] = useState(initialBanner?.badge || '🔥 ¡OFERTA ESPECIAL!');
  const [discountText, setDiscountText] = useState(initialBanner?.discountText || '');
  const [targetAudience, setTargetAudience] = useState<'all' | 'detal' | 'mayor'>(
    initialBanner?.targetAudience || 'detal'
  );
  const [isActive, setIsActive] = useState<boolean>(
    initialBanner?.isActive !== undefined ? initialBanner.isActive : true
  );
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and compress image to keep it lightweight and fast
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    setIsProcessingFile(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(compressedDataUrl);
          setIsProcessingFile(false);
        } else {
          setImageUrl(event.target?.result as string);
          setIsProcessingFile(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('No se pudo procesar la imagen seleccionada.');
        setIsProcessingFile(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setErrorMsg('Debes cargar una imagen o colocar un enlace web para el banner.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const targetDocId = `catalog_${ownerId || DEFAULT_OWNER_ID}`;
      const bannerData: CatalogBannerData = {
        imageUrl: imageUrl.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        discountText: discountText.trim(),
        targetAudience,
        isActive,
        ownerId: ownerId || DEFAULT_OWNER_ID,
        updatedAt: serverTimestamp(),
        createdAt: initialBanner?.createdAt || serverTimestamp()
      };

      await setDoc(doc(db, 'banners', targetDocId), bannerData, { merge: true });
      onSaved(bannerData);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setErrorMsg('Error al guardar el banner: ' + (err?.message || 'Intenta de nuevo'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este banner promocional?')) return;

    try {
      setIsSaving(true);
      const targetDocId = `catalog_${ownerId || DEFAULT_OWNER_ID}`;
      await deleteDoc(doc(db, 'banners', targetDocId));
      onSaved(null);
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      setErrorMsg('Error al eliminar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick preset templates for rapid promotion creation
  const applyPreset = (preset: { title: string; subtitle: string; badge: string; discountText: string }) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setBadge(preset.badge);
    setDiscountText(preset.discountText);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-6 sm:p-8 card-depth max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-100">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black italic serif text-slate-900">
                Banner y Propaganda de Promociones
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Configuración del Catálogo Digital
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Image Upload / Source */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>1. Imagen de la Propaganda / Banner *</span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 text-[10px] font-bold lowercase underline"
                >
                  cambiar imagen
                </button>
              )}
            </label>

            {/* Drag & Drop File Picker or Preview Box */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 group">
                <div className="h-44 sm:h-52 w-full relative">
                  <img 
                    src={getGoogleDriveDirectLink(imageUrl)} 
                    alt="Vista previa" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <Upload size={14} />
                      Subir otra
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-red-700"
                    >
                      <Trash2 size={14} />
                      Quitar
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium truncate">Imagen lista para publicar</span>
                  <span className="text-emerald-600 font-black flex items-center gap-1">
                    <Check size={14} /> Cargada
                  </span>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                  isProcessingFile ? "bg-blue-50 border-blue-400" : "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
                )}
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 text-blue-600 flex items-center justify-center">
                  {isProcessingFile ? (
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {isProcessingFile ? 'Optimizando imagen...' : 'Haz clic para subir imagen o arrástrala aquí'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos recomendados: JPG, PNG o WebP (horizontal, ej. 1200x500 px)
                  </p>
                </div>
              </div>
            )}

            {/* Direct URL Alternative Input */}
            <div className="relative mt-2">
              <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="O pega aquí un link directo de imagen o Google Drive..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              Plantillas Rápidas de Ejemplo:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset({
                  title: '¡Super Promoción de la Semana!',
                  subtitle: 'Disfruta de nuestros mejores precios al detal en productos seleccionados.',
                  badge: '🔥 OFERTA LIMITADA',
                  discountText: '20% OFF'
                })}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[11px] font-bold text-slate-600 transition-colors"
              >
                ⚡ Oferta de la Semana
              </button>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: '¡Combos y Nuevos Lanzamientos!',
                  subtitle: 'Lleva más por menos. Consulta promociones especiales para entrega inmediata.',
                  badge: '🎉 NUEVOS PRODUCTOS',
                  discountText: 'COMBO ESPECIAL'
                })}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[11px] font-bold text-slate-600 transition-colors"
              >
                🎉 Combo / Novedades
              </button>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Descuentos Exclusivos al Detal',
                  subtitle: 'Haz tu pedido hoy y recibe atención rápida y directa por WhatsApp.',
                  badge: '⭐ RECOMENDADO',
                  discountText: 'ENVÍO GRATIS'
                })}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[11px] font-bold text-slate-600 transition-colors"
              >
                🚚 Envío / Detal
              </button>
            </div>
          </div>

          {/* Section 2: Promotional Texts */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              2. Textos de la Propaganda (Opcionales)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Etiqueta / Badge</label>
                <input 
                  type="text"
                  placeholder="Ej: 🔥 ¡OFERTA ESPECIAL!"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Texto de Descuento</label>
                <input 
                  type="text"
                  placeholder="Ej: 15% OFF, 2x1, Envío Gratis..."
                  value={discountText}
                  onChange={(e) => setDiscountText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Título Principal</label>
              <input 
                type="text"
                placeholder="Ej: ¡Gran Liquidación y Precios Especiales!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Descripción o Subtítulo</label>
              <textarea 
                rows={2}
                placeholder="Ej: Aprovecha nuestras promociones activas por tiempo limitado en todos los pedidos..."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Section 3: Audience & State Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Dónde mostrar</label>
              <select 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="detal">Solo en Catálogo al Detal (Recomendado)</option>
                <option value="all">En Ambos (Detal y Mayorista)</option>
                <option value="mayor">Solo en Catálogo Mayorista</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Estado de la Propaganda</label>
              <div 
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                  isActive ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-200 text-slate-500"
                )}
              >
                <div className="flex items-center gap-2">
                  {isActive ? <Eye size={16} className="text-emerald-600" /> : <EyeOff size={16} />}
                  <span className="text-xs font-black uppercase">
                    {isActive ? 'Publicado y Visible' : 'Pausado / Oculto'}
                  </span>
                </div>
                <div className={cn(
                  "w-9 h-5 rounded-full p-0.5 transition-colors relative",
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform",
                    isActive ? "translate-x-4" : "translate-x-0"
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            {initialBanner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-3 text-red-600 hover:bg-red-50 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar Banner
              </button>
            )}

            <div className="flex-1 w-full flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving || !imageUrl}
                className="flex-1 sm:flex-initial px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Publicar Banner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
