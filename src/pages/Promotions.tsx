import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff, 
  Flame, 
  Percent, 
  ExternalLink, 
  Share2, 
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Monitor,
  Tag,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { cn, getGoogleDriveDirectLink } from '../lib/utils';
import { CatalogBannerData } from '../components/PromoBanner';
import { Link } from 'react-router-dom';

export default function Promotions() {
  const { user, effectiveUid } = useAuth();
  const ownerId = effectiveUid || DEFAULT_OWNER_ID;

  const [banner, setBanner] = useState<CatalogBannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('🔥 ¡OFERTA ESPECIAL!');
  const [discountText, setDiscountText] = useState('15% OFF');
  const [targetAudience, setTargetAudience] = useState<'all' | 'detal' | 'mayor'>('detal');
  const [isActive, setIsActive] = useState(true);

  // UI Preview options
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewAudience, setPreviewAudience] = useState<'detal' | 'mayor'>('detal');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time listener for current banner
  useEffect(() => {
    setLoading(true);
    const bannerDocRef = doc(db, 'banners', `catalog_${ownerId}`);
    
    const unsubscribe = onSnapshot(bannerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as CatalogBannerData;
        setBanner(data);
        setImageUrl(data.imageUrl || '');
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setBadge(data.badge || '');
        setDiscountText(data.discountText || '');
        setTargetAudience(data.targetAudience || 'detal');
        setIsActive(data.isActive !== undefined ? data.isActive : true);
      } else {
        setBanner(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching banner in Promotions page:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId]);

  // Image compressor helper
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
      setErrorMsg('Por favor carga una imagen o pega un enlace de imagen para publicar el banner.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSaveSuccess(false);

      const targetDocId = `catalog_${ownerId}`;
      const bannerData: CatalogBannerData = {
        imageUrl: imageUrl.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        discountText: discountText.trim(),
        targetAudience,
        isActive,
        ownerId,
        updatedAt: serverTimestamp(),
        createdAt: banner?.createdAt || serverTimestamp()
      };

      await setDoc(doc(db, 'banners', targetDocId), bannerData, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setErrorMsg('Error al guardar la propaganda: ' + (err?.message || 'Intente nuevamente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar esta propaganda? Los clientes ya no la verán en el catálogo.')) {
      return;
    }

    try {
      setIsSaving(true);
      const targetDocId = `catalog_${ownerId}`;
      await deleteDoc(doc(db, 'banners', targetDocId));
      setImageUrl('');
      setTitle('');
      setSubtitle('');
      setBadge('');
      setDiscountText('');
      setBanner(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      setErrorMsg('Error al eliminar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (preset: {
    title: string;
    subtitle: string;
    badge: string;
    discountText: string;
    targetAudience: 'all' | 'detal' | 'mayor';
    sampleImage?: string;
  }) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setBadge(preset.badge);
    setDiscountText(preset.discountText);
    setTargetAudience(preset.targetAudience);
    if (preset.sampleImage && !imageUrl) {
      setImageUrl(preset.sampleImage);
    }
  };

  // Audience matching for live preview
  const isPreviewAudienceMatch = targetAudience === 'all' || targetAudience === previewAudience;
  const isLiveBannerVisible = isActive && Boolean(imageUrl) && isPreviewAudienceMatch;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <Megaphone size={20} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic serif text-slate-900 tracking-tight">
              Publicidad y Banners Promocionales
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium ml-13">
            Crea propagandas y anuncios llamativos que verán tus clientes al entrar al catálogo digital al detal o mayorista.
          </p>
        </div>

        {/* Quick Links to Catalogs */}
        <div className="flex items-center gap-2">
          <Link
            to="/catalog"
            target="_blank"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ShoppingBag size={14} className="text-blue-600" />
            <span>Ver Catálogo Detal</span>
            <ExternalLink size={12} className="text-slate-400" />
          </Link>
          <Link
            to="/catalog?type=mayor"
            target="_blank"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Share2 size={14} className="text-amber-400" />
            <span>Ver Mayorista</span>
            <ExternalLink size={12} className="text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm"
          >
            <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
              <Check size={16} />
            </div>
            <div>
              <p className="font-black uppercase tracking-wider">¡Publicidad actualizada con éxito!</p>
              <p className="font-normal text-emerald-700">Tus clientes ya pueden ver el banner en el catálogo en tiempo real.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-bold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Real-Time Interactive Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Promotion Creator Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Image Upload Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                <span>Cargar Imagen del Banner</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Obligatorio</span>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 group">
                <div className="h-52 sm:h-60 w-full relative">
                  <img 
                    src={getGoogleDriveDirectLink(imageUrl)} 
                    alt="Vista previa cargada" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                    >
                      <Upload size={14} />
                      Reemplazar Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-4 py-2.5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-red-700 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Quitar
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium truncate flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-blue-500" />
                    Imagen lista y optimizada
                  </span>
                  <span className="text-emerald-600 font-black flex items-center gap-1">
                    <Check size={14} /> Lista
                  </span>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                  isProcessingFile 
                    ? "bg-blue-50 border-blue-400" 
                    : "bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 text-blue-600 flex items-center justify-center">
                  {isProcessingFile ? (
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {isProcessingFile ? 'Procesando y optimizando imagen...' : 'Haz clic aquí para seleccionar imagen o arrástrala'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos: JPG, PNG o WebP. Recomendado en formato panorámico / horizontal (ej: 1200x500 px).
                  </p>
                </div>
              </div>
            )}

            {/* Direct URL input */}
            <div className="relative pt-1">
              <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="O escribe / pega una URL directa de imagen o Google Drive..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Preset Inspirations */}
          <div className="bg-blue-50/60 rounded-3xl p-5 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Plantillas y Textos Listos para Usar:
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset({
                  title: '¡Gran Oferta de la Semana!',
                  subtitle: 'Precios especiales al detal por tiempo limitado. Pide directo por WhatsApp.',
                  badge: '🔥 OFERTA LIMITADA',
                  discountText: 'HASTA 25% OFF',
                  targetAudience: 'detal'
                })}
                className="p-3 bg-white hover:bg-blue-100/60 text-left rounded-2xl border border-blue-100 transition-all text-xs font-bold text-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-black">⚡ Oferta Relámpago</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">Detal</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-normal line-clamp-1">
                  Hasta 25% OFF en productos seleccionados
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({
                  title: '¡Nuevos Sabores y Presentaciones!',
                  subtitle: 'Descubre nuestros productos recién preparados con la mejor calidad.',
                  badge: '🎉 NUEVO LANZAMIENTO',
                  discountText: 'COMBO ESPECIAL',
                  targetAudience: 'detal'
                })}
                className="p-3 bg-white hover:bg-blue-100/60 text-left rounded-2xl border border-blue-100 transition-all text-xs font-bold text-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-indigo-600 font-black">🎉 Nuevos Productos</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black">Detal</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-normal line-clamp-1">
                  Combos especiales y nuevos lanzamientos
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Descuentos Exclusivos en Tu Compra',
                  subtitle: 'Aprovecha nuestras promociones activas con entrega rápida garantizada.',
                  badge: '🚚 DESPACHO INMEDIATO',
                  discountText: 'ENVÍO GRATIS',
                  targetAudience: 'detal'
                })}
                className="p-3 bg-white hover:bg-blue-100/60 text-left rounded-2xl border border-blue-100 transition-all text-xs font-bold text-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 font-black">🚚 Envío y Despacho</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Detal</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-normal line-clamp-1">
                  Despacho inmediato y promociones al detal
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({
                  title: '¡Precios de Fábrica por Lotes!',
                  subtitle: 'Consulta nuestros escalones de precio al mayor para comerciantes y distribuidores.',
                  badge: '📦 PRECIOS MAYORISTAS',
                  discountText: 'VOLUMEN %',
                  targetAudience: 'all'
                })}
                className="p-3 bg-white hover:bg-blue-100/60 text-left rounded-2xl border border-blue-100 transition-all text-xs font-bold text-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 font-black">📦 Lotes y Mayor</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-black">Ambos</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-normal line-clamp-1">
                  Precios por bulto y distribución
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Promotional Texts Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                <span>Textos del Anuncio (Opcionales)</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Superpuestos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-500" />
                  <span>Insignia / Badge</span>
                </label>
                <input 
                  type="text"
                  placeholder="Ej: 🔥 ¡OFERTA ESPECIAL!"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Percent size={14} className="text-rose-500" />
                  <span>Etiqueta de Descuento</span>
                </label>
                <input 
                  type="text"
                  placeholder="Ej: 20% OFF, 2x1, Envío Gratis..."
                  value={discountText}
                  onChange={(e) => setDiscountText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-700">Título Principal de la Propaganda</label>
              <input 
                type="text"
                placeholder="Ej: ¡Gran Liquidación de Temporada y Precios Especiales!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-700">Descripción o Subtítulo</label>
              <textarea 
                rows={2}
                placeholder="Ej: Aprovecha nuestras ofertas activas en pedidos al detal para entrega inmediata..."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Section 3: Audience and Visibility */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                <span>Configuración de Visibilidad</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-700">¿Dónde se mostrará?</label>
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="detal">Solo en Catálogo al Detal (Recomendado)</option>
                  <option value="all">En Ambos Catálogos (Detal y Mayorista)</option>
                  <option value="mayor">Solo en Catálogo Mayorista</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-700">Estado de Publicación</label>
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
                      {isActive ? 'Publicado y Activo' : 'Pausado / Oculto'}
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
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {banner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-3 text-red-600 hover:bg-red-50 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-red-200"
              >
                <Trash2 size={16} />
                <span>Eliminar Propaganda</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !imageUrl}
              className="w-full sm:w-auto ml-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Guardar y Publicar en Catálogo</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-6 space-y-4">
            
            {/* Preview Controls Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Vista Previa en Vivo
                </h3>
              </div>

              {/* View simulation toggle: Detal vs Mayor */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewAudience('detal')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    previewAudience === 'detal' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Detal
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAudience('mayor')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    previewAudience === 'mayor' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Mayor
                </button>
              </div>
            </div>

            {/* Audience Status Badge */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Estado en catálogo simulado:</span>
              {isLiveBannerVisible ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Visible al público
                </span>
              ) : (
                <span className="text-amber-600 font-black">
                  {!imageUrl ? 'Sin imagen' : !isActive ? 'Pausado' : 'No coincide audiencia'}
                </span>
              )}
            </div>

            {/* Simulated Banner Container */}
            <div className="bg-slate-100 p-3 sm:p-4 rounded-3xl border border-slate-200">
              <div className="bg-white rounded-2xl p-2.5 mb-3 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-1 text-slate-400 font-mono text-[10px]">
                    tutienda.com/catalog{previewAudience === 'mayor' ? '?type=mayor' : ''}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  {previewAudience === 'detal' ? 'Al Detal' : 'Mayorista'}
                </span>
              </div>

              {/* Banner Rendering */}
              {imageUrl ? (
                <div className="relative group overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
                  <div className="relative w-full h-44 sm:h-52 overflow-hidden">
                    <img 
                      src={getGoogleDriveDirectLink(imageUrl)} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient Overlay */}
                    {(title || subtitle || badge || discountText) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col justify-end p-4" />
                    )}

                    {/* Text Overlay */}
                    {(title || subtitle || badge || discountText) && (
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {badge && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow">
                              <Flame size={11} className="text-slate-950" />
                              {badge}
                            </span>
                          )}

                          {discountText && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow">
                              <Percent size={11} />
                              {discountText}
                            </span>
                          )}

                          {previewAudience === 'detal' && (
                            <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-slate-300 bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-full">
                              Especial Detal
                            </span>
                          )}
                        </div>

                        {title && (
                          <h4 className="text-base sm:text-lg font-black italic serif tracking-tight text-white drop-shadow leading-tight">
                            {title}
                          </h4>
                        )}

                        {subtitle && (
                          <p className="text-xs text-slate-200 mt-1 max-w-sm line-clamp-2 drop-shadow leading-relaxed font-medium">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-44 sm:h-52 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ImageIcon size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Ninguna imagen cargada</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sube una imagen a la izquierda para verla aquí en tiempo real.</p>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                💡 Consejos para mayor impacto en tus ventas:
              </p>
              <ul className="space-y-1.5 text-[11px] text-slate-500 list-disc list-inside">
                <li>Usa fotos reales y llamativas de tus productos listos para entregar.</li>
                <li>Coloca ofertas claras como <i>"20% de descuento esta semana"</i> o <i>"Envío gratis en compras mayores a $20"</i>.</li>
                <li>Si tu imagen ya tiene texto diseñado incorporado, puedes dejar los campos de texto vacíos.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
