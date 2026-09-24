import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, UserCheck, AlertCircle, X, Info } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (role: 'tutor' | 'admin') => void;
  tutorPin: string;
  adminPin: string;
  targetActionLabel?: string;
  requiredRole?: 'tutor' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  tutorPin,
  adminPin,
  targetActionLabel,
  requiredRole
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = pinInput.trim();

    if (trimmed === adminPin) {
      onLoginSuccess('admin');
      onClose();
      return;
    }

    if (trimmed === tutorPin) {
      if (requiredRole === 'admin') {
        setErrorMsg('Esta función requiere permisos de Administrador. Por favor ingresa el PIN de Administrador.');
        return;
      }
      onLoginSuccess('tutor');
      onClose();
      return;
    }

    setErrorMsg('PIN incorrecto. Revisa el código ingresado o consulta con la dirección.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border-2 border-blue-100 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-blue-950 flex items-center justify-center font-black shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">
                Control de Acceso • Proyecto ¡PRESENTE!
              </span>
              <h3 className="text-base font-extrabold leading-tight">
                Ingresar PIN de Autorización
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-blue-700 text-blue-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {targetActionLabel && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Para <strong>{targetActionLabel}</strong> es necesario validar tus credenciales de Profesor/Tutor o Administrador.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Ingresa tu PIN de 4 dígitos:
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="• • • •"
                  autoFocus
                  className="w-full text-center text-2xl tracking-[0.5em] font-black py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white text-slate-800 outline-none transition-all"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black rounded-2xl text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validar PIN y Desbloquear Acceso</span>
            </button>
          </form>

          {/* Reference Cards for PIN levels */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Niveles de Acceso Disponibles:
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 font-extrabold text-blue-900">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Profesor / Tutor</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Gestión individual de grupo y sugerencias IA.
                </p>
                <div className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                  PIN por defecto: <span className="font-mono text-blue-700">2026</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 font-extrabold text-yellow-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
                  <span>Administrador</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Control total, asignación masiva y ajustes.
                </p>
                <div className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                  PIN por defecto: <span className="font-mono text-yellow-700">9988</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
