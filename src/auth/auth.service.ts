import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // 📝 Register
  async register(email: string, password: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ConflictException('Email already exists')

    const hash = await bcrypt.hash(password, 10)

    const user = await this.prisma.user.create({
      data: { email, password: hash },
    })

    return {
      ...this.sign(user.id, user.email, user.role),
      user: {
        id: user.id,
        email: user.email,
        points: user.points,
        role: user.role,
      },
    }
  }

  // 🔐 Login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    return {
      ...this.sign(user.id, user.email, user.role),
      user: {
        id: user.id,
        email: user.email,
        points: user.points,
        role: user.role,
      },
    }
  }

  // 🐝 Logged in user profile
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        points: true,
        role: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  private sign(id: string, email: string, role: string) {
    return {
      accessToken: this.jwt.sign({ sub: id, email, role }),
    }
  }
}
