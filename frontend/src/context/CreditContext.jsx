import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import accountService from '../services/accountService';
import { useAuth } from './AuthContext';

const CreditContext = createContext(null);

const normalizeTransaction = (item = {}) => ({
  ...item,
  id: item.id || item._id || `tx-${Math.random().toString(36).slice(2, 10)}`,
  type: item.type || 'debit',
  amount: Number(item.amount || 0),
  reason: item.reason || item.toolName || 'Credit activity',
  timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
  balanceAfter: Number(item.balanceAfter || 0)
});

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const { user, isDemo, isAuthenticated, isLoading: authLoading, refreshUser, updateUser } = useAuth();
  const [credits, setCredits] = useState(0);
  const [pendingCost, setPendingCost] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);

  useEffect(() => {
    setCredits(user?.credits || 0);
  }, [user?.credits]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setTransactionHistory([]);
      return;
    }

    accountService
      .getCredits()
      .then((payload) => {
        setTransactionHistory(Array.isArray(payload) ? payload.map(normalizeTransaction) : []);
      })
      .catch((error) => {
        console.error('[CreditContext] Failed to load credit transactions:', error);
        setTransactionHistory([]);
      });
  }, [authLoading, isAuthenticated]);

  const isLowCredits = useMemo(() => {
    const threshold = user?.role === 'user' ? 100 : 50;
    return credits < threshold;
  }, [credits, user?.role]);

  const previewCost = useCallback((cost) => {
    setPendingCost(cost);
  }, []);

  const clearPreview = useCallback(() => {
    setPendingCost(0);
  }, []);

  const pushLocalTransaction = useCallback((transaction) => {
    setTransactionHistory((previous) => [normalizeTransaction(transaction), ...previous].slice(0, 50));
  }, []);

  const consumeCredits = useCallback(
    (amount, toolName = 'Tool', toolId = 'manual') => {
      if (credits < amount) {
        return {
          success: false,
          error: 'Insufficient credits',
          remaining: credits
        };
      }

      const newBalance = credits - amount;
      setCredits(newBalance);
      setPendingCost(0);
      updateUser?.({
        ...(user || {}),
        credits: newBalance
      });

      pushLocalTransaction({
        id: `tx-${Date.now()}`,
        type: 'debit',
        amount: -Math.abs(amount),
        reason: `${toolName} execution`,
        toolId,
        timestamp: new Date().toISOString(),
        balanceAfter: newBalance
      });

      return {
        success: true,
        consumed: amount,
        remaining: newBalance
      };
    },
    [credits, pushLocalTransaction, updateUser, user]
  );

  const addCredits = useCallback(
    (amount, reason = 'Credit adjustment') => {
      const newBalance = credits + amount;
      setCredits(newBalance);
      updateUser?.({
        ...(user || {}),
        credits: newBalance
      });

      pushLocalTransaction({
        id: `tx-${Date.now()}`,
        type: 'credit',
        amount: Math.abs(amount),
        reason,
        timestamp: new Date().toISOString(),
        balanceAfter: newBalance
      });

      return {
        success: true,
        added: amount,
        newBalance
      };
    },
    [credits, pushLocalTransaction, updateUser, user]
  );

  const canAfford = useCallback((amount) => credits >= amount, [credits]);

  const resetCredits = useCallback(() => {
    setCredits(user?.credits || 0);
    setPendingCost(0);
  }, [user?.credits]);

  const refreshCredits = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      setCredits(user?.credits || 0);
      setTransactionHistory([]);
      return user?.credits || 0;
    }

    const [latestUser, transactions] = await Promise.all([
      refreshUser ? refreshUser() : Promise.resolve(user),
      accountService.getCredits()
    ]);

    const nextBalance = latestUser?.credits || 0;
    setCredits(nextBalance);
    setPendingCost(0);
    setTransactionHistory(Array.isArray(transactions) ? transactions.map(normalizeTransaction) : []);

    return nextBalance;
  }, [authLoading, isAuthenticated, refreshUser, user]);

  const getCreditDisplay = useCallback(() => {
    const maxCredits = user?.creditLimit || (user?.role === 'user' ? 1000 : 500);
    const percentage = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;

    let status = 'healthy';
    let color = 'emerald';

    if (percentage < 20) {
      status = 'critical';
      color = 'red';
    } else if (percentage < 40) {
      status = 'warning';
      color = 'amber';
    }

    return {
      current: credits,
      max: maxCredits,
      percentage: Math.min(percentage, 100),
      status,
      color,
      pending: pendingCost,
      afterPending: credits - pendingCost
    };
  }, [credits, pendingCost, user?.creditLimit, user?.role]);

  const value = useMemo(
    () => ({
      credits,
      pendingCost,
      transactionHistory,
      isLowCredits,
      previewCost,
      clearPreview,
      consumeCredits,
      addCredits,
      canAfford,
      resetCredits,
      refreshCredits,
      getCreditDisplay,
      isDemo
    }),
    [
      addCredits,
      canAfford,
      clearPreview,
      consumeCredits,
      credits,
      getCreditDisplay,
      isDemo,
      isLowCredits,
      pendingCost,
      previewCost,
      refreshCredits,
      resetCredits,
      transactionHistory
    ]
  );

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
};

export default CreditContext;
