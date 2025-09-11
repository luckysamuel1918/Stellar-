import React from 'react';

// New Types for Firestore Data Models
export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  address:string;
  state: string;
  country: string;
  currencyCode: string;
  accountNumber: string;
  balance: number;
  isAdmin: boolean;
  createdAt: any; // Firestore timestamp
}

export interface Transaction {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  receiverAccountNumber: string;
  amount: number;
  type: 'transfer' | 'credit' | 'debit' | 'bill_payment';
  description: string;
  timestamp: any; // Firestore timestamp
  status: 'completed' | 'pending' | 'failed';
}