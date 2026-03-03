import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyPartsEntity } from './body_parts.entity';

@Injectable()
export class BodyPartsService {
  constructor(
    @InjectRepository(BodyPartsEntity)
    private readonly bodyPartsRepository: Repository<BodyPartsEntity>,
  ) {}

  async findAll() {
    try {
      const bodyParts = await this.bodyPartsRepository.find();

      return bodyParts.map((part) => ({
        part_code: part.part_code,
        part_name: part.part_name,
      }));
    } catch (error) {
      throw error;
    }
  }
}
