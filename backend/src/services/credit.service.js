import { StatusCodes } from 'http-status-codes';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const applyCreditTransaction = async ({
  userId,
  amount,
  type,
  reason,
  referenceType = '',
  referenceId = '',
  metadata = {}
}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const nextBalance = user.credits + amount;
  if (nextBalance < 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient credits', {
      code: 'INSUFFICIENT_CREDITS'
    });
  }

  user.credits = nextBalance;
  await user.save();

  const transaction = await CreditTransaction.create({
    user: user._id,
    type,
    amount,
    balanceAfter: nextBalance,
    reason,
    referenceType,
    referenceId,
    metadata
  });

  return {
    user,
    transaction
  };
};

export const listCreditTransactions = async (userId, limit = 20) =>
  CreditTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean();
