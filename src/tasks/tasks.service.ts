import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Kullanıcıların gördüğü aktif görevler
  getActiveTasks() {
    return this.prisma.task.findMany({
      where: { active: true },
    })
  }

  // Admin görev oluşturur
  createTask(data: any) {
    return this.prisma.task.create({
      data,
    })
  }

  // Kullanıcı görevi tamamladım dediğinde
  async completeTask(userId: string, taskId: string, ip = '127.0.0.1') {
    // Aynı kullanıcı bu görevi daha önce göndermiş mi?
    const existing = await this.prisma.taskCompletion.findFirst({
      where: {
        userId,
        taskId,
      },
    })

    if (existing) {
      return {
        alreadyCompleted: true,
        status: existing.status,
        message: 'You already submitted this task',
      }
    }

    // İlk kez gönderiyorsa kaydet
    return this.prisma.taskCompletion.create({
      data: {
        userId,
        taskId,
        ip,
      },
    })
  }

  // Admin paneli – bekleyen gönderimler
  getPending() {
    return this.prisma.taskCompletion.findMany({
      where: { status: 'PENDING' },
      include: {
        task: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  // Admin onaylar
  async approve(id: string) {
    const completion = await this.prisma.taskCompletion.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        task: true,
        user: true,
      },
    })

    // Kullanıcıya puan ekle
    await this.prisma.user.update({
      where: { id: completion.userId },
      data: {
        points: {
          increment: completion.task.rewardPoints,
        },
      },
    })

    return completion
  }
}
