import React from 'react';
import { BankAccountProvider } from '../context/BankAccountContext';

/**
 * Wrapper component cho Bank Account functionality
 * Sử dụng để wrap các page cần bank account features
 */
const WithBankAccounts = ({ children }) => {
  return (
    <BankAccountProvider>
      {children}
    </BankAccountProvider>
  );
};

export default WithBankAccounts;