import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WithdrawMethod } from '@prisma/client'

@Injectable()
export class WithdrawalsService {
  constructor(private prisma: PrismaService) {}

  async requestWithdrawal(
    userId: string,
    amount: number,
    method: string,
    target: string, // 👈 IBAN / PayPal / Wallet
  ) {
    if (amount <= 0) throw new BadRequestException('Invalid amount')
    if (!target) throw new BadRequestException('Target is required')

    const withdrawMethod = method.toUpperCase() as WithdrawMethod

    if (!Object.values(WithdrawMethod).includes(withdrawMethod)) {
      throw new BadRequestException('Invalid withdraw method')
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) throw new BadRequestException('User not found')
      if (user.points < amount) throw new BadRequestException('Not enough points')

      // 1️⃣ Withdrawal oluştur
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          method: withdrawMethod,
          target,              // 🔥 KRİTİK ALAN
          status: 'PENDING',
        },
      })

      // 2️⃣ Kullanıcıdan puanı düş
      await tx.user.update({
        where: { id: userId },
        data: {
          points: { decrement: amount },
        },
      })

      return {
        success: true,
        withdrawalId: withdrawal.id,
        remainingPoints: user.points - amount,
      }
    })
  }

  getPendingWithdrawals() {
    return this.prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            email: true,
            points: true,
          },
        },
      },
    })
  }

  async approveWithdrawal(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!withdrawal) {
      throw new BadRequestException('Withdrawal not found')
    }

    await this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'APPROVED' },
    })

    return {
      message: 'Withdrawal approved',
      user: withdrawal.user.email,
      amount: withdrawal.amount,
    }
  }
}

