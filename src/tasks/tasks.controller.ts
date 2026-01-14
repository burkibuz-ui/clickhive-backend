import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  getTasks() {
    return this.tasks.getActiveTasks()
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  complete(@Req() req, @Param('id') id: string) {
    const userId = req.user.sub
    return this.tasks.completeTask(userId, id, req.ip)
  }

  @Post()
  create(@Body() body: any) {
    return this.tasks.createTask(body)
  }
}
