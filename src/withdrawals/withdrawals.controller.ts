import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common'
import { WithdrawalsService } from './withdrawals.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private withdrawals: WithdrawalsService) {}

  // 🧍 User requests a withdrawal
  @UseGuards(JwtAuthGuard)
  @Post()
  request(
    @Req() req,
    @Body()
    body: {
      amount: number
      method: string
      target: string // 👈 IBAN / PayPal / Wallet
    },
  ) {
    return this.withdrawals.requestWithdrawal(
      req.user.sub,
      body.amount,
      body.method,
      body.target,
    )
  }

  // 🛡 Admin sees pending withdrawals
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('pending')
  getPending() {
    return this.withdrawals.getPendingWithdrawals()
  }

  // 🛡 Admin approves withdrawal
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.withdrawals.approveWithdrawal(id)
  }
}
