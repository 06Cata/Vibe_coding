import { Controller, Get } from "@nestjs/common";
import { RestaurantsService } from "./restaurants.service";

@Controller("api/restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  getRestaurants() {
    return this.restaurantsService.getRestaurants();
  }
}
