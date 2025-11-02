import React, { useState } from 'react';
import { ResetPassword } from '../../Components/ResetPassword';
import { ForgotPassword } from '../../Components/ForgotPassword';

const ForgotPasswordPage = () => {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 

  const handleCodeSent = (email: string) => {
    setUserEmail(email);
    setIsCodeSent(true);
  };

  return (
    <div className="auth-container">
      {!isCodeSent ? (
        <ForgotPassword onCodeSent={handleCodeSent} />
      ) : (
        <ResetPassword email={userEmail} />
      )}
    </div>
  );
};

export default ForgotPasswordPage;