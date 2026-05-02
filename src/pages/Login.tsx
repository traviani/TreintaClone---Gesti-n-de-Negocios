import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Eye, EyeOff, Key, Fingerprint } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, recoverPassword, auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { isBiometricAvailable, authenticateWithBiometrics, registerLocalPasskey } from '../lib/biometrics';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await isBiometricAvailable();
      setBiometricSupported(available);
      const enrolledUser = localStorage.getItem('biometric_enrolled_user');
      setIsEnrolled(!!enrolledUser);
    };
    checkBiometrics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isReset) {
        await recoverPassword(email);
        setSuccess('¡Correo de recuperación enviado! Revisa tu bandeja de entrada.');
        setIsReset(false);
      } else if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        const userCredential = await loginWithEmail(email, password);
        
        // Si el login es exitoso y biometría está disponible pero no enrolada, preguntar
        if (biometricSupported && !isEnrolled && userCredential.user.email) {
          if (confirm('¿Deseas habilitar el ingreso con tu huella o rostro en este dispositivo?')) {
            await registerLocalPasskey(userCredential.user.email);
            setIsEnrolled(true);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Usuario no encontrado.');
      else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta.');
      else if (err.code === 'auth/email-already-in-use') setError('El correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
      else setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const userEmail = await authenticateWithBiometrics();
      
      if (userEmail) {
        // En una app real, aquí usaríamos un token de biometría verificado por el servidor.
        // Para este prototipo, si la biometría es exitosa, informamos al usuario.
        // Nota: Para login real sin password se requiere configuración de Firebase Identity Platform.
        setSuccess(`Autenticación biométrica exitosa para ${userEmail}. Conectando...`);
        // Simulamos el ingreso por ahora si no tenemos el backend de custom tokens configurado
        alert("Autenticación biométrica exitosa. En un entorno de producción, esto genera un token de acceso seguro.");
      } else {
        setError('No se pudo verificar la identidad biométrica.');
      }
    } catch (err) {
      console.error(err);
      setError('Error en el sensor biométrico.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError('Error al ingresar con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/50 rotate-3"
            >
              <LogIn className="text-white" size={36} />
            </motion.div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Inversiones Traviani</h1>
            <p className="text-blue-200/60 text-xs font-bold uppercase tracking-[0.3em]">Gestión de Negocios</p>
          </div>

          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-center text-red-600 text-sm font-bold"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-center text-emerald-600 text-sm font-bold"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              {!isReset && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center px-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsReset(!isReset);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  {isReset ? 'Volver al ingreso' : '¿Olvidaste tu contraseña?'}
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] italic shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isReset ? <Key size={16} /> : isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                    {isReset ? 'Enviar Recuperación' : isRegister ? 'Crear Cuenta' : 'Ingresar al Sistema'}
                  </>
                )}
              </button>

              {biometricSupported && !isReset && !isRegister && (
                <button 
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  className={cn(
                    "w-full rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] italic shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3",
                    isEnrolled ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-400 hover:bg-slate-200 border-2 border-dashed border-slate-300"
                  )}
                >
                  <Fingerprint size={18} />
                  {isEnrolled ? 'Ingresar con Biometría' : 'Activar Llave de Acceso'}
                </button>
              )}
            </form>

            {!isReset && (
              <>
                <div className="relative my-10">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-300 bg-white px-4 tracking-[0.3em]">
                    O continúa con
                  </div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-2xl py-4 flex items-center justify-center gap-4 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/icon_google.svg" width={22} height={22} alt="Google" />
                  Google
                </button>
              </>
            )}

            <div className="mt-10 text-center">
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setIsReset(false);
                  setError(null);
                }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                {isRegister ? '¿Ya tienes cuenta? Ingresa aquí' : '¿No tienes cuenta? Registrate'}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Inversiones Traviani &copy; 2024</p>
      </motion.div>
    </div>
  );
}
