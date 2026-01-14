import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { PrismaModule } from './prisma/prisma.module'
import { AdminModule } from './admin/admin.module'
import { TasksModule } from './tasks/tasks.module'
import { WithdrawalsModule } from './withdrawals/withdrawals.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    TasksModule,
    WithdrawalsModule, // 👈 para sistemi bağlandı
  ],
})
export class AppModule {}
