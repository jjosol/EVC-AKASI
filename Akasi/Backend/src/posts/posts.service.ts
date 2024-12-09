import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(post: any) {
    console.log('Received post data:', post);
    return this.prisma.hSU_bulletin.create({
      data: {
        admin_id: post.admin_id,
        username: post.username,
        caption: post.caption,
        file: post.file,
      },
    });
  }

  async findAll() {
    return this.prisma.hSU_bulletin.findMany({
      include: {
        admin: true // Include the related admin data
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.hSU_bulletin.findUnique({
      where: { post_id: id },
    });
  }

  async update(id: number, updatePost: any) {
    return this.prisma.hSU_bulletin.update({
      where: { post_id: id },
      data: updatePost,
    });
  }

  async remove(id: number) {
    return this.prisma.hSU_bulletin.delete({
      where: { post_id: id },
    });
  }
}