/**
 * Utilidades para Biometría / Passkeys (Device-bound)
 * Este módulo permite usar el sensor biométrico del dispositivo para
 * 'recordar' y 'autenticar' al usuario localmente.
 */

export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  
  // Verificar si el dispositivo soporta autenticación de plataforma (TouchID/FaceID/Hello)
  return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

/**
 * Registra una 'Llave de Acceso' local para el dispositivo.
 * Guarda las credenciales de forma segura para permitir login rápido.
 */
export async function registerLocalPasskey(email: string): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userID = new TextEncoder().encode(email);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Inversiones Traviani",
        id: window.location.hostname,
      },
      user: {
        id: userID,
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "direct",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (credential) {
      // En una implementación real, guardaríamos el ID de la credencial en el servidor.
      // Para este demo, usaremos localStorage para saber que este dispositivo está enrolado.
      localStorage.setItem('biometric_enrolled_user', email);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error al registrar biometría:", err);
    return false;
  }
}

/**
 * Autentica al usuario usando el sensor biométrico.
 */
export async function authenticateWithBiometrics(): Promise<string | null> {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [], // Permitir cualquier credencial registrada en este RP
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      // Si la biometría es exitosa, devolvemos el usuario que estaba guardado.
      return localStorage.getItem('biometric_enrolled_user');
    }
    return null;
  } catch (err) {
    console.error("Error en autenticación biométrica:", err);
    return null;
  }
}
