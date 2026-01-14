import { Controller, Get, Post, Param, UseGuards, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  // 📥 Bekleyen task submitleri
  @Get('pending')
  getPending() {
    return this.prisma.taskCompletion.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, email: true, points: true } },
        task: { select: { id: true, title: true, rewardPoints: true } },
      },
    })
  }

  // ✅ Task onayla → sadece 1 kere çalışır
  @Post('approve/:id')
  async approve(@Param('id') id: string) {
    const completion = await this.prisma.taskCompletion.findUnique({
      where: { id },
      include: { user: true, task: true },
    })

    if (!completion) {
      throw new BadRequestException('Submission not found')
    }

    if (completion.status !== 'PENDING') {
      throw new BadRequestException('This task was already processed')
    }

    // 1️⃣ Mark as approved
    await this.prisma.taskCompletion.update({
      where: { id },
      data: { status: 'APPROVED' },
    })

    // 2️⃣ Add points
    await this.prisma.user.update({
      where: { id: completion.userId },
      data: {
        points: {
          increment: completion.task.rewardPoints,
        },
      },
    })

    return {
      message: 'Task approved',
      user: completion.user.email,
      pointsAdded: completion.task.rewardPoints,
    }
  }
}
