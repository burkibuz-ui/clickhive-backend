import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // 🔐 Register
  @Post('register')
  register(@Body() body: { email: string; password: string }) {
    return this.auth.register(body.email, body.password)
  }

  // 🔐 Login
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password)
  }

  // 🐝 Get logged-in user (email, points, role)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req) {
    return this.auth.me(req.user.sub)
  }
}
