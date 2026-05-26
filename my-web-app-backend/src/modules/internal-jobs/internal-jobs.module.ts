import { Module } from "@nestjs/common";
import { InternalJobsController } from "./internal-jobs.controller";
import { InternalJobsService } from "./internal-jobs.service";

@Module({
  controllers: [InternalJobsController],
  providers: [InternalJobsService],
  exports: [InternalJobsService],
})
export class InternalJobsModule {}
