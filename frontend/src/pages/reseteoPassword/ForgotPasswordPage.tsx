import React, { useState } from 'react';
import { ForgotPassword } from '../../Components/forgotPassword/ForgotPassword';
import { CodeVerification } from '../../Components/codeVerification/CodeVerification';
import { ResetPassword } from '../../Components/resetPassword/ResetPassword';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [userEmail, setUserEmail] = useState('');
  const [verifiedCode, setVerifiedCode] = useState(''); 

  const handleCodeSent = (email: string) => {
    setUserEmail(email);
    setStep('verify'); 
  };

  const handleCodeVerified = (code: string) => {
    setVerifiedCode(code); 
    setStep('reset'); 
  };

  return (
    <div className="auth-flow-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Restablecer Contraseña</h1>
          <div className="step-indicator">
            <div className={`step ${step === 'email' ? 'active' : ''} ${step === 'verify' || step === 'reset' ? 'completed' : ''}`}>
              <span>1</span>
              <p>Email</p>
            </div>
            <div className={`step ${step === 'verify' ? 'active' : ''} ${step === 'reset' ? 'completed' : ''}`}>
              <span>2</span>
              <p>Código</p>
            </div>
            <div className={`step ${step === 'reset' ? 'active' : ''}`}>
              <span>3</span>
              <p>Nueva Contraseña</p>
            </div>
          </div>
        </div>
        
        <div className="auth-content">
          {step === 'email' && (
            <ForgotPassword onCodeSent={handleCodeSent} />
          )}

          {step === 'verify' && (
            <CodeVerification 
              email={userEmail} 
              onCodeVerified={handleCodeVerified} 
            />
          )}

          {step === 'reset' && (
            <ResetPassword code={verifiedCode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
