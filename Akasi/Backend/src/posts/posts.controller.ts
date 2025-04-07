import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, NotFoundException, HttpStatus, HttpCode, InternalServerErrorException, Put, OnModuleInit } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Controller('posts')
export class PostsController implements OnModuleInit {
  constructor(private readonly postsService: PostsService) {}

  onModuleInit() {
    console.log('Posts controller initialized with routes:');
    console.log('PUT /posts/:id - Update post endpoint registered');
    console.log('POST /posts/:id/update - Alternative update endpoint registered');
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(@Body() post: { admin_id: number; username: string; caption?: string }, 
               @UploadedFiles() files: Express.Multer.File[]) {
    return this.postsService.create(post, files);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }
  
  @Post(':id/update')
  @UseInterceptors(FilesInterceptor('files'))
  async updateAlternative(
    @Param('id') id: string, 
    @Body() updatePostDto: { caption?: string, existingFiles?: string },
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    // Parse existingFiles JSON string if it exists
    let existingFileIds: number[] | undefined = undefined;
    if (updatePostDto.existingFiles) {
      try {
        existingFileIds = JSON.parse(updatePostDto.existingFiles);
      } catch (e) {
        console.error('Failed to parse existingFiles:', e);
      }
    }

    return this.postsService.update(
      +id, 
      { caption: updatePostDto.caption }, 
      files,
      existingFileIds
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }



  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    try {
      await this.postsService.remove(+id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
