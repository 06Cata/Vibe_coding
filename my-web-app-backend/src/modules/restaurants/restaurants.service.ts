import { Injectable } from "@nestjs/common";
import { restaurants } from "./restaurants.data";

@Injectable()
export class RestaurantsService {
  getRestaurants() {
    return {
      office: {
        name: "國泰健康管理",
        address: "台北市大安區敦化南路二段333號",
        latitude: 25.0216448,
        longitude: 121.552896,
      },
      restaurants,
    };
  }
}
