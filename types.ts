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
  customerId: string;
  balance: number;
  isAdmin: boolean;
  isSuspended?: boolean;
  createdAt: any; // Firestore timestamp
  photoURL?: string | null;
  isDeleted?: boolean;
  deletedAt?: any; // Firestore timestamp or null
}

export interface Transaction {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  receiverAccountNumber: string;
  amount: number;
  type: 'transfer' | 'credit' | 'debit' | 'bill_payment' | 'loan_disbursement' | 'loan_repayment';
  description: string;
  timestamp: any; // Firestore timestamp
  status: 'completed' | 'pending' | 'failed';
}

export interface Loan {
  id?: string;
  userId: string;
  fullName: string;
  loanAmount: number;
  loanPurpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue';
  requestDate: any; // Firestore timestamp
  approvalDate?: any;
  dueDate?: any;
  interestRate?: number;
  totalOwed?: number;
}