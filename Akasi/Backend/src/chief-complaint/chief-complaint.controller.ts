import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  ParseIntPipe, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ChiefComplaintService } from './chief-complaint.service';
import { CreateChiefComplaintDto, UpdateChiefComplaintDto } from './dto/chief-complaint.dto';

@Controller('chief-complaint')
export class ChiefComplaintController {
  constructor(private readonly chiefComplaintService: ChiefComplaintService) {}

  @Post()
  create(@Body() createChiefComplaintDto: CreateChiefComplaintDto) {
    return this.chiefComplaintService.create(createChiefComplaintDto);
  }

  @Post('bulk')
  createMany(@Body() createChiefComplaintDtos: CreateChiefComplaintDto[]) {
    return this.chiefComplaintService.createMany(createChiefComplaintDtos);
  }

  @Get('consultation/:id')
  findAllByConsultation(@Param('id', ParseIntPipe) id: number) {
    return this.chiefComplaintService.findAllByConsultation(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chiefComplaintService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChiefComplaintDto: UpdateChiefComplaintDto,
  ) {
    return this.chiefComplaintService.update(id, updateChiefComplaintDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chiefComplaintService.remove(id);
  }

  @Delete('consultation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAllByConsultation(@Param('id', ParseIntPipe) id: number) {
    return this.chiefComplaintService.removeAllByConsultation(id);
  }
}
